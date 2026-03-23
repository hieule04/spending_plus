"""
app/crud/budgets.py
Logic truy vấn database cho bảng Budgets (Ngân sách).
"""

from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models import Budget, Transaction, Category


def get_budget_report(db: Session, user_id: UUID, month: int, year: int) -> list[dict]:
    """
    Lấy báo cáo ngân sách cho người dùng trong tháng/năm.
    Bao gồm hạn mức, tổng chi tiêu, số dư, và phần trăm sử dụng.
    """
    # 1. Lấy tất cả ngân sách của user trong tháng/năm, join với Category để lấy tên
    budgets_query = (
        db.query(Budget, Category.name.label("category_name"))
        .join(Category, Budget.category_id == Category.id)
        .filter(
            Budget.user_id == user_id,
            Budget.month == month,
            Budget.year == year,
        )
        .all()
    )

    if not budgets_query:
        return []

    category_ids = [b.Budget.category_id for b in budgets_query]

    # 2. Truy vấn tổng chi tiêu theo các category_id tương ứng
    spent_sums = (
        db.query(
            Transaction.category_id,
            func.sum(Transaction.amount).label("total_spent"),
        )
        .filter(
            Transaction.user_id == user_id,
            Transaction.category_id.in_(category_ids),
            Transaction.type == "expense",
            func.extract("month", Transaction.date) == month,
            func.extract("year", Transaction.date) == year,
        )
        .group_by(Transaction.category_id)
        .all()
    )

    # Convert to dict for O(1) matching
    spent_map = {row.category_id: float(row.total_spent) for row in spent_sums}

    # 3. Kết hợp kết quả
    report: list[dict] = []
    for row in budgets_query:
        budget = row.Budget
        cat_name = row.category_name

        limit = float(budget.amount_limit)
        total_spent = spent_map.get(budget.category_id, 0.0)
        remaining = limit - total_spent
        percentage = (total_spent / limit * 100) if limit > 0 else 0.0

        report.append({
            "budget_id": budget.id,
            "category_id": budget.category_id,
            "category_name": cat_name,
            "amount_limit": limit,
            "total_spent": total_spent,
            "remaining": remaining,
            "percentage": round(percentage, 2),
            "month": budget.month,
            "year": budget.year,
        })

    return report
