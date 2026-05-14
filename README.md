# 💳 Spending Plus - Smart Finance App 🚀

**Spending Plus** là một ứng dụng quản lý tài chính cá nhân thông minh, được xây dựng với kiến trúc hiện đại (FastAPI + React/TypeScript). Đặc biệt, ứng dụng tích hợp **AI Chatbot (Gemini)** siêu việt giúp bạn thêm giao dịch và hỏi đáp tài chính nhanh chóng thông qua ngôn ngữ tự nhiên!

---

## ✨ Tính năng nổi bật

- **📊 Quản lý toàn diện:** Theo dõi Tổng thu, Tổng chi, biến động số dư qua các biểu đồ trực quan.
- **👛 Quản lý Ví/Tài khoản & Danh mục:** Phân bổ tiền vào các ví khác nhau, gắn thẻ giao dịch theo danh mục.
- **🎯 Mục tiêu Tiết kiệm & Khoản nợ:** Theo dõi tiến độ gửi tiết kiệm, quản lý các khoản vay/nợ và tự động khấu trừ.
- **📈 Quản lý Ngân sách:** Cài đặt hạn mức chi tiêu cho từng danh mục hàng tháng và theo dõi sát sao.
- **🤖 Trợ lý AI Thông minh (Gemini):** 
  - Tự động hiểu ngữ cảnh tài chính của bạn.
  - Tự động phân tích câu chat tiếng Việt (VD: *"Hôm nay ăn phở 50k"*) để bóc tách thành Giao dịch và tự động lưu vào hệ thống!
  - Lưu trữ lịch sử trò chuyện liền mạch.

---

## 💻 Yêu cầu hệ thống (Prerequisites)

Để khởi chạy dự án trên máy Windows, bạn cần cài đặt sẵn các phần mềm sau:
- **[Python 3.10+](https://www.python.org/downloads/)** (để chạy Backend FastAPI)
- **[Node.js 18+](https://nodejs.org/en/)** (để chạy Frontend React/Vite)
- **[Git](https://git-scm.com/downloads)** (động bộ mã nguồn)
- **Tài khoản Supabase** (Dùng PostgreSQL Database miễn phí)
- **Google AI Studio API Key** (Sử dụng model Gemini)

---

## ⚙️ Cài đặt Backend (Python / FastAPI)

Mở Terminal (hoặc PowerShell) và điều hướng vào thư mục backend:

```bash
cd backend
```

**1. Tạo môi trường ảo (Virtual Environment) và kích hoạt:**
```powershell
python -m venv venv
.\venv\Scripts\activate
```

**2. Cài đặt thư viện cần thiết:**
```bash
pip install -r ../requirements.txt
```

**3. Thiết lập Biến môi trường (`.env`):**
- Sao chép file `.env.example` (nếu có) thành `.env` bên trong thư mục `backend/`.
- Mở file `.env` và điền đầy đủ các thông số sau:

```env
# URL kết nối đến cơ sở dữ liệu Supabase (PostgreSQL)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# JWT Secret Key (Dùng để mã hóa Token Đăng nhập)
SECRET_KEY=your_super_secret_string_here_12345
ACCESS_TOKEN_EXPIRE_MINUTES=43200

# Cấu hình Server
PORT=8000
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```
> *Lưu ý: Đăng ký [Google AI Studio](https://aistudio.google.com/) để lấy `GEMINI_API_KEY`, và [Supabase](https://supabase.com/) để lấy `DATABASE_URL`.*

**4. Khởi chạy Server Backend:**
```bash
uvicorn app.main:app --reload --port 8000
```
> Backend của bạn sẽ chạy tại URL: `http://localhost:8000`. Bạn có thể truy cập `http://localhost:8000/docs` để xem Swagger UI của API.

---

## 🎨 Cài đặt Frontend (React / TypeScript)

Mở một cửa sổ Terminal mới và điều hướng vào thư mục frontend:

```bash
cd frontend
```

**1. Cài đặt các modules (NPM):**
```bash
npm install
```

**2. Khởi chạy Giao diện Frontend:**
```bash
npm run dev
```
> Giao diện web của ứng dụng sẽ khởi động tại URL mạng nội bộ: `http://localhost:5173`. 

---

## 🗄️ Khởi tạo Database (Supabase)

Để dự án hoạt động, Database cần có cấu trúc bảng chuẩn. 
Tại giao diện [Supabase SQL Editor](https://app.supabase.com/project/_/sql), bạn copy & paste các lệnh SQL định nghĩa Schema để tự khởi tạo các bảng sau:

1. `users`: Bảng người dùng.
2. `accounts` (Ví): Các tài khoản chứa tiền.
3. `categories`: Danh mục thu chi.
4. `transactions`: Bảng giao dịch chính.
5. `budgets`: Ngân sách tháng.
6. `savings_goals` & `debts`: Tiết kiệm và nợ.
7. `chat_history`: Lưu trữ lịch sử nhắn tin AI.
8. `notifications`: Thông báo hệ thống.

*(Nếu dự án sử dụng Alembic migration, bạn có thể đứng ở thư mục `backend/` và chạy lệnh `alembic upgrade head` để tự động tạo bảng).*

---

🎉 **Chúc bạn có trải nghiệm quản lý tài chính tuyệt vời cùng Spending Plus!** 🚀
