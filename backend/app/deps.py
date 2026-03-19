"""
app/deps.py
FastAPI Dependencies dùng chung cho nhiều endpoints.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from uuid import UUID

from app.database import get_db
from app.core.security import decode_access_token
from app import models

# OAuth2 scheme — Frontend gửi token qua header: Authorization: Bearer <token>
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    """
    Dependency xác thực JWT.
    Giải mã token → tìm user trong DB → trả về User model.
    Dùng chung cho tất cả endpoint cần bảo vệ.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id_str: str | None = payload.get("sub")
    if user_id_str is None:
        raise credentials_exception

    try:
        uid = UUID(user_id_str)
    except ValueError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.id == uid).first()
    if user is None:
        raise credentials_exception

    return user
