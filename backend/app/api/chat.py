"""
app/api/chat.py
API endpoint cho chức năng chat với trợ lý AI.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import schemas, models
from app.deps import get_current_user
from app.database import get_db
from app.services.ai_service import ai_service

router = APIRouter(tags=["Chat AI"])


@router.post("/chat", response_model=schemas.ChatResponse)
async def chat_with_ai(
    request: schemas.ChatRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Gui cau hoi den tro ly AI (Gemini) va nhan phan hoi.
    - Yêu cầu xác thực JWT.
    - Giới hạn nội dung: 1–2000 ký tự.
    - Lưu lại lịch sử chat.
    """
    try:
        # Lưu tin nhắn của người dùng
        user_msg = models.ChatHistory(
            user_id=current_user.id,
            role="user",
            content=request.message,
        )
        db.add(user_msg)
        db.commit()

        # Gọi AI — process_chat trả về {"message": str, "transaction_created": bool}
        result = await ai_service.process_chat(
            user_message=request.message,
            db=db,
            user_id=current_user.id,
        )

        reply_text = result["message"]
        transaction_created = result.get("transaction_created", False)

        # Lưu tin nhắn của AI
        ai_msg = models.ChatHistory(
            user_id=current_user.id,
            role="ai",
            content=reply_text,
        )
        db.add(ai_msg)
        db.commit()

        return schemas.ChatResponse(
            reply=reply_text,
            transaction_created=transaction_created,
        )
    except RuntimeError as e:
        import traceback
        print(f"[ERROR] AI Chat RuntimeError: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi không xác định: {str(e)}",
        )


@router.get("/chat/history", response_model=list[schemas.ChatHistoryResponse])
def get_chat_history(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Lấy lịch sử chat của người dùng hiện tại, sắp xếp theo thời gian cũ nhất đến mới nhất.
    """
    history = db.query(models.ChatHistory).filter(models.ChatHistory.user_id == current_user.id).order_by(models.ChatHistory.created_at.asc()).all()
    return history
