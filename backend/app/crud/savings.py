"""
app/crud/savings.py
Logic truy vấn database cho bảng Savings Goals (Sổ tiết kiệm).
"""

from uuid import UUID

from sqlalchemy.orm import Session

from app import models, schemas


def list_savings_goals(db: Session, user_id: UUID) -> list[models.SavingsGoal]:
    """Lấy danh sách sổ tiết kiệm của user."""
    return db.query(models.SavingsGoal).filter(
        models.SavingsGoal.user_id == user_id,
    ).order_by(models.SavingsGoal.created_at.desc()).all()


def create_savings_goal(db: Session, user_id: UUID, data: schemas.SavingsGoalCreate) -> models.SavingsGoal:
    """Tạo sổ tiết kiệm mới."""
    new_goal = models.SavingsGoal(
        **data.model_dump(),
        user_id=user_id,
    )
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)
    return new_goal


def update_savings_goal(
    db: Session, goal_id: UUID, user_id: UUID, data: schemas.SavingsGoalUpdate,
) -> models.SavingsGoal | None:
    """Cập nhật thông tin sổ tiết kiệm."""
    goal = db.query(models.SavingsGoal).filter(
        models.SavingsGoal.id == goal_id,
        models.SavingsGoal.user_id == user_id,
    ).first()
    if not goal:
        return None

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(goal, key, value)

    # Check completion
    if goal.current_amount >= goal.target_amount:
        goal.is_completed = True
    else:
        goal.is_completed = False

    db.commit()
    db.refresh(goal)
    return goal


def delete_savings_goal(db: Session, goal_id: UUID, user_id: UUID) -> bool:
    """Xóa sổ tiết kiệm."""
    goal = db.query(models.SavingsGoal).filter(
        models.SavingsGoal.id == goal_id,
        models.SavingsGoal.user_id == user_id,
    ).first()
    if goal:
        # Gỡ link ở các giao dịch trước khi xóa
        db.query(models.Transaction).filter(
            models.Transaction.savings_goal_id == goal_id,
        ).update({models.Transaction.savings_goal_id: None})

        db.delete(goal)
        db.commit()
        return True
    return False
