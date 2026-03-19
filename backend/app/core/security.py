"""
app/core/security.py
Gom tất cả logic bảo mật: mã hóa mật khẩu (bcrypt) và JWT (python-jose).
"""

import bcrypt
from datetime import datetime, timedelta
from jose import jwt, JWTError

from app.core.config import settings


# ==========================================
# 1. Password Hashing (bcrypt)
# ==========================================

def _safe_password(password: str) -> bytes:
    """bcrypt giới hạn tối đa 72 bytes — tự động truncate an toàn."""
    return password.encode("utf-8")[:72]


def hash_password(password: str) -> str:
    """Băm mật khẩu trước khi lưu vào database."""
    safe_pwd = _safe_password(password)
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(safe_pwd, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """So khớp mật khẩu người dùng nhập với mật khẩu đã băm trong DB."""
    try:
        safe_pwd = _safe_password(plain_password)
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(safe_pwd, hash_bytes)
    except (ValueError, TypeError):
        return False


# ==========================================
# 2. JWT Token
# ==========================================

def create_access_token(data: dict) -> str:
    """Tạo JWT access token với thời hạn sống cấu hình qua settings."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    """Giải mã JWT token, trả về payload hoặc None nếu không hợp lệ."""
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None
