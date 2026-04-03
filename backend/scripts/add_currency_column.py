from sqlalchemy import text
from app.database import engine

def add_currency_column():
    with engine.connect() as conn:
        print("Checking if 'currency' column exists in 'users' table...")
        # Check if column exists
        res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='currency'"))
        if not res.fetchone():
            print("Adding 'currency' column...")
            conn.execute(text("ALTER TABLE users ADD COLUMN currency VARCHAR DEFAULT 'đ'"))
            conn.commit()
            print("Done.")
        else:
            print("Column 'currency' already exists.")

if __name__ == "__main__":
    add_currency_column()
