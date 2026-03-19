"""
app/models.py
Định nghĩa các bảng (Tables) bằng SQLAlchemy ORM.
Các bảng: User, Account, Category, Transaction.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Numeric, Boolean, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    """Bảng người dùng."""
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(TIMESTAMP(timezone=True), nullable=True)

    accounts = relationship("Account", back_populates="user")
    categories = relationship("Category", back_populates="user")
    transactions = relationship("Transaction", back_populates="user")
    budgets = relationship("Budget", back_populates="user")


class Account(Base):
    """Bảng tài khoản tiền (ví, ngân hàng, tiết kiệm...)."""
    __tablename__ = "accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    balance = Column(Numeric(15, 2), default=0.0)

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(TIMESTAMP(timezone=True), nullable=True)

    user = relationship("User", back_populates="accounts")
    transactions = relationship("Transaction", back_populates="account")


class Category(Base):
    """Bảng danh mục thu/chi."""
    __tablename__ = "categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    icon = Column(String, nullable=True)
    color = Column(String, nullable=True)

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(TIMESTAMP(timezone=True), nullable=True)

    user = relationship("User", back_populates="categories")
    transactions = relationship("Transaction", back_populates="category")
    budgets = relationship("Budget", back_populates="category")


class Budget(Base):
    """Bảng giới hạn ngân sách theo tháng/năm."""
    __tablename__ = "budgets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    amount_limit = Column(Numeric(15, 2), nullable=False)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=False)

    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(TIMESTAMP(timezone=True), nullable=True)

    __table_args__ = (
        UniqueConstraint('user_id', 'category_id', 'month', 'year', name='uix_user_category_month_year'),
    )

    user = relationship("User", back_populates="budgets")
    category = relationship("Category", back_populates="budgets")


class Transaction(Base):
    """Bảng giao dịch."""
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    amount = Column(Numeric(15, 2), nullable=False)
    type = Column(String, nullable=False)
    date = Column(TIMESTAMP(timezone=True), nullable=False, default=datetime.utcnow)
    note = Column(String, nullable=True)

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    account_id = Column(UUID(as_uuid=True), ForeignKey("accounts.id"), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True)

    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(TIMESTAMP(timezone=True), nullable=True)

    user = relationship("User", back_populates="transactions")
    account = relationship("Account", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")
