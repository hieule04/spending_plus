"""
app/api/categories.py
Router CRUD cho bảng Categories (Danh mục thu/chi).
Tất cả đều yêu cầu JWT authentication.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.database import get_db
from app import models, schemas
from app.deps import get_current_user
from app.crud import categories as crud_categories

router = APIRouter(prefix="/categories", tags=["Categories"])


# ------------------------------------------
# POST / — Tạo danh mục mới
# ------------------------------------------
@router.post("/", response_model=schemas.CategoryResponse, status_code=201)
def create(
    cat: schemas.CategoryCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Tạo danh mục thu/chi mới."""
    try:
        return crud_categories.create_category(db, user_id=current_user.id, data=cat)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi tạo danh mục: {str(e)}")


# ------------------------------------------
# GET / — Danh sách danh mục
# ------------------------------------------
@router.get("/", response_model=list[schemas.CategoryResponse])
def list_all(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lấy danh sách tất cả danh mục của user."""
    return crud_categories.list_categories(db, user_id=current_user.id)


# ------------------------------------------
# PUT /{id} — Cập nhật danh mục
# ------------------------------------------
@router.put("/{category_id}", response_model=schemas.CategoryResponse)
def update(
    category_id: UUID,
    cat_update: schemas.CategoryUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cập nhật thông tin danh mục (tên, loại, icon, màu sắc)."""
    try:
        existing = crud_categories.get_category(db, category_id, current_user.id)
        if not existing:
            raise HTTPException(status_code=404, detail="Danh mục không tồn tại.")
        return crud_categories.update_category(db, existing, cat_update)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi cập nhật danh mục: {str(e)}")


# ------------------------------------------
# DELETE /{id} — Xoá danh mục
# ------------------------------------------
@router.delete("/{category_id}", response_model=schemas.DeleteResponse)
def delete(
    category_id: UUID,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Xoá danh mục. Chặn nếu đang có giao dịch sử dụng."""
    try:
        existing = crud_categories.get_category(db, category_id, current_user.id)
        if not existing:
            raise HTTPException(status_code=404, detail="Danh mục không tồn tại.")

        txn_count = crud_categories.count_transactions_for_category(db, category_id)
        if txn_count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Không thể xoá: danh mục đang được {txn_count} giao dịch sử dụng.",
            )

        crud_categories.delete_category(db, existing)
        return {"detail": "Đã xoá danh mục thành công.", "deleted_id": str(category_id)}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi xoá danh mục: {str(e)}")
