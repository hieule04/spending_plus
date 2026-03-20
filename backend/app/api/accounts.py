"""
app/api/accounts.py
Router CRUD cho bảng Accounts (Ví tiền).
Tất cả đều yêu cầu JWT authentication.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.database import get_db
from app import models, schemas
from app.deps import get_current_user
from app.crud import accounts as crud_accounts

router = APIRouter(prefix="/accounts", tags=["Accounts"])


# ------------------------------------------
# POST / — Tạo tài khoản mới
# ------------------------------------------
@router.post("/", response_model=schemas.AccountResponse, status_code=201)
def create(
    acc: schemas.AccountCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Tạo ví/tài khoản mới cho user đang đăng nhập."""
    try:
        return crud_accounts.create_account(db, user_id=current_user.id, data=acc)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi tạo tài khoản: {str(e)}")


# ------------------------------------------
# GET / — Danh sách tài khoản
# ------------------------------------------
@router.get("/", response_model=list[schemas.AccountResponse])
def list_all(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lấy danh sách tất cả ví/tài khoản của user."""
    return crud_accounts.list_accounts(db, user_id=current_user.id)


# ------------------------------------------
# PUT /{id} — Cập nhật tài khoản
# ------------------------------------------
@router.put("/{account_id}", response_model=schemas.AccountResponse)
def update(
    account_id: UUID,
    acc_update: schemas.AccountUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cập nhật thông tin ví/tài khoản (tên, loại, số dư)."""
    try:
        existing = crud_accounts.get_account(db, account_id, current_user.id)
        if not existing:
            raise HTTPException(status_code=404, detail="Tài khoản không tồn tại.")
        return crud_accounts.update_account(db, existing, acc_update)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi cập nhật tài khoản: {str(e)}")


# ------------------------------------------
# DELETE /{id} — Xoá tài khoản
# ------------------------------------------
@router.delete("/{account_id}", response_model=schemas.DeleteResponse)
def delete(
    account_id: UUID,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Xoá ví/tài khoản. Chặn nếu vẫn còn giao dịch bên trong."""
    try:
        existing = crud_accounts.get_account(db, account_id, current_user.id)
        if not existing:
            raise HTTPException(status_code=404, detail="Tài khoản không tồn tại.")

        txn_count = crud_accounts.count_transactions_for_account(db, account_id)
        if txn_count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Không thể xoá: tài khoản còn {txn_count} giao dịch. Hãy xoá hết giao dịch trước.",
            )

        crud_accounts.delete_account(db, existing)
        return {"detail": "Đã xoá tài khoản thành công.", "deleted_id": str(account_id)}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi xoá tài khoản: {str(e)}")
