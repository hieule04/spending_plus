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

def get_start_date(period: str) -> datetime | None:
    now = datetime.now()
    if period == "day":
        return now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "week":
        start = now - timedelta(days=now.weekday())
        return start.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "month":
        return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == "year":
        return now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    return None

@router.get("/summary", response_model=schemas.DashboardSummaryResponse)
def get_dashboard_summary(
    period: str = Query("month", description="Lọc theo: all, day, week, month, year"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    API lấy tổng hợp dữ liệu giao dịch cho Dashboard với bộ lọc thời gian.
    Trả về số dư ví (all-time), tổng thu, tổng chi (theo period),
    pie_data (chi tiêu theo danh mục), column_data (thu vs chi), 
    và line_data (xu hướng dòng tiền).
    """
    start_date = get_start_date(period)

    # 1. Số dư hiện tại (Tổng balance tất cả các ví) - KHÔNG LỌC THEO THỜI GIAN
    total_balance_query = db.query(func.sum(models.Account.balance))\
        .filter(models.Account.user_id == current_user.id).scalar()
    total_balance = float(total_balance_query) if total_balance_query else 0.0

    # Base query filter cho Transactions
    base_tx_query = db.query(models.Transaction).filter(models.Transaction.user_id == current_user.id)
    if start_date:
        base_tx_query = base_tx_query.filter(models.Transaction.date >= start_date)

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
