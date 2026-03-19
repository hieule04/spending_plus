"""
app/crud/accounts.py
Logic truy vấn database cho bảng Accounts.
"""

from uuid import UUID
from sqlalchemy.orm import Session

from app import models, schemas


def list_accounts(db: Session, user_id: UUID) -> list[models.Account]:
    """Lấy danh sách tài khoản của user, sắp xếp theo ngày tạo giảm dần."""
    return (
        db.query(models.Account)
        .filter(models.Account.user_id == user_id)
        .order_by(models.Account.created_at.desc())
        .all()
    )


def get_account(db: Session, account_id: UUID, user_id: UUID) -> models.Account | None:
    """Lấy 1 tài khoản theo ID, đảm bảo thuộc về user."""
    return (
        db.query(models.Account)
        .filter(models.Account.id == account_id, models.Account.user_id == user_id)
        .first()
    )


def create_account(db: Session, user_id: UUID, data: schemas.AccountCreate) -> models.Account:
    """Tạo tài khoản mới."""
    new_acc = models.Account(
        name=data.name,
        type=data.type,
        balance=data.balance,
        user_id=user_id,
    )
    db.add(new_acc)
    db.commit()
    db.refresh(new_acc)
    return new_acc


def update_account(
    db: Session, existing: models.Account, data: schemas.AccountUpdate
) -> models.Account:
    """Cập nhật tài khoản — chỉ thay đổi các trường được gửi lên."""
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(existing, key, value)
    db.commit()
    db.refresh(existing)
    return existing


def count_transactions_for_account(db: Session, account_id: UUID) -> int:
    """Đếm số giao dịch gắn với tài khoản (dùng để kiểm tra trước khi xóa)."""
    return (
        db.query(models.Transaction)
        .filter(models.Transaction.account_id == account_id)
        .count()
    )


def delete_account(db: Session, existing: models.Account) -> None:
    """Xóa tài khoản khỏi database."""
    db.delete(existing)
    db.commit()
