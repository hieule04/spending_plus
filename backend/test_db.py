import time
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

def test_db_speed():
    load_dotenv(".env")
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL not found")
        return

    print(f"Connecting to: {db_url.split('@')[-1]}")
    start = time.time()
    try:
        engine = create_engine(db_url)
        with engine.connect() as conn:
            conn_time = time.time() - start
            print(f"Connection established in {conn_time:.2f}s")
            
            # Simple query
            q_start = time.time()
            res = conn.execute(text("SELECT 1")).fetchone()
            q_time = time.time() - q_start
            print(f"Simple query SELECT 1 took {q_time:.2f}s")
            
            # Count transactions as a proxy for real load
            q_start = time.time()
            res = conn.execute(text("SELECT count(*) FROM transactions")).fetchone()
            q_time = time.time() - q_start
            print(f"Count transactions took {q_time:.2f}s (Total: {res[0]})")
            
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    test_db_speed()
