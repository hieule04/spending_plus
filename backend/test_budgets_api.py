import requests
from decimal import Decimal

BASE_URL = "http://127.0.0.1:8000"

def get_token():
    response = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "hieu1@example.com", "password": "password123"})
    if response.status_code == 200:
        return response.json()["access_token"]
    print(f"Login failed: {response.text}")
    return None

def test_budgets_api():
    token = get_token()
    if not token:
        return
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Select a category
    cat_res = requests.get(f"{BASE_URL}/api/categories/", headers=headers)
    categories = cat_res.json()
    if not categories:
        print("No categories found.")
        return
    
    # Try to pick an expense category
    expense_cats = [c for c in categories if c["type"] == "expense"]
    category_id = expense_cats[0]["id"] if expense_cats else categories[0]["id"]
    print(f"Using category: {category_id}")

    # 2. Test Upsert (Insert)
    data1 = {
        "amount_limit": 5000000,
        "month": 3,
        "year": 2026,
        "category_id": category_id
    }
    r1 = requests.post(f"{BASE_URL}/api/budgets/", json=data1, headers=headers)
    print("Insert response:", r1.status_code, r1.json())
    
    # 3. Test Upsert (Update)
    data2 = {
        "amount_limit": 8000000,
        "month": 3,
        "year": 2026,
        "category_id": category_id
    }
    r2 = requests.post(f"{BASE_URL}/api/budgets/", json=data2, headers=headers)
    print("Update response:", r2.status_code, r2.json())

    # 4. Create an expense transaction for this category, month 3, year 2026
    # Note: Using dynamic current date or hardcoded depending on backend date column defaults
    acc_res = requests.get(f"{BASE_URL}/api/accounts/", headers=headers)
    account_id = acc_res.json()[0]["id"]

    txn_data = {
        "amount": 1000000,
        "type": "expense",
        "date": "2026-03-15T10:00:00Z",
        "note": "Test expense for budget",
        "account_id": account_id,
        "category_id": category_id
    }
    r_txn = requests.post(f"{BASE_URL}/api/transactions/", json=txn_data, headers=headers)
    print("Transaction created:", r_txn.status_code)

    # 5. Fetch Budget Report
    r_report = requests.get(f"{BASE_URL}/api/budgets/report?month=3&year=2026", headers=headers)
    print("Budget Report (Month 3, Year 2026):")
    if r_report.status_code == 200:
        reports = r_report.json()
        for rep in reports:
            print(f"- {rep['category_name']}: spent {rep['total_spent']} / {rep['amount_limit']} ({rep['percentage']}%) -> Remaining: {rep['remaining']}")
    else:
        print("Report failed:", r_report.text)

if __name__ == "__main__":
    test_budgets_api()
