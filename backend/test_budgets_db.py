import uuid
from decimal import Decimal
from app.database import SessionLocal
from app.models import User, Category, Budget
from sqlalchemy.exc import IntegrityError

def test_budgets_directly():
    db = SessionLocal()
    try:
        # Find a user and a category
        user = db.query(User).first()
        if not user:
            print("No users found.")
            return
            
        category = db.query(Category).filter(Category.user_id == user.id).first()
        if not category:
            print("No categories found for user.")
            return
            
        print(f"Testing for User: {user.email}, Category: {category.name}")
        
        # Test 1: Create a budget
        b1 = Budget(
            user_id=user.id,
            category_id=category.id,
            amount_limit=Decimal('5000000'),
            month=3,
            year=2026
        )
        db.add(b1)
        db.commit()
        db.refresh(b1)
        print(f"✅ Created Budget 1: ID={b1.id}")
        
        # Test 2: Duplicate constraint
        b2 = Budget(
            user_id=user.id,
            category_id=category.id,
            amount_limit=Decimal('6000000'),
            month=3,
            year=2026
        )
        db.add(b2)
        try:
            db.commit()
            print("❌ ERROR: Duplicate budget was allowed!")
        except IntegrityError:
            db.rollback()
            print("✅ Captured IntegrityError successfully (UniqueConstraint works!)")
            
        # Optional Cleanup
        db.delete(b1)
        db.commit()
        print("✅ Cleaned up test data.")

    finally:
        db.close()

if __name__ == "__main__":
    test_budgets_directly()
