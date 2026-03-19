from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List

from app.database import get_db
from app.models import Budget, User, Category
from app.schemas import BudgetCreate, BudgetResponse, BudgetReportResponse
from app.deps import get_current_user
from app.crud import budgets as crud_budgets

router = APIRouter()

@router.post("/", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def create_budget(
    budget_in: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Thiết lập hoặc cập nhật ngân sách cho một danh mục trong tháng/năm.
    (Upsert logic: Nếu đã tồn tại thì ghi đè số tiền).
    """
    # 1. Kiểm tra Category có thuộc về user hiện tại không
    category = db.query(Category).filter(
        Category.id == budget_in.category_id,
        Category.user_id == current_user.id
    ).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Danh mục không tồn tại hoặc không thuộc về bạn")

    # 2. Kiểm tra xem ngân sách cho danh mục/tháng/năm này đã có chưa (Upsert)
    existing_budget = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.category_id == budget_in.category_id,
        Budget.month == budget_in.month,
        Budget.year == budget_in.year
    ).first()

    if existing_budget:
        # Cập nhật số tiền
        existing_budget.amount_limit = budget_in.amount_limit
        db.commit()
        db.refresh(existing_budget)
        return existing_budget

    # 3. Nếu chưa có, tạo ngân sách mới
    new_budget = Budget(
        user_id=current_user.id,
        category_id=budget_in.category_id,
        amount_limit=budget_in.amount_limit,
        month=budget_in.month,
        year=budget_in.year
    )
    db.add(new_budget)
    
    try:
        db.commit()
        db.refresh(new_budget)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Ngân sách cho danh mục này trong tháng/năm này đã tồn tại."
        )

    return new_budget


@router.get("/report", response_model=List[BudgetReportResponse])
def get_budgets_report(
    month: int,
    year: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy báo cáo tiến độ ngân sách trong một tháng/năm cụ thể.
    """
    report = crud_budgets.get_budget_report(db, user_id=current_user.id, month=month, year=year)
    return report

@router.get("/", response_model=List[BudgetResponse])
def get_budgets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy danh sách tất cả ngân sách của user hiện tại.
    """
    budgets = db.query(Budget).filter(Budget.user_id == current_user.id).all()
    return budgets
