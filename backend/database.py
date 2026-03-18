import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Tải biến môi trường từ file .env
load_dotenv()

# Lấy URL kết nối
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# Sửa lỗi phổ biến: SQLAlchemy bản mới yêu cầu bắt đầu bằng 'postgresql://' thay vì 'postgres://'
if SQLALCHEMY_DATABASE_URL and SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Khởi tạo Engine kết nối tới Supabase
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Khởi tạo Session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class để các file Models sau này kế thừa
Base = declarative_base()

# Hàm tạo dependency để gọi database trong các API
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()