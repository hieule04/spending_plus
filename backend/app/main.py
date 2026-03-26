"""
main.py — Entry Point
Điểm khởi đầu của ứng dụng Spending Plus Backend.
Chỉ thực hiện 3 việc:
1. Tạo FastAPI app
2. Cấu hình middleware (CORS, logging)
3. Include các APIRouter từ app/api/

Toàn bộ logic nghiệp vụ nằm trong thư mục app/.
"""

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse, Response
import sys
import os
from pathlib import Path

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://spendingplus.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.options("/{rest_of_path:path}")
async def preflight_handler(rest_of_path: str):
    return {}


# Thêm logging để debug lỗi API trong file EXE
@app.middleware("http")
async def log_requests(request, call_next):
    import time
    import json
    start_time = time.time()
    
    # Clone request body for logging if it's a 400 error
    body = b""
    if request.method in ["POST", "PUT", "PATCH"]:
         body = await request.body()
         # Re-set body for the actual handler
         async def receive():
             return {"type": "http.request", "body": body}
         request._receive = receive

    response = await call_next(request)
    duration = time.time() - start_time

    if request.url.path.startswith("/api"):
        print(f"[*] API {request.method} {request.url.path} - Status: {response.status_code} - Duration: {duration:.2f}s")
        if response.status_code == 400:
            print(f"[!] 400 Bad Request Detail:")
            print(f"    - Headers: {dict(request.headers)}")
            if body:
                try:
                    print(f"    - Body: {body.decode('utf-8')}")
                except:
                    print(f"    - Body: {str(body)}")
    return response

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    import traceback
    print(f"[ERROR] Global Exception: {str(exc)}")
    traceback.print_exc()
    return HTMLResponse(content=f"Internal Server Error: {str(exc)}", status_code=500)




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

@app.get("/api/health", tags=["System"], response_model=schemas.SystemHealthResponse)
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


# ==========================================
# 5. HOST FRONTEND (Static Files)
# ==========================================

# Lấy đường dẫn động tới thư mục dist
if getattr(sys, 'frozen', False):
    # Dùng _MEIPASS do PyInstaller giải nén ra thư mục tạm
    _base_dir = Path(sys._MEIPASS)
else:
    # Môi trường dev: thư mục frontend nằm cùng cấp thư mục backend
    _base_dir = Path(__file__).resolve().parent.parent.parent / "frontend"

dist_path = _base_dir / "dist"

if dist_path.exists():
    # Mount các file assets tĩnh
    assets_dir = dist_path / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
    
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend(full_path: str = ""):
        # Tránh can thiệp vào Request của API
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API route not found")
        
        # Nếu truy cập root "/"
        if not full_path or full_path == "":
             index_path = dist_path / "index.html"
             if index_path.exists():
                 return FileResponse(index_path)

        # Nếu có file tĩnh ở root (ví dụ logo.png, favicon)
        file_path = dist_path / full_path
        if full_path and file_path.is_file():
            return FileResponse(file_path)
            
        # Fallback về index.html cho SPA (React)
        index_path = dist_path / "index.html"
        if index_path.exists():
            return FileResponse(index_path)
        else:
            return HTMLResponse("<h1>Frontend built index.html not found!</h1>", status_code=404)
else:
    print(f"Warning: Frontend dist path not found at {dist_path}")

# ==========================================
# 6. RUN SERVER (Cho PyInstaller)
# ==========================================
if __name__ == "__main__":
    import uvicorn
    import webbrowser
    import threading
    import time

    # Mặc định chạy ở port 8000, host 127.0.0.1
    port = int(settings.PORT) if hasattr(settings, 'PORT') and settings.PORT else 8000
    host = settings.HOST if hasattr(settings, 'HOST') and settings.HOST else "127.0.0.1"
    url = f"http://{host}:{port}"

    def open_browser():
        # Chờ 1.5s để server kịp khởi động
        time.sleep(1.5)
        print(f"Opening browser at {url}...")
        webbrowser.open(url)

    # Chạy thread mở trình duyệt song song với server
    threading.Thread(target=open_browser, daemon=True).start()

    print(f"Starting Spending Plus server at {url}...")
    uvicorn.run(app, host=host, port=port)
