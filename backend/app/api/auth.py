"""
app/api/auth.py
Router xử lý Đăng ký và Đăng nhập.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import schemas
from app.crud import users as crud_users
from app.core.security import verify_password, create_access_token

router = APIRouter(tags=["Auth"])


# ------------------------------------------
# POST /register — Đăng ký tài khoản mới
# ------------------------------------------
@router.post("/register", response_model=schemas.UserResponse, status_code=201)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Tạo tài khoản người dùng mới. Mật khẩu tự động được băm bằng bcrypt."""
    try:
        existing = crud_users.get_user_by_email(db, user.email)
        if existing:
            raise HTTPException(status_code=400, detail="Email đã tồn tại")
        return crud_users.create_user(db, email=user.email, password=user.password)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------------------
# POST /login — Đăng nhập, trả về JWT
# ------------------------------------------
@router.post("/login", response_model=schemas.LoginResponse)
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    """Xác thực email + password, trả về access_token (JWT) nếu hợp lệ."""
    try:
        db_user = crud_users.get_user_by_email(db, user.email)
        if not db_user:
            raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không chính xác")
        if not verify_password(user.password, db_user.hashed_password):
            raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không chính xác")

        access_token = create_access_token(data={"sub": str(db_user.id), "email": db_user.email})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": db_user,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi đăng nhập: {str(e)}")
