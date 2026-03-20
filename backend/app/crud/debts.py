from uuid import UUID
from sqlalchemy.orm import Session
from app import models, schemas


def list_debts(db: Session, user_id: UUID):
    """Lấy danh sách khoản nợ của user."""
    return db.query(models.Debt).filter(
        models.Debt.user_id == user_id
    ).order_by(models.Debt.created_at.desc()).all()


def create_debt(db: Session, user_id: UUID, data: schemas.DebtCreate):
    """Tạo khoản nợ mới. remaining_amount = total_amount ban đầu."""
    new_debt = models.Debt(
        creditor_name=data.creditor_name,
        total_amount=data.total_amount,
        remaining_amount=data.total_amount,  # Ban đầu nợ còn lại = tổng nợ
        monthly_payment=data.monthly_payment,
        due_date=data.due_date,
        user_id=user_id,
    )
    db.add(new_debt)
    db.commit()
    db.refresh(new_debt)
    return new_debt


def update_debt(db: Session, debt_id: UUID, user_id: UUID, data: schemas.DebtUpdate):
    """Cập nhật thông tin khoản nợ."""
    debt = db.query(models.Debt).filter(
        models.Debt.id == debt_id,
        models.Debt.user_id == user_id
    ).first()
    if not debt:
        return None

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(debt, key, value)

    db.commit()
    db.refresh(debt)
    return debt


def delete_debt(db: Session, debt_id: UUID, user_id: UUID):
    """Xóa khoản nợ và gỡ liên kết các giao dịch."""
    debt = db.query(models.Debt).filter(
        models.Debt.id == debt_id,
        models.Debt.user_id == user_id
    ).first()
    if debt:
        # Gỡ link ở các giao dịch trước khi xóa
        db.query(models.Transaction).filter(
            models.Transaction.debt_id == debt_id
        ).update({models.Transaction.debt_id: None})

        db.delete(debt)
        db.commit()
        return True
    return False
