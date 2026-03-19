import uuid
from decimal import Decimal
from datetime import datetime
from app.database import SessionLocal
from app.models import User, Category, Budget, Transaction
from app.crud.budgets import get_budget_report

def run_db_test():
    db = SessionLocal()
    try:
        user = db.query(User).first()
        if not user:
            print("No users found.")
            return
            
        category = db.query(Category).filter(Category.user_id == user.id, Category.type == 'expense').first()
        if not category:
            print("No expense categories found.")
            return
            
        print(f"Testing for User: {user.email}, Category: {category.name}")
        
        # 1. UPSERT Test
        month, year = 3, 2026
        
        # Insert
        b1 = db.query(Budget).filter_by(user_id=user.id, category_id=category.id, month=month, year=year).first()
        if not b1:
            b1 = Budget(user_id=user.id, category_id=category.id, amount_limit=Decimal('5000000'), month=month, year=year)
            db.add(b1)
            db.commit()
            print("✅ Inserted Budget: 5,000,000")
        else:
            b1.amount_limit = Decimal('5000000')
            db.commit()
            
        # Update (Upsert Simulation)
        b1.amount_limit = Decimal('8000000')
        db.commit()
        print(f"✅ Upserted Budget: {b1.amount_limit}")
        
        # 2. Add Transactions
        account = user.accounts[0] if user.accounts else None
        if account:
            t1 = Transaction(amount=Decimal('1500000'), type='expense', date=datetime(2026, 3, 10), user_id=user.id, account_id=account.id, category_id=category.id)
            t2 = Transaction(amount=Decimal('500000'), type='expense', date=datetime(2026, 3, 15), user_id=user.id, account_id=account.id, category_id=category.id)
            t3 = Transaction(amount=Decimal('1000000'), type='income', date=datetime(2026, 3, 20), user_id=user.id, account_id=account.id, category_id=category.id) # Should be ignored
            t4 = Transaction(amount=Decimal('200000'), type='expense', date=datetime(2026, 2, 10), user_id=user.id, account_id=account.id, category_id=category.id) # Wrong month
            db.add_all([t1, t2, t3, t4])
            db.commit()
            print("✅ Inserted Test Transactions (2M expense in March, 1M income, 200k in Feb)")
            
        # 3. Test Report Logic
        report = get_budget_report(db, user_id=user.id, month=month, year=year)
        print("\n--- BUDGET REPORT ---")
        for r in report:
            print(f"Category: {r['category_name']}")
            print(f"Limit: {r['amount_limit']}")
            print(f"Spent: {r['total_spent']}")
            print(f"Remaining: {r['remaining']}")
            print(f"Usage: {r['percentage']}%")
            
            # Assertions
            if r['category_id'] == category.id:
                if r['amount_limit'] != 8000000: print("❌ Failed Limit")
                if r['total_spent'] != 2000000: print(f"❌ Failed Spent (Expected 2000000, got {r['total_spent']})")
                if r['remaining'] != 6000000: print("❌ Failed Remaining")
                if r['percentage'] != 25.0: print("❌ Failed Percentage")

    finally:
        db.rollback()
        # Cleanup
        db.query(Transaction).filter(Transaction.date >= datetime(2026, 2, 1)).delete()
        db.query(Budget).filter(Budget.year == 2026).delete()
        db.commit()
        db.close()
        print("\n✅ Cleaned up DB")

if __name__ == "__main__":
    run_db_test()
