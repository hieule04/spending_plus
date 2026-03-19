"""
app/crud/categories.py
Logic truy vấn database cho bảng Categories.
"""

from uuid import UUID
from sqlalchemy.orm import Session

from app import models, schemas


def list_categories(db: Session, user_id: UUID) -> list[models.Category]:
    """Lấy danh sách danh mục của user."""
    return (
        db.query(models.Category)
        .filter(models.Category.user_id == user_id)
        .order_by(models.Category.created_at.desc())
        .all()
    )


def get_category(db: Session, category_id: UUID, user_id: UUID) -> models.Category | None:
    """Lấy 1 danh mục theo ID, đảm bảo thuộc về user."""
    return (
        db.query(models.Category)
        .filter(models.Category.id == category_id, models.Category.user_id == user_id)
        .first()
    )


def create_category(db: Session, user_id: UUID, data: schemas.CategoryCreate) -> models.Category:
    """Tạo danh mục mới."""
    new_cat = models.Category(
        name=data.name,
        type=data.type,
        icon=data.icon,
        color=data.color,
        user_id=user_id,
    )
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return new_cat


def update_category(
    db: Session, existing: models.Category, data: schemas.CategoryUpdate
) -> models.Category:
    """Cập nhật danh mục."""
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(existing, key, value)
    db.commit()
    db.refresh(existing)
    return existing


def count_transactions_for_category(db: Session, category_id: UUID) -> int:
    """Đếm số giao dịch dùng danh mục này."""
    return (
        db.query(models.Transaction)
        .filter(models.Transaction.category_id == category_id)
        .count()
    )


def delete_category(db: Session, existing: models.Category) -> None:
    """Xóa danh mục khỏi database."""
    db.delete(existing)
    db.commit()
