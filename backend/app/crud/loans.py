"""
app/crud/loans.py
Logic truy vấn database cho bảng Loans (Cho vay).
"""

from uuid import UUID

from sqlalchemy.orm import Session

from app import models, schemas


def list_loans(db: Session, user_id: UUID) -> list[models.Loan]:
    """Lấy danh sách khoản cho vay của user."""
    return db.query(models.Loan).filter(
        models.Loan.user_id == user_id,
    ).order_by(models.Loan.created_at.desc()).all()


def create_loan(db: Session, user_id: UUID, data: schemas.LoanCreate) -> models.Loan:
    """Tạo khoản cho vay mới."""
    new_loan = models.Loan(
        borrower_name=data.borrower_name,
        amount=data.amount,
        user_id=user_id,
    )
    db.add(new_loan)
    db.commit()
    db.refresh(new_loan)
    return new_loan


def update_loan(db: Session, loan_id: UUID, user_id: UUID, data: schemas.LoanUpdate) -> models.Loan | None:
    """Cập nhật thông tin khoản cho vay."""
    loan = db.query(models.Loan).filter(
        models.Loan.id == loan_id,
        models.Loan.user_id == user_id,
    ).first()
    if not loan:
        return None

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(loan, key, value)

    db.commit()
    db.refresh(loan)
    return loan


def delete_loan(db: Session, loan_id: UUID, user_id: UUID) -> bool:
    """Xóa khoản cho vay."""
    loan = db.query(models.Loan).filter(
        models.Loan.id == loan_id,
        models.Loan.user_id == user_id,
    ).first()
    if not loan:
        return False

    db.delete(loan)
    db.commit()
    return True
