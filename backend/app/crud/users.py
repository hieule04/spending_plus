"""
app/crud/users.py
Logic truy vấn database cho bảng Users.
"""

from sqlalchemy.orm import Session

from app import models
from app.core.security import hash_password


def get_user_by_email(db: Session, email: str) -> models.User | None:
    """Tìm user theo email."""
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(db: Session, email: str, password: str) -> models.User:
    """Tạo user mới với mật khẩu đã được băm."""
    new_user = models.User(
        email=email,
        hashed_password=hash_password(password),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def update_user(db: Session, user: models.User, update_data: dict) -> models.User:
    """Cập nhật thông tin user."""
    for key, value in update_data.items():
        if key == "password":
            setattr(user, "hashed_password", hash_password(value))
        else:
            setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user
