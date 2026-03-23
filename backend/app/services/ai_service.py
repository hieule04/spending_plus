"""
app/services/ai_service.py
Service tích hợp Google Gemini AI cho chức năng chat.
Sử dụng google-genai SDK (phiên bản mới).
"""

from google import genai
from app.core.config import settings

# System prompt — hướng dẫn AI về vai trò và cách trả lời
SYSTEM_INSTRUCTION = (
    "Bạn là trợ lý tài chính của ứng dụng Spending Plus. "
    "Hãy trả lời ngắn gọn, lịch sự. "
    "Bạn có thể tư vấn về quản lý chi tiêu, tiết kiệm, ngân sách và đầu tư cá nhân. "
    "Nếu câu hỏi không liên quan đến tài chính, hãy nhẹ nhàng hướng người dùng quay lại chủ đề."
)


class AIService:
    """
    Wrapper async cho Google Genai SDK.
    Sử dụng model gemini-flash-latest với system instruction.
    """

    def __init__(self):
        if not settings.GOOGLE_API_KEY:
            raise ValueError("GOOGLE_API_KEY chưa được cấu hình trong .env")

        self.client = genai.Client(api_key=settings.GOOGLE_API_KEY)

    async def get_ai_response(self, user_message: str) -> str:
        """
        Gửi tin nhắn lên Gemini AI và trả về phản hồi dạng text.
        Sử dụng async client từ google-genai SDK.
        """
        try:
            response = await self.client.aio.models.generate_content(
                model="gemini-flash-latest",
                contents=user_message,
                config=genai.types.GenerateContentConfig(
                    system_instruction=SYSTEM_INSTRUCTION,
                ),
            )
            return response.text
        except Exception as e:
            raise RuntimeError(f"Lỗi khi gọi Gemini AI: {str(e)}") from e


# Singleton — import từ bất kỳ đâu trong project
ai_service = AIService()
