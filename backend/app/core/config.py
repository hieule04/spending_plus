"""
app/core/config.py
Quản lý cấu hình toàn bộ ứng dụng bằng biến môi trường (Environment Variables).
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

if getattr(sys, 'frozen', False):
    # Chạy dưới dạng exe (PyInstaller)
    # Lấy đường dẫn tuyệt đối của file .exe
    _base_dir = Path(sys.executable).resolve().parent
    _env_path = _base_dir / ".env"
    print(f"[*] RUNNING AS EXE. Base Dir: {_base_dir}")
    print(f"[*] Looking for .env at: {_env_path}")
else:
    # Chạy dưới dạng dev (FastAPI chuẩn)
    _env_path = Path(__file__).resolve().parent.parent.parent / ".env"
    print(f"[*] RUNNING AS DEV. Looking for .env at: {_env_path}")

if _env_path.exists():
    load_dotenv(_env_path, override=True) # Đảm bảo ghi đè nếu có biến môi trường cũ
    print(f"[+] .env loaded successfully from {_env_path}")
else:
    print(f"[!] Warning: .env file NOT FOUND at {_env_path}")

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

    # --- Google AI ---
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")

    # --- App ---
    APP_TITLE: str = "Spending Plus API"
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "127.0.0.1")


# Singleton — import settings từ bất kỳ đâu trong project
settings = Settings()

# In log kiểm tra Database (Ẩn mật khẩu)
if settings.DATABASE_URL:
    db_display = settings.DATABASE_URL.split("@")[-1] if "@" in settings.DATABASE_URL else "..."
    print(f"[*] Database Host Target: ...@{db_display}")
