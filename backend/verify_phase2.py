import httpx
import time

BASE_URL = "http://localhost:8000/api/v1"

def verify():
    with httpx.Client(base_url=BASE_URL) as client:
        # Login
        print("Logging in...")
        response = client.post("/auth/login", data={"username": "test@example.com", "password": "password123"})
        if response.status_code != 200:
            print(f"Login failed: {response.text}")
            return
        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create Category
        print("Creating category...")
        response = client.post("/categories/", headers=headers, json={"name": "Work", "color": "#FF0000"})
        print(f"Category response: {response.json()}")
        cat_id = response.json()["id"]

        # Create Task
        print("Creating task...")
        response = client.post("/tasks/", headers=headers, json={"title": "Finish Backend", "category_id": cat_id})
        print(f"Task response: {response.json()}")

        # Get Summary
        print("Getting summary...")
        response = client.get("/tasks/summary", headers=headers)
        print(f"Summary response: {response.json()}")

if __name__ == "__main__":
    verify()
