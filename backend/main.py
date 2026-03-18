import os
from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Import các thư viện từ SQLAlchemy và database.py
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db, engine

# --- PHẦN BỔ SUNG: Import Models và Schemas ---
import models
import schemas

# Lệnh này yêu cầu SQLAlchemy kiểm tra và tạo bảng nếu chưa có (dù đã tạo bằng SQL thủ công)
models.Base.metadata.create_all(bind=engine)

# 1. TẢI BIẾN MÔI TRƯỜNG TỪ FILE .env
load_dotenv()

app = FastAPI(title="Spending Plus API")

# 2. CẤU HÌNH CORS CHO REACT VÀ TAURI
origins_env = os.getenv("CORS_ORIGINS")
if origins_env:
    origins = [o.strip() for o in origins_env.split(",")]
else:
    origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "tauri://localhost"
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. MIDDLEWARE GHI LOG
@app.middleware("http")
async def log_origin(request: Request, call_next):
    origin = request.headers.get("origin")
    if origin:
        print("Request Origin:", origin)
    response = await call_next(request)
    return response

# --- CÁC ENDPOINTS (API) ---

@app.get("/")
def read_root():
    return {"message": "Spending Plus Backend is running!"}

# Endpoint cũ để test kết nối chuỗi SQL
@app.get("/test-db")
def test_database_connection(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("SELECT version();")).fetchone()
        return {
            "status": "success",
            "message": "Kết nối Supabase thành công! 🎉",
            "supabase_version": result[0]
        }
    except Exception as e:
        return {"status": "error", "message": f"Lỗi kết nối: {str(e)}"}

# --- PHẦN BỔ SUNG: API TEST CREATE USER ---
# Dùng để kiểm tra xem models.py và schemas.py có hoạt động khớp với nhau không
@app.post("/test-create-user", response_model=schemas.UserResponse)
def test_create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    try:
        # Kiểm tra email trùng
        db_user = db.query(models.User).filter(models.User.email == user.email).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Email đã tồn tại")
        
        # Tạo object từ model (Lưu ý: Antigravity có thể đặt tên trường mật khẩu khác, hãy kiểm tra lại)
        new_user = models.User(
            email=user.email, 
            password_hash=user.password  # Tạm thời lưu thô để test kết nối
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))