"""
app/database.py
Khởi tạo kết nối SQLAlchemy đến PostgreSQL (Supabase).
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.core.config import settings

# Khởi tạo Engine kết nối
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_timeout=10,
    connect_args={
        "connect_timeout": 10,
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5,
    },
)

# Khởi tạo Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class cho tất cả SQLAlchemy Models
Base = declarative_base()


def get_db():
    """FastAPI dependency — tạo DB session cho mỗi request và tự động đóng sau khi xong."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
