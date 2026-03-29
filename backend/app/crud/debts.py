"""
app/crud/debts.py
Logic truy vấn database cho bảng Debts (Khoản nợ).
"""

from decimal import Decimal
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models, schemas


def list_debts(db: Session, user_id: UUID) -> list[models.Debt]:
    """Lấy danh sách khoản nợ của user."""
    return db.query(models.Debt).filter(
        models.Debt.user_id == user_id,
    ).order_by(models.Debt.created_at.desc()).all()


def get_debt(db: Session, debt_id: UUID, user_id: UUID) -> models.Debt | None:
    """Lấy một khoản nợ của user."""
    return db.query(models.Debt).filter(
        models.Debt.id == debt_id,
        models.Debt.user_id == user_id,
    ).first()


def get_debt_paid_amount(
    db: Session,
    debt_id: UUID,
    user_id: UUID,
    exclude_transaction_id: UUID | None = None,
) -> Decimal:
    """Tính tổng số tiền đã trả cho khoản nợ từ các transaction expense liên kết."""
    query = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.user_id == user_id,
        models.Transaction.debt_id == debt_id,
        models.Transaction.type == "expense",
    )

    if exclude_transaction_id is not None:
        query = query.filter(models.Transaction.id != exclude_transaction_id)

    return query.scalar() or Decimal("0.0")


def sync_debt_remaining_amount(db: Session, debt: models.Debt) -> models.Debt:
    """Đồng bộ remaining_amount dựa trên total_amount và tổng payment thực tế."""
    paid_amount = get_debt_paid_amount(db, debt.id, debt.user_id)
    debt.remaining_amount = max(Decimal("0.0"), debt.total_amount - paid_amount)
    return debt


def create_debt(db: Session, user_id: UUID, data: schemas.DebtCreate) -> models.Debt:
    """Tạo khoản nợ mới. remaining_amount = total_amount ban đầu."""
    new_debt = models.Debt(
        creditor_name=data.creditor_name,
        total_amount=data.total_amount,
        remaining_amount=data.total_amount,
        monthly_payment=data.monthly_payment,
        due_date=data.due_date,
        user_id=user_id,
    )
    db.add(new_debt)
    db.commit()
    db.refresh(new_debt)
    return new_debt


def update_debt(db: Session, debt_id: UUID, user_id: UUID, data: schemas.DebtUpdate) -> models.Debt | None:
    """Cập nhật thông tin khoản nợ."""
    debt = get_debt(db, debt_id, user_id)
    if not debt:
        return None

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(debt, key, value)

    sync_debt_remaining_amount(db, debt)
    db.commit()
    db.refresh(debt)
    return debt


def delete_debt(db: Session, debt_id: UUID, user_id: UUID) -> bool:
    """Xóa khoản nợ và gỡ liên kết các giao dịch."""
    debt = db.query(models.Debt).filter(
        models.Debt.id == debt_id,
        models.Debt.user_id == user_id,
    ).first()
    if debt:
        # Gỡ link ở các giao dịch trước khi xóa
        db.query(models.Transaction).filter(
            models.Transaction.debt_id == debt_id,
        ).update({models.Transaction.debt_id: None})

        db.delete(debt)
        db.commit()
        return True
    return False
