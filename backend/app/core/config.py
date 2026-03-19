"""
app/core/config.py
Quản lý cấu hình toàn bộ ứng dụng bằng biến môi trường (Environment Variables).
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Tải file .env từ thư mục gốc backend/
_env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(_env_path)


def _parse_origins(raw: str) -> list[str]:
    """Phân tích chuỗi CORS_ORIGINS thành list. Nếu rỗng, dùng giá trị mặc định."""
    if raw:
        return [o.strip() for o in raw.split(",")]
    return [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "tauri://localhost",
    ]


class Settings:
    """
    Lớp cấu hình trung tâm — tất cả giá trị đều lấy từ biến môi trường (.env).
    Nếu thiếu biến, sẽ dùng giá trị mặc định phù hợp cho môi trường development.
    """

    # --- Database ---
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", "postgresql://localhost:5432/spending_plus"
    )

    # Sửa lỗi phổ biến: SQLAlchemy yêu cầu 'postgresql://' thay vì 'postgres://'
    if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

    # --- Security / JWT ---
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY",
        "b398df981df5eb4ad72c57f920fca5df2f0b9f5d3767c2e9b0bc7e307ea99818",
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", str(60 * 24 * 7))  # 7 ngày
    )

    # --- CORS ---
    CORS_ORIGINS: list[str] = _parse_origins(os.getenv("CORS_ORIGINS", ""))

    # --- App ---
    APP_TITLE: str = "Spending Plus API"


# Singleton — import settings từ bất kỳ đâu trong project
settings = Settings()
