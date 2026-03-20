"""
app/api/transactions.py
Router CRUD cho bảng Transactions (Giao dịch).
Tất cả đều yêu cầu JWT authentication.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.database import get_db
from app import models, schemas
from app.deps import get_current_user
from app.crud import transactions as crud_txn
from app.crud import accounts as crud_accounts
from app.crud import categories as crud_categories

router = APIRouter(prefix="/transactions", tags=["Transactions"])


# ------------------------------------------
# POST / — Tạo giao dịch mới
# ------------------------------------------
@router.post("/", response_model=schemas.TransactionResponse, status_code=201)
def create(
    txn: schemas.TransactionCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Tạo giao dịch mới.
    Tự động cập nhật balance của tài khoản tương ứng:
    - income → cộng tiền
    - expense → trừ tiền
    """
    try:
        # Validate account thuộc về user
        account = crud_accounts.get_account(db, txn.account_id, current_user.id)
        if not account:
            raise HTTPException(status_code=404, detail="Tài khoản không tồn tại hoặc không thuộc về bạn.")

        # Validate category (nếu có)
        if txn.category_id:
            category = crud_categories.get_category(db, txn.category_id, current_user.id)
            if not category:
                raise HTTPException(status_code=404, detail="Danh mục không tồn tại hoặc không thuộc về bạn.")

        return crud_txn.create_transaction(db, user_id=current_user.id, data=txn, account=account)

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi tạo giao dịch: {str(e)}")


# ------------------------------------------
# GET / — Danh sách giao dịch
# ------------------------------------------
@router.get("/", response_model=list[schemas.TransactionResponse])
def list_all(
    skip: int = 0,
    limit: int = 50,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lấy danh sách giao dịch của user, phân trang."""
    return crud_txn.list_transactions(db, user_id=current_user.id, skip=skip, limit=limit)


# ------------------------------------------
# PUT /{id} — Cập nhật giao dịch
# ------------------------------------------
@router.put("/{txn_id}", response_model=schemas.TransactionResponse)
def update(
    txn_id: UUID,
    txn_update: schemas.TransactionUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Cập nhật giao dịch.
    Tính toán chênh lệch để cập nhật balance chính xác.
    Hỗ trợ đổi tài khoản giữa chừng.
    """
    try:
        # Lấy giao dịch hiện tại
        existing = (
            db.query(models.Transaction)
            .filter(models.Transaction.id == txn_id, models.Transaction.user_id == current_user.id)
            .first()
        )
        if not existing:
            raise HTTPException(status_code=404, detail="Giao dịch không tồn tại.")

        # Tài khoản cũ
        old_account = db.query(models.Account).filter(models.Account.id == existing.account_id).first()
        if not old_account:
            raise HTTPException(status_code=404, detail="Tài khoản cũ không tồn tại.")

        # Tài khoản mới (nếu đổi)
        new_account_id = txn_update.account_id if txn_update.account_id is not None else existing.account_id
        if new_account_id != existing.account_id:
            new_account = crud_accounts.get_account(db, new_account_id, current_user.id)
            if not new_account:
                raise HTTPException(status_code=404, detail="Tài khoản mới không tồn tại hoặc không thuộc về bạn.")
        else:
            new_account = old_account

        # Validate category mới (nếu có)
        if txn_update.category_id is not None:
            category = crud_categories.get_category(db, txn_update.category_id, current_user.id)
            if not category:
                raise HTTPException(status_code=404, detail="Danh mục không tồn tại hoặc không thuộc về bạn.")

        return crud_txn.update_transaction(db, existing, txn_update, old_account, new_account)

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi cập nhật giao dịch: {str(e)}")


# ------------------------------------------
# DELETE /{id} — Xoá giao dịch
# ------------------------------------------
@router.delete("/{txn_id}", response_model=schemas.DeleteResponse)
def delete(
    txn_id: UUID,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Xoá giao dịch. Tự động hoàn lại số tiền vào balance tài khoản."""
    try:
        existing = (
            db.query(models.Transaction)
            .filter(models.Transaction.id == txn_id, models.Transaction.user_id == current_user.id)
            .first()
        )
        if not existing:
            raise HTTPException(status_code=404, detail="Giao dịch không tồn tại.")

        account = db.query(models.Account).filter(models.Account.id == existing.account_id).first()
        if not account:
            raise HTTPException(status_code=404, detail="Tài khoản liên quan không tồn tại.")

        crud_txn.delete_transaction(db, existing, account)
        return {"detail": "Đã xoá giao dịch thành công.", "deleted_id": str(txn_id)}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi xoá giao dịch: {str(e)}")
