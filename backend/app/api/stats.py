"""
app/api/stats.py
Router cho thống kê Dashboard (tổng thu, tổng chi, biểu đồ).
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case, cast, Date
from datetime import datetime, timedelta

from app.database import get_db
from app.deps import get_current_user
from app import models, schemas

router = APIRouter(prefix="/stats", tags=["Stats"])

def get_range(period: str, ref_date: datetime) -> tuple[datetime | None, datetime | None]:
    if period == "day":
        start = ref_date.replace(hour=0, minute=0, second=0, microsecond=0)
        return start, start + timedelta(days=1)
    elif period == "week":
        # Bắt đầu từ thứ 2 của tuần chứa ref_date
        start = ref_date - timedelta(days=ref_date.weekday())
        start = start.replace(hour=0, minute=0, second=0, microsecond=0)
        return start, start + timedelta(days=7)
    elif period == "month":
        start = ref_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        # Tính tháng tiếp theo
        if start.month == 12:
            end = start.replace(year=start.year + 1, month=1)
        else:
            end = start.replace(month=start.month + 1)
        return start, end
    elif period == "year":
        start = ref_date.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        return start, start.replace(year=start.year + 1)
    return None, None

@router.get("/summary", response_model=schemas.DashboardSummaryResponse)
def get_dashboard_summary(
    period: str = Query("month", description="Lọc theo: all, day, week, month, year"),
    date: str = Query(None, description="Ngày tham chiếu (ISO format) để tính khoảng thời gian"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    API lấy tổng hợp dữ liệu giao dịch cho Dashboard với bộ lọc thời gian.
    Trả về số dư ví (all-time), tổng thu, tổng chi (theo period),
    pie_data (chi tiêu theo danh mục), column_data (thu vs chi), 
    và line_data (xu hướng dòng tiền).
    """
    ref_date = datetime.fromisoformat(date) if date else datetime.now()
    start_date, end_date = get_range(period, ref_date)

    # 1. Số dư hiện tại (Tổng balance tất cả các ví) - KHÔNG LỌC THEO THỜI GIAN
    total_balance_query = db.query(func.sum(models.Account.balance))\
        .filter(models.Account.user_id == current_user.id).scalar()
    total_balance = float(total_balance_query) if total_balance_query else 0.0

    # Base query filter cho Transactions
    base_tx_query = db.query(models.Transaction).filter(models.Transaction.user_id == current_user.id)
    if start_date:
        base_tx_query = base_tx_query.filter(models.Transaction.date >= start_date)
    if end_date:
        base_tx_query = base_tx_query.filter(models.Transaction.date < end_date)

    # 2. Tổng thu (theo period)
    total_income_query = base_tx_query.filter(models.Transaction.type == 'income').with_entities(func.sum(models.Transaction.amount)).scalar()
    total_income = float(total_income_query) if total_income_query else 0.0

    # 3. Tổng chi (theo period)
    total_expense_query = base_tx_query.filter(models.Transaction.type == 'expense').with_entities(func.sum(models.Transaction.amount)).scalar()
    total_expense = float(total_expense_query) if total_expense_query else 0.0

    # 4. Gom nhóm chi tiêu theo danh mục (Pie Data)
    pie_query = db.query(
        models.Category.name,
        models.Category.color,
        func.sum(models.Transaction.amount).label("total_amount")
    ).join(
        models.Transaction, models.Transaction.category_id == models.Category.id
    ).filter(
        models.Transaction.user_id == current_user.id,
        models.Transaction.type == 'expense'
    )
    if start_date:
        pie_query = pie_query.filter(models.Transaction.date >= start_date)
    if end_date:
        pie_query = pie_query.filter(models.Transaction.date < end_date)

    category_expenses = pie_query.group_by(
        models.Category.id,
        models.Category.name,
        models.Category.color
    ).all()

    pie_data = [
        {
            "category_name": row.name,
            "color": row.color or "#8884d8",
            "amount": float(row.total_amount)
        }
        for row in category_expenses
    ]

    # 5. Dữ liệu cột (Column Data) - So sánh Thu / Chi
    column_data = [
        {
            "name": "Tổng quan",
            "income": total_income,
            "expense": total_expense
        }
    ]

    # 6. Dữ liệu xu hướng dòng tiền (Line Data/Area Data) - Nhóm theo ngày
    group_date = cast(models.Transaction.date, Date)
    line_query = db.query(
        group_date.label("date"),
        func.sum(case((models.Transaction.type == 'income', models.Transaction.amount), else_=0)).label("income"),
        func.sum(case((models.Transaction.type == 'expense', models.Transaction.amount), else_=0)).label("expense")
    ).filter(models.Transaction.user_id == current_user.id)

    if start_date:
        line_query = line_query.filter(models.Transaction.date >= start_date)
    if end_date:
        line_query = line_query.filter(models.Transaction.date < end_date)

    line_data_result = line_query.group_by(group_date).order_by(group_date).all()

    line_data = [
        {
            "date": row.date.strftime("%d/%m/%Y") if row.date else "",
            "income": float(row.income) if row.income else 0.0,
            "expense": float(row.expense) if row.expense else 0.0
        }
        for row in line_data_result
    ]

    return {
        "balance": total_balance,
        "total_income": total_income,
        "total_expense": total_expense,
        "pie_data": pie_data,
        "column_data": column_data,
        "line_data": line_data
    }
