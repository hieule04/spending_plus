"""
app/services/ai_service.py
Service tích hợp Groq AI cho chức năng chat.
Giai đoạn 3: Hỗ trợ tự động nhập giao dịch qua ngôn ngữ tự nhiên.
"""

import json
import os
import re
import ssl
import urllib.error
import urllib.request
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app import models, schemas
from app.crud import transactions as crud_txn


SYSTEM_INSTRUCTION_BASE = """\
Bạn là bộ phân tích giao dịch của ứng dụng Spending Plus.
Nhiệm vụ duy nhất của bạn là đọc tin nhắn hiện tại của người dùng và bóc tách thông tin để tạo giao dịch mới nếu có thể.

Bạn PHẢI luôn trả về chỉ duy nhất một JSON hợp lệ, không markdown, không backtick, theo một trong 2 cấu trúc sau:

{"action": "create_transaction", "transaction_data": {"amount": <số tiền VNĐ, kiểu số nguyên>, "type": "<expense hoặc income>", "category_name": "<tên danh mục ngắn gọn, phù hợp nhất>", "note": "<ghi chú ngắn gọn>", "date": "<YYYY-MM-DD>"}, "message": "<câu xác nhận ngắn gọn>"}

{"action": "none", "transaction_data": null, "message": "<câu trả lời ngắn gọn nói rằng chưa đủ dữ liệu để tạo giao dịch hoặc tin nhắn không phải yêu cầu ghi giao dịch>"}

Quy tắc bắt buộc:
- Chỉ tập trung vào hành động tạo giao dịch từ tin nhắn hiện tại.
- Nếu người dùng nói 'k', 'nghìn', hoặc 'ngàn' thì nhân với 1000.
- Nếu người dùng nói 'triệu' hoặc 'tr' thì nhân với 1000000.
- Nếu không nói rõ ngày, dùng ngày hiện tại của hệ thống được cung cấp.
- Nếu nói 'hôm qua', tính lùi 1 ngày. Nếu nói 'hôm kia', tính lùi 2 ngày.
- Nếu không rõ là thu hay chi, mặc định là 'expense'.
- `category_name` phải là một tên danh mục ngắn, tự nhiên, phù hợp với nội dung tin nhắn.
- `note` phải ngắn gọn, bám sát nội dung người dùng.
- Nếu chưa đủ dữ liệu để tạo giao dịch, trả về action là "none".
"""

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"


def _parse_ai_response(raw_text: str) -> dict:
    text = raw_text.strip()
    text = re.sub(r'^```(?:json)?\s*', '', text)
    text = re.sub(r'\s*```$', '', text)
    text = text.strip()

    try:
        data = json.loads(text)
        if "action" in data and "message" in data:
            return data
    except (json.JSONDecodeError, TypeError):
        pass

    return {
        "action": "none",
        "transaction_data": None,
        "message": raw_text.strip(),
    }


def _build_ssl_context() -> ssl.SSLContext:
    env_ca = os.getenv("SSL_CERT_FILE") or os.getenv("REQUESTS_CA_BUNDLE")
    if env_ca:
        print(f"[*] Groq SSL via env CA bundle: {env_ca}")
        return ssl.create_default_context(cafile=env_ca)

    try:
        import truststore

        print("[*] Groq SSL via truststore SSLContext")
        return truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    except Exception as e:
        print(f"[!] truststore SSLContext unavailable for Groq client: {e}")

    try:
        import certifi

        cert_path = certifi.where()
        print(f"[*] Groq SSL via certifi: {cert_path}")
        return ssl.create_default_context(cafile=cert_path)
    except Exception as e:
        print(f"[!] certifi unavailable for Groq client: {e}")

    print("[!] Groq SSL fallback: default context")
    return ssl.create_default_context()


def _get_default_ai_account(user_id: uuid.UUID, db: Session) -> models.Account | None:
    accounts = (
        db.query(models.Account)
        .filter(models.Account.user_id == user_id)
        .order_by(models.Account.created_at.asc())
        .all()
    )
    if not accounts:
        return None

    account_type_priority = {
        "credit": 0,
        "bank": 1,
        "e-wallet": 2,
        "saving": 3,
        "cash": 4,
    }

    return min(
        accounts,
        key=lambda account: (
            account_type_priority.get((account.type or "").lower(), 99),
            account.created_at or datetime.min,
        ),
    )


class AIService:
    """
    Wrapper async cho Groq Chat Completions API.
    """

    def __init__(self):
        if not settings.GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY chưa được cấu hình trong .env")

        self.api_key = settings.GROQ_API_KEY
        self.ssl_context = _build_ssl_context()

    async def _call_groq(self, user_message: str, system_instruction: str) -> str:
        import asyncio
        import time

        start_time = time.time()

        payload = {
            "model": GROQ_MODEL,
            "temperature": 0.1,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": user_message},
            ],
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        try:
            print(f"[*] Calling Groq... (Model: {GROQ_MODEL})")

            def _sync_call() -> str:
                request = urllib.request.Request(
                    GROQ_API_URL,
                    data=json.dumps(payload).encode("utf-8"),
                    headers=headers,
                    method="POST",
                )
                with urllib.request.urlopen(
                    request,
                    context=self.ssl_context,
                    timeout=60,
                ) as response:
                    body = json.loads(response.read().decode("utf-8"))
                    return body["choices"][0]["message"]["content"]

            response_text = await asyncio.to_thread(_sync_call)
            duration = time.time() - start_time
            print(f"[+] Groq responded in {duration:.2f}s")
            return response_text

        except urllib.error.HTTPError as e:
            duration = time.time() - start_time
            error_body = e.read().decode("utf-8", errors="ignore")
            print(f"[!] Groq HTTP Error after {duration:.2f}s: {error_body}")
            raise RuntimeError(f"Groq API lỗi HTTP {e.code}: {error_body}") from e
        except Exception as e:
            duration = time.time() - start_time
            print(f"[!] Groq Error after {duration:.2f}s: {str(e)}")
            raise

    async def process_chat(
        self,
        user_message: str,
        db: Session,
        user_id: uuid.UUID,
    ) -> dict:
        try:
            current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            full_instruction = (
                f"Thời gian hệ thống hiện tại: {current_time}\n\n"
                f"{SYSTEM_INSTRUCTION_BASE}"
            )

            raw_reply = await self._call_groq(user_message, full_instruction)

            parsed = _parse_ai_response(raw_reply)
            action = parsed.get("action", "none")
            message = parsed.get("message", raw_reply)
            transaction_created = False

            if action == "create_transaction":
                txn_data = parsed.get("transaction_data")
                if txn_data:
                    try:
                        transaction_created = self._execute_transaction(
                            db, user_id, txn_data
                        )
                    except Exception:
                        message += "\n\n⚠️ Rất tiếc, không thể tự động tạo giao dịch. Vui lòng thêm thủ công."
                        transaction_created = False

            return {
                "message": message,
                "transaction_created": transaction_created,
            }

        except Exception as e:
            raise RuntimeError(f"Lỗi khi gọi Groq AI: {str(e)}") from e

    def _execute_transaction(
        self,
        db: Session,
        user_id: uuid.UUID,
        txn_data: dict,
    ) -> bool:
        amount = Decimal(str(txn_data.get("amount", 0)))
        txn_type = txn_data.get("type", "expense")
        category_name = txn_data.get("category_name", "")
        note = txn_data.get("note", "")
        date_str = txn_data.get("date", datetime.now().strftime("%Y-%m-%d"))

        try:
            txn_date = datetime.strptime(date_str, "%Y-%m-%d")
        except (ValueError, TypeError):
            txn_date = datetime.now()

        category_id = None
        if category_name:
            category = db.query(models.Category).filter(
                models.Category.user_id == user_id,
                func.lower(models.Category.name) == category_name.lower()
            ).first()
            if category:
                category_id = category.id

        account = _get_default_ai_account(user_id, db)
        if not account:
            return False

        txn_schema = schemas.TransactionCreate(
            amount=amount,
            type=txn_type,
            date=txn_date,
            note=note,
            account_id=account.id,
            category_id=category_id,
        )

        crud_txn.create_transaction(
            db=db,
            user_id=user_id,
            data=txn_schema,
            account=account,
        )

        return True


ai_service = AIService()
