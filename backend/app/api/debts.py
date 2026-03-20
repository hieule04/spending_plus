from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app import models, schemas, deps
from app.database import get_db
from app.crud import debts as crud_debts

router = APIRouter()


@router.get("/debts", response_model=List[schemas.DebtResponse])
def get_debts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """Lấy danh sách khoản nợ."""
    return crud_debts.list_debts(db, current_user.id)


@router.post("/debts", response_model=schemas.DebtResponse)
def create_debt(
    data: schemas.DebtCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """Tạo khoản nợ mới."""
    return crud_debts.create_debt(db, current_user.id, data)


@router.put("/debts/{debt_id}", response_model=schemas.DebtResponse)
def update_debt(
    debt_id: UUID,
    data: schemas.DebtUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """Cập nhật khoản nợ."""
    debt = crud_debts.update_debt(db, debt_id, current_user.id, data)
    if not debt:
        raise HTTPException(status_code=404, detail="Không tìm thấy khoản nợ")
    return debt


@router.delete("/debts/{debt_id}", response_model=schemas.MessageResponse)
def delete_debt(
    debt_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """Xóa khoản nợ."""
    try:
        success = crud_debts.delete_debt(db, debt_id, current_user.id)
        if not success:
            raise HTTPException(status_code=404, detail="Không tìm thấy khoản nợ hoặc bạn không có quyền xóa.")
        return {"message": "Đã xóa khoản nợ"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi hệ thống khi xóa: {str(e)}")
