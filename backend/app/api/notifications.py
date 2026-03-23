"""
app/api/notifications.py
Router cho quản lý Thông báo (Notifications).
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app import models, schemas, deps
from app.database import get_db

router = APIRouter()


@router.get("/notifications", response_model=list[schemas.NotificationResponse])
def get_notifications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user),
    limit: int = 50,
) -> list[schemas.NotificationResponse]:
    """Lấy danh sách thông báo của người dùng."""
    return db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id
    ).order_by(models.Notification.created_at.desc()).limit(limit).all()


@router.get("/notifications/unread-count", response_model=schemas.UnreadCountResponse)
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> schemas.UnreadCountResponse:
    """Lấy số lượng thông báo chưa đọc."""
    count = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.is_read == False,
    ).count()
    return {"unread_count": count}


@router.put("/notifications/mark-as-read", response_model=schemas.MessageResponse)
def mark_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> schemas.MessageResponse:
    """Đánh dấu tất cả thông báo của người dùng là đã đọc."""
    db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.is_read == False,
    ).update({"is_read": True})
    db.commit()
    return {"message": "Tất cả thông báo đã được đánh dấu là đã đọc."}


@router.delete("/notifications/{notification_id}", response_model=schemas.MessageResponse)
def delete_notification(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> schemas.MessageResponse:
    """Xóa một thông báo cụ thể."""
    notif = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == current_user.id,
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Không tìm thấy thông báo")
    db.delete(notif)
    db.commit()
    return {"message": "Đã xóa thông báo"}


@router.delete("/notifications", response_model=schemas.MessageResponse)
def clear_all_notifications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> schemas.MessageResponse:
    """Xóa tất cả thông báo của người dùng."""
    db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id
    ).delete()
    db.commit()
    return {"message": "Đã xóa tất cả thông báo"}
