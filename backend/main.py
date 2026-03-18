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
            hashed_password=user.password  # Tạm thời lưu thô để test kết nối
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# TRANSACTION ENDPOINTS
# ==========================================

def _apply_balance(account: models.Account, amount, txn_type: str, reverse: bool = False):
    """
    Cập nhật balance của account dựa trên loại giao dịch.
    - income  → cộng tiền vào account
    - expense → trừ tiền khỏi account
    Nếu reverse=True thì làm ngược lại (dùng khi xoá / hoàn tác).
    """
    from decimal import Decimal
    amt = Decimal(str(amount))

    if txn_type == "income":
        account.balance = account.balance + amt if not reverse else account.balance - amt
    elif txn_type == "expense":
        account.balance = account.balance - amt if not reverse else account.balance + amt
    # transfer có thể mở rộng sau


# ------------------------------------------
# 1) POST /transactions/ – Tạo giao dịch mới
# ------------------------------------------
@app.post("/transactions/", response_model=schemas.TransactionResponse, status_code=201)
def create_transaction(
    txn: schemas.TransactionCreate,
    user_id: str,          # tạm truyền qua query-param; sau này thay bằng auth token
    db: Session = Depends(get_db),
):
    try:
        from uuid import UUID as _UUID
        uid = _UUID(user_id)

        # Kiểm tra Account có tồn tại và thuộc về user không
        account = (
            db.query(models.Account)
            .filter(models.Account.id == txn.account_id, models.Account.user_id == uid)
            .first()
        )
        if not account:
            raise HTTPException(status_code=404, detail="Tài khoản không tồn tại hoặc không thuộc về bạn.")

        # Kiểm tra Category (nếu có)
        if txn.category_id:
            category = (
                db.query(models.Category)
                .filter(models.Category.id == txn.category_id, models.Category.user_id == uid)
                .first()
            )
            if not category:
                raise HTTPException(status_code=404, detail="Danh mục không tồn tại hoặc không thuộc về bạn.")

        # Tạo giao dịch
        new_txn = models.Transaction(
            amount=txn.amount,
            type=txn.type,
            date=txn.date,
            note=txn.note,
            user_id=uid,
            account_id=txn.account_id,
            category_id=txn.category_id,
        )
        db.add(new_txn)

        # Cập nhật balance
        _apply_balance(account, txn.amount, txn.type)

        db.commit()
        db.refresh(new_txn)
        return new_txn

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi tạo giao dịch: {str(e)}")


# ------------------------------------------
# 2) GET /transactions/ – Danh sách giao dịch
# ------------------------------------------
@app.get("/transactions/", response_model=list[schemas.TransactionResponse])
def list_transactions(
    user_id: str,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    try:
        from uuid import UUID as _UUID
        uid = _UUID(user_id)

        transactions = (
            db.query(models.Transaction)
            .filter(models.Transaction.user_id == uid)
            .order_by(models.Transaction.date.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return transactions

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi lấy danh sách giao dịch: {str(e)}")


# ------------------------------------------
# 3) PUT /transactions/{id} – Cập nhật giao dịch
# ------------------------------------------
@app.put("/transactions/{txn_id}", response_model=schemas.TransactionResponse)
def update_transaction(
    txn_id: str,
    txn_update: schemas.TransactionUpdate,
    user_id: str,
    db: Session = Depends(get_db),
):
    try:
        from uuid import UUID as _UUID
        uid = _UUID(user_id)
        tid = _UUID(txn_id)

        # Lấy giao dịch hiện tại
        existing = (
            db.query(models.Transaction)
            .filter(models.Transaction.id == tid, models.Transaction.user_id == uid)
            .first()
        )
        if not existing:
            raise HTTPException(status_code=404, detail="Giao dịch không tồn tại.")

        # --- Xử lý thay đổi balance ---
        old_amount = existing.amount
        old_type = existing.type
        old_account_id = existing.account_id

        new_amount = txn_update.amount if txn_update.amount is not None else old_amount
        new_type = txn_update.type if txn_update.type is not None else old_type
        new_account_id = txn_update.account_id if txn_update.account_id is not None else old_account_id

        # Nếu account thay đổi hoặc amount/type thay đổi → cần điều chỉnh balance
        old_account = db.query(models.Account).filter(models.Account.id == old_account_id).first()
        if not old_account:
            raise HTTPException(status_code=404, detail="Tài khoản cũ không tồn tại.")

        # Hoàn trả balance cũ
        _apply_balance(old_account, old_amount, old_type, reverse=True)

        # Nếu đổi tài khoản → lấy tài khoản mới
        if new_account_id != old_account_id:
            new_account = (
                db.query(models.Account)
                .filter(models.Account.id == new_account_id, models.Account.user_id == uid)
                .first()
            )
            if not new_account:
                raise HTTPException(status_code=404, detail="Tài khoản mới không tồn tại hoặc không thuộc về bạn.")
        else:
            new_account = old_account

        # Áp dụng balance mới
        _apply_balance(new_account, new_amount, new_type)

        # Kiểm tra Category mới (nếu có)
        if txn_update.category_id is not None:
            category = (
                db.query(models.Category)
                .filter(models.Category.id == txn_update.category_id, models.Category.user_id == uid)
                .first()
            )
            if not category:
                raise HTTPException(status_code=404, detail="Danh mục không tồn tại hoặc không thuộc về bạn.")

        # Cập nhật các trường
        update_data = txn_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(existing, key, value)

        db.commit()
        db.refresh(existing)
        return existing

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi cập nhật giao dịch: {str(e)}")


# ------------------------------------------
# 4) DELETE /transactions/{id} – Xoá giao dịch
# ------------------------------------------
@app.delete("/transactions/{txn_id}", status_code=200)
def delete_transaction(
    txn_id: str,
    user_id: str,
    db: Session = Depends(get_db),
):
    try:
        from uuid import UUID as _UUID
        uid = _UUID(user_id)
        tid = _UUID(txn_id)

        existing = (
            db.query(models.Transaction)
            .filter(models.Transaction.id == tid, models.Transaction.user_id == uid)
            .first()
        )
        if not existing:
            raise HTTPException(status_code=404, detail="Giao dịch không tồn tại.")

        # Hoàn trả balance về account
        account = db.query(models.Account).filter(models.Account.id == existing.account_id).first()
        if account:
            _apply_balance(account, existing.amount, existing.type, reverse=True)

        db.delete(existing)
        db.commit()

        return {"detail": "Đã xoá giao dịch thành công.", "deleted_id": str(tid)}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi xoá giao dịch: {str(e)}")