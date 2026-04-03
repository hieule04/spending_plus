"""
app/api/loans.py
Router CRUD cho bảng Loans (Cho vay).
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app import deps, models, schemas
from app.crud import loans as crud_loans
from app.database import get_db

router = APIRouter()


@router.get("/loans", response_model=list[schemas.LoanResponse])
def get_loans(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> list[schemas.LoanResponse]:
    """Lấy danh sách khoản cho vay."""
    return crud_loans.list_loans(db, current_user.id)


@router.post("/loans", response_model=schemas.LoanResponse)
def create_loan(
    data: schemas.LoanCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> schemas.LoanResponse:
    """Tạo khoản cho vay mới."""
    return crud_loans.create_loan(db, current_user.id, data)


@router.put("/loans/{loan_id}", response_model=schemas.LoanResponse)
def update_loan(
    loan_id: UUID,
    data: schemas.LoanUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> schemas.LoanResponse:
    """Cập nhật khoản cho vay."""
    loan = crud_loans.update_loan(db, loan_id, current_user.id, data)
    if not loan:
        raise HTTPException(status_code=404, detail="Không tìm thấy khoản cho vay")
    return loan


@router.delete("/loans/{loan_id}", response_model=schemas.MessageResponse)
def delete_loan(
    loan_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> schemas.MessageResponse:
    """Xóa khoản cho vay."""
    success = crud_loans.delete_loan(db, loan_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Không tìm thấy khoản cho vay")
    return {"message": "Đã xóa khoản cho vay"}
