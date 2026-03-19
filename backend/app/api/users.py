from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.deps import get_current_user
from app import models, schemas
from app.crud import users as crud_users

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=schemas.UserResponse)
def read_current_user(current_user: models.User = Depends(get_current_user)):
    """Lấy thông tin profile của user hiện tại."""
    return current_user

@router.put("/me", response_model=schemas.UserResponse)
def update_current_user(
    update_data: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Cập nhật thông tin profile của user hiện tại."""
    update_dict = update_data.model_dump(exclude_unset=True)
    if not update_dict:
        return current_user
    
    updated_user = crud_users.update_user(db, current_user, update_dict)
    return updated_user
