import logging
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from app.core.config import settings

# Cấu hình FastMail
conf = None
if settings.MAIL_USERNAME and settings.MAIL_PASSWORD:
    conf = ConnectionConfig(
        MAIL_USERNAME=settings.MAIL_USERNAME,
        MAIL_PASSWORD=settings.MAIL_PASSWORD,
        MAIL_FROM=settings.MAIL_FROM or settings.MAIL_USERNAME,
        MAIL_PORT=settings.MAIL_PORT,
        MAIL_SERVER=settings.MAIL_SERVER,
        MAIL_STARTTLS=True,
        MAIL_SSL_TLS=False,
        USE_CREDENTIALS=True,
        VALIDATE_CERTS=False, # Tránh lỗi SSL trên một số môi trường
    )

async def send_otp_email(email_to: str, otp_code: str):
    """
    Hàm gửi email chứa mã OTP.
    Được gọi thông qua BackgroundTasks để không block request.
    """
    if not conf:
        logging.warning("FastAPI-Mail: Chưa cấu hình thông tin Email (MAIL_USERNAME/PASSWORD). Bỏ qua việc gửi OTP.")
        return

    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #1e293b; text-align: center;">Mã Xác Thực Spending Plus</h2>
        <p style="color: #475569; font-size: 16px;">Xin chào,</p>
        <p style="color: #475569; font-size: 16px;">Cảm ơn bạn đã đăng ký tài khoản tại Spending Plus. Dưới đây là mã xác thực (OTP) của bạn. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
        <div style="background-color: #f1f5f9; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0f172a;">{otp_code}</span>
        </div>
        <p style="color: #ef4444; font-size: 14px; text-align: center;">*Mã này sẽ hết hạn sau 10 phút.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.</p>
    </div>
    """

    message = MessageSchema(
        subject="Xác nhận tài khoản Spending Plus",
        recipients=[email_to],
        body=html_content,
        subtype=MessageType.html
    )

    try:
        fm = FastMail(conf)
        await fm.send_message(message)
        logging.info(f"Đã gửi OTP email thành công tới {email_to}")
    except Exception as e:
        logging.error(f"Lỗi gửi OTP email tới {email_to}: {e}")
