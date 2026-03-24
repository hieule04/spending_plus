"""
app/services/ai_service.py
Service tích hợp Google Gemini AI cho chức năng chat.
Sử dụng google-genai SDK (phiên bản mới).
Giai đoạn 3: Hỗ trợ tự động nhập giao dịch qua ngôn ngữ tự nhiên.
"""

import json
import os
import re
import ssl
import uuid
from datetime import datetime
from decimal import Decimal

from google import genai
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from app.core.config import settings
from app import models, schemas
from app.crud import transactions as crud_txn
from app.crud import accounts as crud_accounts


# ============================================================
# System Prompt — hướng dẫn AI về vai trò và cách trả lời
# ============================================================

SYSTEM_INSTRUCTION_BASE = """\
Bạn là trợ lý tài chính của ứng dụng Spending Plus.
Hãy trả lời ngắn gọn, lịch sự.
Bạn có thể tư vấn về quản lý chi tiêu, tiết kiệm, ngân sách và đầu tư cá nhân.
Nếu câu hỏi không liên quan đến tài chính, hãy nhẹ nhàng hướng người dùng quay lại chủ đề.
Nếu người dùng hỏi về số dư, chi tiêu hoặc tư vấn, hãy dựa vào dữ liệu thực tế ở trên để trả lời chính xác.
Không được bịa đặt con số.

=== QUY TẮC TỰ ĐỘNG NHẬP GIAO DỊCH ===
Nếu người dùng có ý định thêm một giao dịch mới (ví dụ: 'mới tiêu 50k ăn phở', 'vừa ăn trưa 80 nghìn', 'thu về 5 triệu lương', 'hôm qua mua sách 120k'), bạn PHẢI trả về **chỉ duy nhất một JSON hợp lệ** (KHÔNG có markdown code fences, KHÔNG có backtick) theo đúng cấu trúc sau:

{"action": "create_transaction", "transaction_data": {"amount": <số tiền VNĐ, kiểu số nguyên>, "type": "<expense hoặc income>", "category_name": "<tên danh mục phù hợp nhất từ danh sách bên dưới>", "note": "<ghi chú ngắn gọn>", "date": "<YYYY-MM-DD>"}, "message": "<câu trả lời thân thiện xác nhận giao dịch>"}

Nếu người dùng KHÔNG có ý định thêm giao dịch (chỉ hỏi, trò chuyện, xin tư vấn...), bạn PHẢI trả về JSON:

{"action": "none", "transaction_data": null, "message": "<câu trả lời thông thường>"}

LƯU Ý QUAN TRỌNG:
- Luôn trả về JSON thuần túy, KHÔNG BAO GIỜ bọc trong ```json ... ``` hay bất kỳ markdown nào.
- Nếu người dùng nói 'k', 'nghìn', hoặc 'ngàn' thì nhân với 1000. Nếu nói 'triệu' hoặc 'tr' thì nhân với 1000000.
- Nếu không nói rõ ngày, dùng ngày hôm nay.
- Nếu nói 'hôm qua', tính lùi 1 ngày. 'Hôm kia' tính lùi 2 ngày.
- Nếu không rõ đó là thu hay chi, mặc định là 'expense'.
- Chọn category_name gần nhất từ danh sách danh mục bên dưới. Nếu không khớp, dùng danh mục chung nhất.
"""


# ============================================================
# Helper: Lấy ngữ cảnh tài chính
# ============================================================

def get_financial_context(user_id: uuid.UUID, db: Session) -> str:
    """Truy vấn dữ liệu tài chính của user để làm ngữ cảnh cung cấp cho AI."""
    now = datetime.now()
    current_month = now.month
    current_year = now.year

    # 1. Tổng số dư
    total_balance = db.query(func.sum(models.Account.balance)).filter(
        models.Account.user_id == user_id
    ).scalar() or 0.0

    # 2. Tổng chi tiêu tháng
    total_expense = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.user_id == user_id,
        models.Transaction.type == 'expense',
        extract('month', models.Transaction.date) == current_month,
        extract('year', models.Transaction.date) == current_year
    ).scalar() or 0.0

    # 3. Mục tiêu tiết kiệm và tiến độ
    savings_goals = db.query(models.SavingsGoal).filter(
        models.SavingsGoal.user_id == user_id,
        models.SavingsGoal.is_completed == False
    ).all()
    saving_texts = []
    for sg in savings_goals:
        pct = (sg.current_amount / sg.target_amount * 100) if sg.target_amount > 0 else 0
        saving_texts.append(f'- Sổ "{sg.name}": đạt {pct:.1f}% ({float(sg.current_amount):,.0f}đ / {float(sg.target_amount):,.0f}đ)')
    saving_str = "\n".join(saving_texts) if saving_texts else "Không có"

    # 4. Các khoản nợ
    debts = db.query(models.Debt).filter(
        models.Debt.user_id == user_id,
        models.Debt.remaining_amount > 0
    ).all()
    debt_texts = []
    for d in debts:
        debt_texts.append(f'- Nợ "{d.creditor_name}": còn nợ {float(d.remaining_amount):,.0f}đ, trả mỗi tháng {float(d.monthly_payment):,.0f}đ')
    debt_str = "\n".join(debt_texts) if debt_texts else "Không có"

    # 5. Ngân sách tháng này
    budgets = db.query(models.Budget).filter(
        models.Budget.user_id == user_id,
        models.Budget.month == current_month,
        models.Budget.year == current_year
    ).all()
    total_budget_limit = sum(b.amount_limit for b in budgets) or 0.0
    remaining_budget = float(total_budget_limit) - float(total_expense)

    # 6. Danh sách danh mục
    categories = db.query(models.Category).filter(
        models.Category.user_id == user_id
    ).all()
    category_texts = []
    for cat in categories:
        category_texts.append(f'- "{cat.name}" (loại: {cat.type})')
    category_str = "\n".join(category_texts) if category_texts else "Chưa có danh mục nào"

    # 7. Danh sách tài khoản
    accounts = db.query(models.Account).filter(
        models.Account.user_id == user_id
    ).all()
    account_texts = []
    for acc in accounts:
        account_texts.append(f'- "{acc.name}" (loại: {acc.type}, số dư: {float(acc.balance):,.0f}đ)')
    account_str = "\n".join(account_texts) if account_texts else "Chưa có tài khoản nào"

    context = (
        f"Ngày hiện tại: {now.strftime('%d/%m/%Y')}.\n\n"
        f"Ngữ cảnh tài chính của người dùng:\n"
        f"Tổng số dư: {float(total_balance):,.0f}đ.\n"
        f"Đã chi tháng này ({current_month}/{current_year}): {float(total_expense):,.0f}đ.\n"
        f"Ngân sách tháng này: {float(total_budget_limit):,.0f}đ (còn lại: {remaining_budget:,.0f}đ).\n\n"
        f"Tiết kiệm đang theo dõi:\n{saving_str}\n\n"
        f"Các khoản nợ đang theo dõi:\n{debt_str}\n\n"
        f"Danh sách danh mục của người dùng:\n{category_str}\n\n"
        f"Danh sách tài khoản của người dùng:\n{account_str}"
    )
    return context


# ============================================================
# Helper: Parse phản hồi JSON từ AI
# ============================================================

def _parse_ai_response(raw_text: str) -> dict:
    """
    Parse JSON từ phản hồi của AI.
    Xử lý trường hợp AI trả về có hoặc không có markdown code fences.
    """
    text = raw_text.strip()

    # Loại bỏ markdown code fences nếu có
    text = re.sub(r'^```(?:json)?\s*', '', text)
    text = re.sub(r'\s*```$', '', text)
    text = text.strip()

    try:
        data = json.loads(text)
        # Validate cấu trúc cơ bản
        if "action" in data and "message" in data:
            return data
    except (json.JSONDecodeError, TypeError):
        pass

    # Fallback: trả về raw text nếu không parse được
    return {
        "action": "none",
        "transaction_data": None,
        "message": raw_text.strip(),
    }




def _build_ssl_verify():
    """
    Tạo cấu hình verify cho HTTP client của google-genai.
    Ưu tiên: biến môi trường SSL -> truststore (Windows cert store) -> certifi.
    """
    env_ca = os.getenv("SSL_CERT_FILE") or os.getenv("REQUESTS_CA_BUNDLE")
    if env_ca:
        print(f"[*] Gemini SSL verify via env CA bundle: {env_ca}")
        return env_ca

    try:
        import truststore

        ctx = truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
        print("[*] Gemini SSL verify via truststore SSLContext")
        return ctx
    except Exception as e:
        print(f"[!] truststore SSLContext unavailable for Gemini client: {e}")

    try:
        import certifi

        cert_path = certifi.where()
        print(f"[*] Gemini SSL verify via certifi: {cert_path}")
        return cert_path
    except Exception as e:
        print(f"[!] certifi unavailable for Gemini client: {e}")

    print("[!] Gemini SSL verify fallback: default True")
    return True

def _build_http_options(verify_value):
    return genai.types.HttpOptions(
        client_args={"verify": verify_value},
        async_client_args={"verify": verify_value},
    )
# ============================================================
# AIService Class
# ============================================================

class AIService:
    """
    Wrapper async cho Google Genai SDK.
    Sử dụng model gemini-flash-latest với system instruction.
    """

    def __init__(self):
        if not settings.GOOGLE_API_KEY:
            raise ValueError("GOOGLE_API_KEY chưa được cấu hình trong .env")

        self._ssl_verify = _build_ssl_verify()
        self.client = genai.Client(
            api_key=settings.GOOGLE_API_KEY,
            http_options=_build_http_options(self._ssl_verify),
        )

    async def _call_gemini(self, user_message: str, system_instruction: str) -> str:
        """Gọi Gemini API và trả về raw text."""
        try:
            response = await self.client.aio.models.generate_content(
                model="gemini-flash-latest",
                contents=user_message,
                config=genai.types.GenerateContentConfig(
                    system_instruction=system_instruction,
                ),
            )
            return response.text
        except Exception as e:
            if "CERTIFICATE_VERIFY_FAILED" not in str(e) or self._ssl_verify is False:
                raise

            print("[!] Gemini SSL verify failed; retrying once with verify=False (insecure).")
            self._ssl_verify = False
            self.client = genai.Client(
                api_key=settings.GOOGLE_API_KEY,
                http_options=_build_http_options(False),
            )

            response = await self.client.aio.models.generate_content(
                model="gemini-flash-latest",
                contents=user_message,
                config=genai.types.GenerateContentConfig(
                    system_instruction=system_instruction,
                ),
            )
            return response.text

    async def process_chat(
        self,
        user_message: str,
        db: Session,
        user_id: uuid.UUID,
    ) -> dict:
        """
        Xử lý tin nhắn chat:
        1. Tạo system instruction động (ngữ cảnh tài chính + quy tắc).
        2. Gọi Gemini.
        3. Parse JSON → nếu có action 'create_transaction' thì tự động tạo giao dịch.
        4. Trả về dict {"message": str, "transaction_created": bool}.
        """
        try:
            # Build system instruction
            financial_context = get_financial_context(user_id, db)
            full_instruction = f"{financial_context}\n\n{SYSTEM_INSTRUCTION_BASE}"

            # Gọi Gemini
            raw_reply = await self._call_gemini(user_message, full_instruction)

            # Parse JSON
            parsed = _parse_ai_response(raw_reply)
            action = parsed.get("action", "none")
            message = parsed.get("message", raw_reply)
            transaction_created = False

            # Xử lý tạo giao dịch tự động
            if action == "create_transaction":
                txn_data = parsed.get("transaction_data")
                if txn_data:
                    try:
                        transaction_created = self._execute_transaction(
                            db, user_id, txn_data
                        )
                    except Exception:
                        # Nếu tạo giao dịch thất bại, vẫn trả message cho user
                        message += "\n\n⚠️ Rất tiếc, không thể tự động tạo giao dịch. Vui lòng thêm thủ công."
                        transaction_created = False

            return {
                "message": message,
                "transaction_created": transaction_created,
            }

        except Exception as e:
            raise RuntimeError(f"Lỗi khi gọi Gemini AI: {str(e)}") from e

    def _execute_transaction(
        self,
        db: Session,
        user_id: uuid.UUID,
        txn_data: dict,
    ) -> bool:
        """
        Tạo giao dịch trong database dựa trên dữ liệu AI trả về.
        Trả về True nếu thành công.
        """
        amount = Decimal(str(txn_data.get("amount", 0)))
        txn_type = txn_data.get("type", "expense")
        category_name = txn_data.get("category_name", "")
        note = txn_data.get("note", "")
        date_str = txn_data.get("date", datetime.now().strftime("%Y-%m-%d"))

        # Parse date
        try:
            txn_date = datetime.strptime(date_str, "%Y-%m-%d")
        except (ValueError, TypeError):
            txn_date = datetime.now()

        # Tìm category theo tên (không phân biệt hoa thường)
        category_id = None
        if category_name:
            category = db.query(models.Category).filter(
                models.Category.user_id == user_id,
                func.lower(models.Category.name) == category_name.lower()
            ).first()
            if category:
                category_id = category.id

        # Lấy tài khoản đầu tiên của user làm mặc định
        account = db.query(models.Account).filter(
            models.Account.user_id == user_id
        ).first()

        if not account:
            return False  # User chưa có tài khoản nào

        # Tạo schema TransactionCreate
        txn_schema = schemas.TransactionCreate(
            amount=amount,
            type=txn_type,
            date=txn_date,
            note=note,
            account_id=account.id,
            category_id=category_id,
        )

        # Gọi CRUD — hàm này đã xử lý balance, savings, debts, budget notifications
        crud_txn.create_transaction(
            db=db,
            user_id=user_id,
            data=txn_schema,
            account=account,
        )

        return True


# Singleton — import từ bất kỳ đâu trong project
ai_service = AIService()

