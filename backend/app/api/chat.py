"""
app/api/chat.py
API endpoint cho chức năng chat với trợ lý AI.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from app import schemas, models
from app.deps import get_current_user
from app.services.ai_service import ai_service

router = APIRouter(tags=["Chat AI"])


@router.post("/chat", response_model=schemas.ChatResponse)
async def chat_with_ai(
    request: schemas.ChatRequest,
    current_user: models.User = Depends(get_current_user),
):
    """
    Gửi câu hỏi đến trợ lý AI (Gemini 1.5 Flash) và nhận phản hồi.
    - Yêu cầu xác thực JWT.
    - Giới hạn nội dung: 1–2000 ký tự.
    """
    try:
        reply = await ai_service.get_ai_response(request.message)
        return schemas.ChatResponse(reply=reply)
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi không xác định: {str(e)}",
        )
