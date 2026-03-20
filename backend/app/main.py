"""
main.py — Entry Point
Điểm khởi đầu của ứng dụng Spending Plus Backend.
Chỉ thực hiện 3 việc:
1. Tạo FastAPI app
2. Cấu hình middleware (CORS, logging)
3. Include các APIRouter từ app/api/

Toàn bộ logic nghiệp vụ nằm trong thư mục app/.
"""

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

# Import config & database
from app.core.config import settings
from app.database import get_db, engine
from app import models, schemas

# Import tất cả các routers
from app.api import auth, accounts, categories, transactions, users, budgets, stats, notifications, savings, debts, chat

# ==========================================
# 1. KHỞI TẠO APP
# ==========================================

# Tạo bảng nếu chưa có (development only)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Spending Plus API")

# ==========================================
# 2. MIDDLEWARE
# ==========================================

# CORS cho React (Vite) và Tauri
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# 3. INCLUDE ROUTERS
# ==========================================
# Đăng ký các router (API endpoints)
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api")
app.include_router(accounts.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(transactions.router, prefix="/api")
app.include_router(stats.router, prefix="/api")
app.include_router(budgets.router, prefix="/api/budgets", tags=["Budgets"])
app.include_router(notifications.router, prefix="/api", tags=["Notifications"])
app.include_router(savings.router, prefix="/api", tags=["Savings"])
app.include_router(debts.router, prefix="/api", tags=["Debts"])
app.include_router(chat.router, prefix="/api", tags=["Chat AI"])


# ==========================================
# 4. SYSTEM ENDPOINTS
# ==========================================

@app.get("/", tags=["System"], response_model=schemas.SystemHealthResponse)
def read_root():
    """Health check — kiểm tra backend có đang chạy không."""
    return {"message": "Spending Plus Backend is running!"}


@app.get("/test-db", tags=["System"], response_model=schemas.DatabaseConnectionResponse)
def test_database_connection(db: Session = Depends(get_db)):
    """Kiểm tra kết nối tới Supabase PostgreSQL."""
    try:
        result = db.execute(text("SELECT version();")).fetchone()
        return {
            "status": "success",
            "message": "Kết nối Supabase thành công! 🎉",
            "supabase_version": result[0],
        }
    except Exception as e:
        return {"status": "error", "message": f"Lỗi kết nối: {str(e)}"}
