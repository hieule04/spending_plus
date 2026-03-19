import requests
import uuid

BASE_URL = "http://127.0.0.1:8000"

def get_token():
    # Giả sử hieu1@example.com tồn tại
    response = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "hieu1@example.com", "password": "password123"})
    if response.status_code == 200:
        return response.json()["access_token"]
    print(f"Login failed: {response.text}")
    return None

def test_budgets():
    token = get_token()
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    if not token:
        print("Cannot test without token. Skipping.")
        return

    # Lấy danh mục đầu tiên
    cat_res = requests.get(f"{BASE_URL}/api/categories/", headers=headers)
    if not cat_res.status_code == 200 or not cat_res.json():
        print("No categories found to test budgets.")
        return
    cat_id = cat_res.json()[0]["id"]

    # Test POST: Tạo ngân sách
    budget_data = {
        "amount_limit": 5000000,
        "month": 3,
        "year": 2026,
        "category_id": cat_id
    }
    print("\n--- Creating Budget ---")
    post_res = requests.post(f"{BASE_URL}/api/budgets/", headers=headers, json=budget_data)
    print(f"Status: {post_res.status_code}")
    print(post_res.json())

    # Test POST Duplicate: Tạo ngân sách trùng 
    print("\n--- Creating Duplicate Budget ---")
    dup_res = requests.post(f"{BASE_URL}/api/budgets/", headers=headers, json=budget_data)
    print(f"Status: {dup_res.status_code} (Expected 400)")
    print(dup_res.json())

    # Test GET: Lấy danh sách
    print("\n--- Getting Budgets ---")
    get_res = requests.get(f"{BASE_URL}/api/budgets/", headers=headers)
    print(f"Status: {get_res.status_code}")
    print(f"Budgets count: len({len(get_res.json())})")

if __name__ == "__main__":
    test_budgets()
