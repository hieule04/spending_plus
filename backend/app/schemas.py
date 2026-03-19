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


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    avatar_url: Optional[str] = None


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
    type: str = Field(..., description="'income', 'expense', hoặc 'transfer'")
    date: datetime
    note: Optional[str] = None
    account_id: UUID
    category_id: Optional[UUID] = None


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    amount: Optional[Decimal] = None
    type: Optional[str] = None
    date: Optional[datetime] = None
    note: Optional[str] = None
    account_id: Optional[UUID] = None
    category_id: Optional[UUID] = None


class TransactionResponse(TransactionBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = model_config
