"""
app/api/auth.py
Router xử lý Đăng ký và Đăng nhập.
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
import random
from datetime import datetime, timedelta, timezone
from typing import Optional

from app.database import get_db
from app import schemas, models
from app.crud import users as crud_users
from app.core.security import verify_password, create_access_token
from app.core.config import settings
import os
try:
    from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
except ModuleNotFoundError:
    ConnectionConfig = FastMail = MessageSchema = MessageType = None

def _build_fastmail() -> Optional[FastMail]:
    """Khởi tạo FastMail nếu đã có đủ cấu hình cơ bản."""
    if FastMail is None or ConnectionConfig is None:
        print("[!] fastapi_mail is not installed. OTP email sending is disabled.")
        return None

    mail_username = os.getenv("MAIL_USERNAME", "").strip()
    mail_password = os.getenv("MAIL_PASSWORD", "").strip()
    mail_from = (os.getenv("MAIL_FROM") or mail_username).strip()

    if not mail_username or not mail_password or not mail_from:
        print("[!] Mail config incomplete. OTP email sending is disabled.")
        return None

    conf = ConnectionConfig(
        MAIL_USERNAME=mail_username,
        MAIL_PASSWORD=mail_password,
        MAIL_FROM=mail_from,
        MAIL_PORT=int(os.getenv("MAIL_PORT", "587")),
        MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.gmail.com"),
        MAIL_STARTTLS=True,
        MAIL_SSL_TLS=False,
        USE_CREDENTIALS=True,
        VALIDATE_CERTS=False,
    )
    return FastMail(conf)


fastmail = _build_fastmail()

router = APIRouter(tags=["Auth"])


# ------------------------------------------
# POST /register — Đăng ký tài khoản mới
# ------------------------------------------
@router.post("/register", response_model=schemas.UserResponse, status_code=201)
def register(user: schemas.UserCreate, bg_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Tạo tài khoản người dùng mới và gửi OTP."""
    try:
        existing = crud_users.get_user_by_email(db, user.email)
        if existing:
            raise HTTPException(status_code=400, detail="Email đã tồn tại")
        
        # Tạo OTP ngẫu nhiên 6 số
        otp_code = f"{random.randint(100000, 999999)}"
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
        
        new_user = crud_users.create_user(
            db, email=user.email, password=user.password,
            otp_code=otp_code, otp_expires_at=expires_at
        )

        if fastmail is not None:
            message = MessageSchema(
                subject="Xác thực tài khoản Spending Plus",
                recipients=[new_user.email],
                body=f"Mã xác thực của bạn là: {otp_code}",
                subtype=MessageType.plain,
            )
            bg_tasks.add_task(fastmail.send_message, message)

        return new_user
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
        if not db_user.is_verified:
            raise HTTPException(status_code=400, detail="Tài khoản chưa được xác thực")

        access_token = create_access_token(data={"sub": str(db_user.id), "email": db_user.email})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": db_user,
        }
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=503,
            detail="Khong the ket noi co so du lieu. Vui long kiem tra DATABASE_URL/Supabase.",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi đăng nhập: {str(e)}")


# ------------------------------------------
# POST /verify-otp — Xác thực hệ thống OTP thực
# ------------------------------------------
@router.post("/verify-otp", status_code=200)
def verify_otp(data: schemas.VerifyOTPRequest, db: Session = Depends(get_db)):
    """Xác thực mã OTP gửi qua email."""
    user = crud_users.get_user_by_email(db, data.email)
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản")
    
    if user.is_verified:
        return {"message": "Tài khoản đã xác thực", "email": data.email}
    
    if not user.otp_code or user.otp_code != data.otp:
        raise HTTPException(status_code=400, detail="Mã OTP không chính xác")
    
    if user.otp_expires_at and datetime.now(timezone.utc) > user.otp_expires_at:
        raise HTTPException(status_code=400, detail="Mã OTP đã hết hạn")
    
    # Xác thực thành công
    user.is_verified = True
    user.otp_code = None
    user.otp_expires_at = None
    db.commit()
    return {"message": "Xác thực hoàn tất!", "email": data.email}
