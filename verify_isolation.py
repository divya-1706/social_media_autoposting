import requests
import os
import sys

# Add backend to path to import models if needed, but let's test via API
API = "http://localhost:8000"

import time

def test_isolation():
    print("Testing connection isolation between users...")
    ts = int(time.time())
    
    # 1. Create User A
    print("Creating User A...")
    user_a_data = {"email": f"userA_{ts}@example.com", "password": "password123"}
    res_a = requests.post(f"{API}/auth/signup", json=user_a_data)
    if res_a.status_code != 200:
        print(f"Failed to create User A: {res_a.text}")
        return
    token_a = res_a.json()["access_token"]
    
    # 2. Check LinkedIn Status for A (should be False)
    headers_a = {"Authorization": f"Bearer {token_a}"}
    res_status_a = requests.get(f"{API}/linkedin/status", headers=headers_a)
    print(f"User A LinkedIn status: {res_status_a.json().get('connected')}")
    
    # 3. Create User B
    print("Creating User B...")
    user_b_data = {"email": f"userB_{ts}@example.com", "password": "password123"}
    res_b = requests.post(f"{API}/auth/signup", json=user_b_data)
    token_b = res_b.json()["access_token"]
    
    # 4. Check LinkedIn Status for B (should be False)
    headers_b = {"Authorization": f"Bearer {token_b}"}
    res_status_b = requests.get(f"{API}/linkedin/status", headers=headers_b)
    print(f"User B LinkedIn status: {res_status_b.json().get('connected')}")
    
    assert res_status_a.json().get('connected') == False, "User A should not be connected by default"
    assert res_status_b.json().get('connected') == False, "User B should not be connected by default"
    print("Verification complete (Status checks passed as False for new users).")


if __name__ == "__main__":
    test_isolation()
