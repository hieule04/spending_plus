from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Budget, Transaction, Category

def get_budget_report(db: Session, user_id: str, month: int, year: int):
    """
    Lấy báo cáo ngân sách cho người dùng trong tháng/năm.
    Bao gồm hạn mức (amount_limit), tổng chi tiêu (total_spent), số dư (remaining), và phần trăm sử dụng (percentage).
    """
    # 1. Lấy tất cả ngân sách của user trong tháng/năm, join với Category để lấy tên danh mục
    budgets_query = (
        db.query(Budget, Category.name.label("category_name"))
        .join(Category, Budget.category_id == Category.id)
        .filter(
            Budget.user_id == user_id,
            Budget.month == month,
            Budget.year == year
        )
        .all()
    )

    if not budgets_query:
        return []

    category_ids = [b.Budget.category_id for b in budgets_query]

    # 2. Truy vấn tổng chi tiêu (amount) từ bảng Transaction cho các category_id tương ứng
    # Lưu ý: func.extract() trả về kiểu Float (version PG cũ) hoặc Numeric (PG mới), nên cần cast hoặc match chính xác.
    spent_sums = (
        db.query(
            Transaction.category_id,
            func.sum(Transaction.amount).label("total_spent")
        )
        .filter(
            Transaction.user_id == user_id,
            Transaction.category_id.in_(category_ids),
            Transaction.type == 'expense',
            func.extract('month', Transaction.date) == month,
            func.extract('year', Transaction.date) == year
        )
        .group_by(Transaction.category_id)
        .all()
    )

    # Convert to dict for O(1) matching: {category_id: total_spent}
    spent_map = {row.category_id: float(row.total_spent) for row in spent_sums}

    report = []
    
    # 3. Kết hợp kết quả
    for row in budgets_query:
        budget = row.Budget
        cat_name = row.category_name
        
        limit = float(budget.amount_limit)
        total_spent = spent_map.get(budget.category_id, 0.0)
        remaining = limit - total_spent
        percentage = (total_spent / limit * 100) if limit > 0 else 0.0
        
        report.append({
            "category_id": budget.category_id,
            "category_name": cat_name,
            "amount_limit": limit,
            "total_spent": total_spent,
            "remaining": remaining,
            "percentage": round(percentage, 2),
            "month": budget.month,
            "year": budget.year
        })
        
    return report
