"""
app/crud/transactions.py
Logic truy vấn database và xử lý nghiệp vụ cho bảng Transactions.
Bao gồm logic tự động cập nhật balance khi thêm/sửa/xóa giao dịch.
"""

from uuid import UUID
from datetime import datetime
from decimal import Decimal
from sqlalchemy.orm import Session

from sqlalchemy import func
from app import models, schemas
from app.crud import debts as crud_debts


# ==========================================
# Helper: Cập nhật balance tài khoản
# ==========================================

def apply_balance(
    account: models.Account,
    amount: Decimal,
    txn_type: str,
    reverse: bool = False,
) -> None:
    """
    Cập nhật balance của account dựa trên loại giao dịch.
    - income  → cộng tiền (hoặc trừ nếu reverse)
    - expense → trừ tiền (hoặc cộng nếu reverse)
    reverse=True dùng khi xoá hoặc hoàn tác giao dịch.
    """
    amt = Decimal(str(amount))
    if txn_type == "income":
        account.balance = account.balance + amt if not reverse else account.balance - amt
    elif txn_type == "expense":
        account.balance = account.balance - amt if not reverse else account.balance + amt
    # Logic cho các loại giao dịch khác có thể mở rộng sau


# ==========================================
# CRUD Functions
# ==========================================

def list_transactions(
    db: Session,
    user_id: UUID,
    skip: int = 0,
    limit: int = 50,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    category_id: UUID | None = None,
    transaction_type: str | None = None,
) -> list[models.Transaction]:
    """Lấy danh sách giao dịch của user, sắp xếp theo ngày giảm dần."""
    query = db.query(models.Transaction).filter(models.Transaction.user_id == user_id)

    if category_id is not None:
        query = query.filter(models.Transaction.category_id == category_id)
    if transaction_type is not None:
        query = query.filter(models.Transaction.type == transaction_type)
    if start_date is not None:
        query = query.filter(models.Transaction.date >= start_date)
    if end_date is not None:
        query = query.filter(models.Transaction.date < end_date)

    return query.order_by(models.Transaction.date.desc()).offset(skip).limit(limit).all()


def create_transaction(
    db: Session,
    user_id: UUID,
    data: schemas.TransactionCreate,
    account: models.Account,
) -> models.Transaction:
    """
    Tạo giao dịch mới và tự động cập nhật balance của account.
    Caller phải truyền vào account đã được validate thuộc về user.
    """
    debt = None
    if data.debt_id:
        debt = crud_debts.get_debt(db, data.debt_id, user_id)
        if not debt:
            raise ValueError("Khoản nợ không tồn tại hoặc không thuộc về bạn.")
        if data.type != "expense":
            raise ValueError("Chỉ có giao dịch chi tiêu mới được liên kết với khoản nợ.")

        projected_paid_amount = crud_debts.get_debt_paid_amount(db, debt.id, user_id) + data.amount
        if projected_paid_amount > debt.total_amount:
            raise ValueError("Số tiền thanh toán vượt quá dư nợ còn lại.")

    new_txn = models.Transaction(
        amount=data.amount,
        type=data.type,
        date=data.date,
        note=data.note,
        user_id=user_id,
        account_id=data.account_id,
        category_id=data.category_id,
        savings_goal_id=data.savings_goal_id,
        debt_id=data.debt_id,
    )
    db.add(new_txn)

    # Cập nhật balance
    apply_balance(account, data.amount, data.type)

    # Cập nhật sổ tiết kiệm (Savings Goal) nếu có liên kết
    if data.savings_goal_id:
        goal = db.query(models.SavingsGoal).filter(
            models.SavingsGoal.id == data.savings_goal_id,
            models.SavingsGoal.user_id == user_id
        ).first()
        if goal:
            # - Nạp tiền vào sổ (expense từ ví -> vào sổ)
            # - Rút tiền từ sổ (income vào ví <- từ sổ)
            if data.type == "expense":
                goal.current_amount += data.amount
            elif data.type == "income":
                goal.current_amount -= data.amount
            
            # Kiểm tra trạng thái hoàn thành
            newly_completed = False
            if goal.current_amount >= goal.target_amount:
                if not goal.is_completed:
                    newly_completed = True
                goal.is_completed = True
            else:
                goal.is_completed = False
            
            # Nếu vừa hoàn thành, tạo thông báo
            if newly_completed:
                new_notif = models.Notification(
                    user_id=user_id,
                    message=f"Chúc mừng! Bạn đã hoàn thành mục tiêu tiết kiệm: {goal.name}! 🎉",
                    type="savings_complete",
                    is_read=False
                )
                db.add(new_notif)

    # Cập nhật khoản nợ (Debt) nếu có liên kết
    if debt:
        db.flush()
        crud_debts.sync_debt_remaining_amount(db, debt)

    db.commit()
    db.refresh(new_txn)

    # Budget Notification Check
    if data.type == "expense" and data.category_id:
        check_budget_thresholds(db, user_id, data.category_id, data.date)

    return new_txn


def check_budget_thresholds(db: Session, user_id: UUID, category_id: UUID, date) -> None:
    """Kiểm tra xem giao dịch mới có làm chi tiêu vượt ngưỡng ngân sách không."""
    month = date.month
    year = date.year

    # 1. Lấy ngân sách
    budget = db.query(models.Budget).filter(
        models.Budget.user_id == user_id,
        models.Budget.category_id == category_id,
        models.Budget.month == month,
        models.Budget.year == year
    ).first()

    if not budget or float(budget.amount_limit) <= 0:
        return

    # 2. Kiểm tra settings của user
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user or not user.allow_notifications:
        return

    # 3. Tính tổng chi tiêu trong tháng
    total_spent = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.user_id == user_id,
        models.Transaction.category_id == category_id,
        models.Transaction.type == "expense",
        func.extract('month', models.Transaction.date) == month,
        func.extract('year', models.Transaction.date) == year
    ).scalar() or Decimal("0.0")

    total_spent = float(total_spent)
    limit = float(budget.amount_limit)
    percent = (total_spent / limit) * 100

    # 4. Xác định ngưỡng
    thresholds = [
        (100, "budget_100", f"Bạn đã dùng hết 100% ngân sách cho danh mục này trong tháng {month}/{year}!"),
        (90, "budget_90", f"Bạn đã dùng quá 90% ngân sách cho danh mục này trong tháng {month}/{year}."),
        (50, "budget_50", f"Bạn đã dùng quá 50% ngân sách cho danh mục này trong tháng {month}/{year}."),
    ]

    for threshold_val, threshold_type, message in thresholds:
        if percent >= threshold_val:
            # 5. Kiểm tra xem đã thông báo cho ngưỡng này trong tháng này chưa
            cat = db.query(models.Category).filter(models.Category.id == category_id).first()
            cat_name = cat.name if cat else "danh mục này"
            full_message = message.replace("danh mục này", f"danh mục '{cat_name}'")

            # Tìm xem đã có thông báo cùng loại cho category này trong tháng này chưa
            # Ta check message HOẶC có thể check created_at nếu muốn tuyệt đối
            existing_notif = db.query(models.Notification).filter(
                models.Notification.user_id == user_id,
                models.Notification.type == threshold_type,
                models.Notification.message == full_message
            ).first()

            if not existing_notif:
                new_notif = models.Notification(
                    user_id=user_id,
                    message=full_message,
                    type=threshold_type,
                    is_read=False
                )
                db.add(new_notif)
                db.commit()
            
            # Chỉ thông báo ngưỡng cao nhất vừa đạt được trong lần chi tiêu này
            break 


def update_transaction(
    db: Session,
    existing: models.Transaction,
    data: schemas.TransactionUpdate,
    old_account: models.Account,
    new_account: models.Account,
) -> models.Transaction:
    """
    Cập nhật giao dịch và tính toán lại chênh lệch balance.
    1. Hoàn trả balance cũ cho old_account.
    2. Áp dụng balance mới cho new_account.
    3. Cập nhật các trường của transaction.
    """
    old_amount = existing.amount
    old_type = existing.type
    old_debt_id = existing.debt_id

    update_data = data.model_dump(exclude_unset=True)
    new_amount = update_data.get("amount", old_amount)
    new_type = update_data.get("type", old_type)
    new_debt_id = update_data.get("debt_id", old_debt_id)

    debts_to_sync: list[models.Debt] = []
    if old_debt_id:
        old_debt = crud_debts.get_debt(db, old_debt_id, existing.user_id)
        if old_debt:
            debts_to_sync.append(old_debt)

    if new_debt_id:
        new_debt = crud_debts.get_debt(db, new_debt_id, existing.user_id)
        if not new_debt:
            raise ValueError("Khoản nợ không tồn tại hoặc không thuộc về bạn.")
        if new_type != "expense":
            raise ValueError("Chỉ có giao dịch chi tiêu mới được liên kết với khoản nợ.")

        projected_paid_amount = (
            crud_debts.get_debt_paid_amount(
                db,
                new_debt.id,
                existing.user_id,
                exclude_transaction_id=existing.id,
            )
            + new_amount
        )
        if projected_paid_amount > new_debt.total_amount:
            raise ValueError("Số tiền thanh toán vượt quá dư nợ còn lại.")

        if all(debt.id != new_debt.id for debt in debts_to_sync):
            debts_to_sync.append(new_debt)

    # Hoàn trả balance cũ
    apply_balance(old_account, old_amount, old_type, reverse=True)

    # Áp dụng balance mới
    apply_balance(new_account, new_amount, new_type)

    # Cập nhật các trường
    for key, value in update_data.items():
        setattr(existing, key, value)

    db.flush()
    for debt in debts_to_sync:
        crud_debts.sync_debt_remaining_amount(db, debt)

    db.commit()
    db.refresh(existing)
    return existing


def delete_transaction(
    db: Session,
    existing: models.Transaction,
    account: models.Account,
) -> None:
    """Xóa giao dịch và hoàn trả balance về tài khoản."""
    debt = None
    if existing.debt_id:
        debt = crud_debts.get_debt(db, existing.debt_id, existing.user_id)

    apply_balance(account, existing.amount, existing.type, reverse=True)
    db.delete(existing)

    db.flush()
    if debt:
        crud_debts.sync_debt_remaining_amount(db, debt)

    db.commit()
