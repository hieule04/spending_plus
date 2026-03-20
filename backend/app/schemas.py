"""
app/schemas.py
Pydantic schemas cho request/response validation.
"""

from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID
from decimal import Decimal

# Cấu hình chung cho schema trả về từ SQLAlchemy Model
model_config = ConfigDict(from_attributes=True)


# ==========================================
# 1. User Schemas
# ==========================================

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool = True
    allow_notifications: bool = True


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    avatar_url: Optional[str] = None
    allow_notifications: Optional[bool] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = model_config


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ==========================================
# 2. Account Schemas
# ==========================================

class AccountBase(BaseModel):
    name: str
    type: str = Field(..., description="Loại tài khoản: cash, bank, credit, saving")
    balance: Decimal = Decimal("0.0")


class AccountCreate(AccountBase):
    pass


class AccountUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    balance: Optional[Decimal] = None


class AccountResponse(AccountBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = model_config


# ==========================================
# 3. Category Schemas
# ==========================================

class CategoryBase(BaseModel):
    name: str
    type: str = Field(..., description="'income' hoặc 'expense'")
    icon: Optional[str] = None
    color: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None


class CategoryResponse(CategoryBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = model_config


# ==========================================
# 4. Transaction Schemas
# ==========================================

class TransactionBase(BaseModel):
    amount: Decimal
    type: str = Field(..., description="'income' hoặc 'expense'")
    date: datetime
    note: Optional[str] = None
    account_id: UUID
    category_id: Optional[UUID] = None
    savings_goal_id: Optional[UUID] = None
    debt_id: Optional[UUID] = None


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    amount: Optional[Decimal] = None
    type: Optional[str] = None
    date: Optional[datetime] = None
    note: Optional[str] = None
    account_id: Optional[UUID] = None
    category_id: Optional[UUID] = None
    savings_goal_id: Optional[UUID] = None
    debt_id: Optional[UUID] = None


class TransactionResponse(TransactionBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = model_config


# ==========================================
# 5. Budget Schemas
# ==========================================

class BudgetBase(BaseModel):
    amount_limit: Decimal
    month: int = Field(..., ge=1, le=12, description="Tháng (1-12)")
    year: int = Field(..., ge=2000, description="Năm")
    category_id: UUID


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BaseModel):
    amount_limit: Optional[Decimal] = None
    month: Optional[int] = Field(None, ge=1, le=12)
    year: Optional[int] = Field(None, ge=2000)
    category_id: Optional[UUID] = None


class BudgetResponse(BudgetBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = model_config


class BudgetReportResponse(BaseModel):
    budget_id: UUID
    category_id: UUID
    category_name: str
    amount_limit: Decimal
    total_spent: Decimal
    remaining: Decimal
    percentage: float
    month: int
    year: int
    model_config = model_config


# ==========================================
# 6. Notification Schemas
# ==========================================

class NotificationBase(BaseModel):
    message: str
    type: str
    is_read: bool = False


class NotificationResponse(NotificationBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    model_config = model_config


class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None


# ==========================================
# 7. Savings Goal Schemas
# ==========================================

class SavingsGoalBase(BaseModel):
    name: str
    target_amount: Decimal
    current_amount: Decimal = Decimal("0.0")
    is_completed: bool = False


class SavingsGoalCreate(SavingsGoalBase):
    pass


class SavingsGoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[Decimal] = None
    current_amount: Optional[Decimal] = None
    is_completed: Optional[bool] = None


class SavingsGoalResponse(SavingsGoalBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = model_config


# ==========================================
# 9. Debt Schemas
# ==========================================

class DebtBase(BaseModel):
    creditor_name: str
    total_amount: Decimal
    remaining_amount: Decimal
    monthly_payment: Decimal
    due_date: int = Field(..., ge=1, le=31, description="Ngày hạn hằng tháng (1-31)")


class DebtCreate(BaseModel):
    creditor_name: str
    total_amount: Decimal
    monthly_payment: Decimal
    due_date: int = Field(..., ge=1, le=31)


class DebtUpdate(BaseModel):
    creditor_name: Optional[str] = None
    total_amount: Optional[Decimal] = None
    remaining_amount: Optional[Decimal] = None
    monthly_payment: Optional[Decimal] = None
    due_date: Optional[int] = Field(None, ge=1, le=31)


class DebtResponse(DebtBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = model_config

# ==========================================
# 8. Common/System/Stats Schemas
# ==========================================

class MessageResponse(BaseModel):
    message: str


class DeleteResponse(BaseModel):
    detail: str
    deleted_id: str


class UnreadCountResponse(BaseModel):
    unread_count: int


class SystemHealthResponse(BaseModel):
    message: str


class DatabaseConnectionResponse(BaseModel):
    status: str
    message: str
    supabase_version: Optional[str] = None


class PieDataItem(BaseModel):
    category_name: str
    color: str
    amount: float


class ColumnDataItem(BaseModel):
    name: str
    income: float
    expense: float


class LineDataItem(BaseModel):
    date: str
    income: float
    expense: float


class DashboardSummaryResponse(BaseModel):
    balance: float
    total_income: float
    total_expense: float
    pie_data: list[PieDataItem]
    column_data: list[ColumnDataItem]
    line_data: list[LineDataItem]


# ==========================================
# 9. Chat AI Schemas
# ==========================================

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="Nội dung câu hỏi gửi đến AI")


class ChatResponse(BaseModel):
    reply: str = Field(..., description="Phản hồi từ AI")

