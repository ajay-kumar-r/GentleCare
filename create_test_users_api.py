#!/usr/bin/env python3
"""
Create test users on the live Render backend via API.
Run this script to populate test accounts for login testing.
"""
import requests
import json

API_BASE = "https://gentlecare-server.onrender.com"

def create_test_users():
    """Create test elder and caretaker accounts via the signup API."""
    
    # Test elder account
    elder_data = {
        "email": "elder@test.com",
        "password": "password123",
        "full_name": "John Elder",
        "phone": "+1234567890",
        "user_type": "elder",
        "emergency_contact": "+1234567890",
        "medical_conditions": "Diabetes, Hypertension"
    }
    
    # Test caretaker account
    caretaker_data = {
        "email": "caretaker@test.com",
        "password": "password123",
        "full_name": "Mary Caretaker",
        "phone": "+0987654321",
        "user_type": "caretaker",
        "specialization": "Geriatric Care",
        "experience_years": 5
    }
    
    print("🔗 Creating test users on Render backend...")
    print(f"   API Base: {API_BASE}\n")
    
    # Create elder
    try:
        print("📝 Creating test elder account...")
        response = requests.post(f"{API_BASE}/auth/signup", json=elder_data, timeout=10)
        if response.status_code in [200, 201]:
            print(f"   ✅ Elder account created")
            print(f"      Email: elder@test.com")
            print(f"      Password: password123\n")
        elif response.status_code == 409:
            print(f"   ℹ️  Elder account already exists\n")
        else:
            print(f"   ❌ Failed: {response.status_code}")
            print(f"      {response.text}\n")
    except Exception as e:
        print(f"   ❌ Error: {e}\n")
    
    # Create caretaker
    try:
        print("📝 Creating test caretaker account...")
        response = requests.post(f"{API_BASE}/auth/signup", json=caretaker_data, timeout=10)
        if response.status_code in [200, 201]:
            print(f"   ✅ Caretaker account created")
            print(f"      Email: caretaker@test.com")
            print(f"      Password: password123\n")
        elif response.status_code == 409:
            print(f"   ℹ️  Caretaker account already exists\n")
        else:
            print(f"   ❌ Failed: {response.status_code}")
            print(f"      {response.text}\n")
    except Exception as e:
        print(f"   ❌ Error: {e}\n")
    
    print("🎉 Done! You can now login with these credentials:")
    print("   Elder:     elder@test.com / password123")
    print("   Caretaker: caretaker@test.com / password123")

if __name__ == "__main__":
    create_test_users()
