"""
app/services/ai_service.py
Service tich hop Google Gemini AI cho chuc nang chat.
Giai đoạn 3: Hỗ trợ tự động nhập giao dịch qua ngôn ngữ tự nhiên.
"""

import json
import os
import re
import ssl
import unicodedata
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

GEMINI_API_URL_TEMPLATE = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")


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
        print(f"[*] Gemini SSL via env CA bundle: {env_ca}")
        return ssl.create_default_context(cafile=env_ca)

    try:
        import truststore

        print("[*] Gemini SSL via truststore SSLContext")
        return truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    except Exception as e:
        print(f"[!] truststore SSLContext unavailable for Gemini client: {e}")

    try:
        import certifi

        cert_path = certifi.where()
        print(f"[*] Gemini SSL via certifi: {cert_path}")
        return ssl.create_default_context(cafile=cert_path)
    except Exception as e:
        print(f"[!] certifi unavailable for Gemini client: {e}")

    print("[!] Gemini SSL fallback: default context")
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


def _format_vnd(value: Decimal) -> str:
    amount = int(value or 0)
    return f"{amount:,}".replace(",", ".") + " \u0111"


def _normalize_text(value: str) -> str:
    normalized = unicodedata.normalize("NFD", value.lower().strip())
    return "".join(char for char in normalized if unicodedata.category(char) != "Mn")


def _try_handle_builtin_query(user_message: str, db: Session, user_id: uuid.UUID) -> dict | None:
    text = _normalize_text(user_message)

    greetings = {"chao", "hello", "hi", "xin chao", "alo"}
    if text in greetings:
        return {
            "message": "Xin ch\u00e0o! T\u00f4i c\u00f3 th\u1ec3 gi\u00fap b\u1ea1n ghi giao d\u1ecbch, xem s\u1ed1 d\u01b0 t\u00e0i kho\u1ea3n v\u00e0 tr\u1ea3 l\u1eddi nhanh c\u00e1c th\u00f4ng tin t\u00e0i ch\u00ednh trong Spending Plus.",
            "transaction_created": False,
        }

    if any(phrase in text for phrase in ["lam nhung gi", "giup gi", "chuc nang", "co the lam gi"]):
        return {
            "message": "T\u00f4i c\u00f3 th\u1ec3 gi\u00fap b\u1ea1n:\n- T\u1ef1 \u0111\u1ed9ng ghi giao d\u1ecbch, v\u00ed d\u1ee5: '\u0103n ph\u1edf 50k'\n- Xem s\u1ed1 d\u01b0 t\u00e0i kho\u1ea3n/v\u00ed\n- H\u1ed7 tr\u1ee3 ph\u00e2n lo\u1ea1i thu chi c\u01a1 b\u1ea3n\n- L\u01b0u l\u1ecbch s\u1eed tr\u00f2 chuy\u1ec7n",
            "transaction_created": False,
        }

    balance_keywords = ["con bao nhieu", "so du", "balance", "bao nhieu tien"]
    if any(keyword in text for keyword in balance_keywords):
        accounts = (
            db.query(models.Account)
            .filter(models.Account.user_id == user_id, models.Account.deleted_at.is_(None))
            .order_by(models.Account.created_at.asc())
            .all()
        )

        if "ngan hang" in text or "bank" in text:
            accounts = [
                account for account in accounts
                if (account.type or "").lower() == "bank"
                or "ngan hang" in _normalize_text(account.name or "")
                or "bank" in _normalize_text(account.name or "")
            ]
            label = "t\u00e0i kho\u1ea3n ng\u00e2n h\u00e0ng"
        else:
            label = "t\u00e0i kho\u1ea3n"

        if not accounts:
            return {
                "message": f"B\u1ea1n ch\u01b0a c\u00f3 {label} n\u00e0o trong h\u1ec7 th\u1ed1ng.",
                "transaction_created": False,
            }

        total = sum((Decimal(account.balance or 0) for account in accounts), Decimal("0"))
        lines = [f"T\u1ed5ng s\u1ed1 d\u01b0 {label}: {_format_vnd(total)}"]
        lines.extend(f"- {account.name}: {_format_vnd(Decimal(account.balance or 0))}" for account in accounts)
        return {
            "message": "\n".join(lines),
            "transaction_created": False,
        }

    return None


class AIService:
    """
    Wrapper async cho Google Gemini GenerateContent API.
    """

    def __init__(self):
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY chua duoc cau hinh trong .env")

        self.api_key = settings.GEMINI_API_KEY
        self.ssl_context = _build_ssl_context()

    async def _call_gemini(self, user_message: str, system_instruction: str) -> str:
        import asyncio
        import time

        start_time = time.time()

        payload = {
            "systemInstruction": {
                "parts": [{"text": system_instruction}],
            },
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": user_message}],
                }
            ],
            "generationConfig": {
                "temperature": 0.1,
                "responseMimeType": "application/json",
            },
        }

        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "x-goog-api-key": self.api_key,
            "User-Agent": "SpendingPlus/1.0 (+https://spending-plus.local)",
        }

        try:
            print(f"[*] Calling Gemini... (Model: {GEMINI_MODEL})")

            def _sync_call() -> str:
                request = urllib.request.Request(
                    GEMINI_API_URL_TEMPLATE.format(model=GEMINI_MODEL),
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
                    candidates = body.get("candidates") or []
                    if not candidates:
                        raise RuntimeError(f"Gemini khong tra ve candidates: {body}")
                    parts = candidates[0].get("content", {}).get("parts") or []
                    if not parts or "text" not in parts[0]:
                        raise RuntimeError(f"Gemini response khong co text: {body}")
                    return parts[0]["text"]

            response_text = await asyncio.to_thread(_sync_call)
            duration = time.time() - start_time
            print(f"[+] Gemini responded in {duration:.2f}s")
            return response_text

        except urllib.error.HTTPError as e:
            duration = time.time() - start_time
            error_body = e.read().decode("utf-8", errors="ignore")
            print(f"[!] Gemini HTTP Error after {duration:.2f}s: {error_body}")
            raise RuntimeError(f"Gemini API loi HTTP {e.code}: {error_body}") from e
        except Exception as e:
            duration = time.time() - start_time
            print(f"[!] Gemini Error after {duration:.2f}s: {str(e)}")
            raise

    async def process_chat(
        self,
        user_message: str,
        db: Session,
        user_id: uuid.UUID,
    ) -> dict:
        try:
            builtin_reply = _try_handle_builtin_query(user_message, db, user_id)
            if builtin_reply:
                return builtin_reply

            current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            full_instruction = (
                f"Thời gian hệ thống hiện tại: {current_time}\n\n"
                f"{SYSTEM_INSTRUCTION_BASE}"
            )

            raw_reply = await self._call_gemini(user_message, full_instruction)

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
            raise RuntimeError(f"Loi khi goi Gemini AI: {str(e)}") from e

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
