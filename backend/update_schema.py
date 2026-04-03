from sqlalchemy import text
from app.database import engine

def update_schema():
    with engine.connect() as con:
        print("Checking/Updating schema...")
        con.execute(text('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE'))
        con.execute(text('ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_code VARCHAR'))
        con.execute(text('ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP WITH TIME ZONE'))
        con.commit()
        print("Schema updated successfully")

if __name__ == "__main__":
    update_schema()
