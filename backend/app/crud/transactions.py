"""
app/crud/transactions.py
Logic truy vấn database và xử lý nghiệp vụ cho bảng Transactions.
Bao gồm logic tự động cập nhật balance khi thêm/sửa/xóa giao dịch.
"""

from uuid import UUID
from decimal import Decimal
from sqlalchemy.orm import Session

from app import models, schemas


# ==========================================
# Helper: Cập nhật balance tài khoản
# ==========================================

def apply_balance(
    account: models.Account,
    amount: Decimal,
    txn_type: str,
    reverse: bool = False,
) -> None:
    """
    Cập nhật balance của account dựa trên loại giao dịch.
    - income  → cộng tiền (hoặc trừ nếu reverse)
    - expense → trừ tiền (hoặc cộng nếu reverse)
    reverse=True dùng khi xoá hoặc hoàn tác giao dịch.
    """
    amt = Decimal(str(amount))
    if txn_type == "income":
        account.balance = account.balance + amt if not reverse else account.balance - amt
    elif txn_type == "expense":
        account.balance = account.balance - amt if not reverse else account.balance + amt
    # transfer có thể mở rộng sau


# ==========================================
# CRUD Functions
# ==========================================

def list_transactions(
    db: Session, user_id: UUID, skip: int = 0, limit: int = 50
) -> list[models.Transaction]:
    """Lấy danh sách giao dịch của user, sắp xếp theo ngày giảm dần."""
    return (
        db.query(models.Transaction)
        .filter(models.Transaction.user_id == user_id)
        .order_by(models.Transaction.date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_transaction(
    db: Session,
    user_id: UUID,
    data: schemas.TransactionCreate,
    account: models.Account,
) -> models.Transaction:
    """
    Tạo giao dịch mới và tự động cập nhật balance của account.
    Caller phải truyền vào account đã được validate thuộc về user.
    """
    new_txn = models.Transaction(
        amount=data.amount,
        type=data.type,
        date=data.date,
        note=data.note,
        user_id=user_id,
        account_id=data.account_id,
        category_id=data.category_id,
    )
    db.add(new_txn)

    # Cập nhật balance
    apply_balance(account, data.amount, data.type)

    db.commit()
    db.refresh(new_txn)
    return new_txn


def update_transaction(
    db: Session,
    existing: models.Transaction,
    data: schemas.TransactionUpdate,
    old_account: models.Account,
    new_account: models.Account,
) -> models.Transaction:
    """
    Cập nhật giao dịch và tính toán lại chênh lệch balance.
    1. Hoàn trả balance cũ cho old_account.
    2. Áp dụng balance mới cho new_account.
    3. Cập nhật các trường của transaction.
    """
    old_amount = existing.amount
    old_type = existing.type

    new_amount = data.amount if data.amount is not None else old_amount
    new_type = data.type if data.type is not None else old_type

    # Hoàn trả balance cũ
    apply_balance(old_account, old_amount, old_type, reverse=True)

    # Áp dụng balance mới
    apply_balance(new_account, new_amount, new_type)

    # Cập nhật các trường
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(existing, key, value)

    db.commit()
    db.refresh(existing)
    return existing


def delete_transaction(
    db: Session,
    existing: models.Transaction,
    account: models.Account,
) -> None:
    """Xóa giao dịch và hoàn trả balance về tài khoản."""
    apply_balance(account, existing.amount, existing.type, reverse=True)
    db.delete(existing)
    db.commit()
