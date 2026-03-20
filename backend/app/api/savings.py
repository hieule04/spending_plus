from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app import models, schemas, deps
from app.database import get_db
from app.crud import savings as crud_savings

router = APIRouter()

@router.get("/savings", response_model=List[schemas.SavingsGoalResponse])
def get_savings_goals(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """Lấy danh sách sổ tiết kiệm."""
    return crud_savings.list_savings_goals(db, current_user.id)

@router.post("/savings", response_model=schemas.SavingsGoalResponse)
def create_savings_goal(
    data: schemas.SavingsGoalCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """Tạo sổ tiết kiệm mới."""
    return crud_savings.create_savings_goal(db, current_user.id, data)

@router.put("/savings/{goal_id}", response_model=schemas.SavingsGoalResponse)
def update_savings_goal(
    goal_id: UUID,
    data: schemas.SavingsGoalUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """Cập nhật sổ tiết kiệm."""
    goal = crud_savings.update_savings_goal(db, goal_id, current_user.id, data)
    if not goal:
        raise HTTPException(status_code=404, detail="Không tìm thấy sổ tiết kiệm")
    return goal

@router.delete("/savings/{goal_id}", response_model=schemas.MessageResponse)
def delete_savings_goal(
    goal_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """Xóa sổ tiết kiệm."""
    try:
        success = crud_savings.delete_savings_goal(db, goal_id, current_user.id)
        if not success:
            raise HTTPException(status_code=404, detail="Không tìm thấy sổ tiết kiệm hoặc bạn không có quyền xóa.")
        return {"message": "Đã xóa sổ tiết kiệm"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi hệ thống khi xóa: {str(e)}")
