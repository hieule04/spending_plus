import sys
import os

# Thêm thư mục gốc của dự án vào PYTHONPATH để có thể import app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import engine, Base
from sqlalchemy import text
from app import models

def migrate():
    print("Bắt đầu cập nhật Database Schema...")
    
    # 1. Tạo các bảng mới (nếu chưa có, ví dụ bảng 'debts')
    Base.metadata.create_all(bind=engine)
    print("- Đã kiểm tra và tạo các bảng mới (nếu cần).")

    # 2. Thêm cột 'debt_id' vào bảng 'transactions'
    with engine.connect() as conn:
        try:
            # Kiểm tra xem cột debt_id đã tồn tại chưa
            result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='transactions' AND column_name='debt_id'")).fetchone()
            
            if not result:
                print("- Cột 'debt_id' chưa tồn tại trong bảng 'transactions'. Đang thêm...")
                conn.execute(text("ALTER TABLE transactions ADD COLUMN debt_id UUID REFERENCES debts(id) ON DELETE SET NULL"))
                conn.commit()
                print("- Đã thêm cột 'debt_id' thành công.")
            else:
                print("- Cột 'debt_id' đã tồn tại trong bảng 'transactions'.")
                
        except Exception as e:
            print(f"- Lỗi khi cập nhật bảng 'transactions': {e}")
            conn.rollback()

    print("Hoàn tất cập nhật Database Schema.")

if __name__ == "__main__":
    migrate()
