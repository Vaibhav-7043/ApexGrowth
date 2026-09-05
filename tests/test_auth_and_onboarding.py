import pytest
import uuid
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.services.auth_service import SecurityService

@pytest.mark.asyncio
async def test_password_hashing_pbkdf2():
    password = "SuperSecretPassword123"
    hash_val, salt = SecurityService.hash_password(password)
    assert len(salt) == 32
    assert len(hash_val) == 64
    assert SecurityService.verify_password(password, hash_val, salt) is True
    assert SecurityService.verify_password("WrongPassword", hash_val, salt) is False

@pytest.mark.asyncio
async def test_auth_registration_and_repeated_login_flow(client: AsyncClient, seeded_db: AsyncSession):
    # 1. Register a brand new merchant
    test_email = f"aarav_{uuid.uuid4().hex[:6]}@urbanapparel.in"
    reg_payload = {
        "full_name": "Aarav Sharma",
        "email": test_email,
        "password": "mypassword123"
    }
    resp = await client.post("/api/auth/register", json=reg_payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "token" in data
    assert data["user"]["email"] == test_email
    assert data["user"]["is_onboarded"] is False
    merchant_id = data["merchant"]["id"]
    token = data["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Complete Onboarding
    await client.post("/api/onboarding/business", json={"name": "Urban Apparel India", "category": "Fashion & Apparel"}, headers=headers)
    await client.post("/api/onboarding/connect-razorpay", json={"mode": "test"}, headers=headers)
    await client.post("/api/onboarding/sync", headers=headers)
    comp_resp = await client.post("/api/onboarding/complete", headers=headers)
    assert comp_resp.status_code == 200
    assert comp_resp.json()["is_onboarded"] is True

    # 3. Test Session Persistence (/api/auth/me)
    me_resp = await client.get("/api/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["user"]["email"] == test_email
    assert me_resp.json()["user"]["is_onboarded"] is True
    assert me_resp.json()["merchant"]["id"] == merchant_id
    assert me_resp.json()["merchant"]["name"] == "Urban Apparel India"

    # 4. Re-Login with the EXACT SAME credentials
    login_resp = await client.post("/api/auth/login", json={"email": test_email, "password": "mypassword123"})
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    assert login_data["user"]["email"] == test_email
    assert login_data["user"]["is_onboarded"] is True
    assert login_data["merchant"]["id"] == merchant_id
    assert login_data["merchant"]["name"] == "Urban Apparel India"

    # 5. Verify Duplicate Email Registration is Blocked
    dup_resp = await client.post("/api/auth/register", json=reg_payload)
    assert dup_resp.status_code == 400
    assert "already exists" in dup_resp.json()["detail"].lower()

    # 6. Verify Wrong Password is Rejected with clean error
    wrong_pwd_resp = await client.post("/api/auth/login", json={"email": test_email, "password": "wrong_password"})
    assert wrong_pwd_resp.status_code == 401
    assert "incorrect" in wrong_pwd_resp.json()["detail"].lower()

@pytest.mark.asyncio
async def test_demo_and_isolation_flow(client: AsyncClient, seeded_db: AsyncSession):
    # 1. 1-Click Demo Login for Artisan Roasters Co.
    resp = await client.post("/api/auth/demo-login")
    assert resp.status_code == 200
    demo_data = resp.json()
    demo_token = demo_data["token"]
    demo_headers = {"Authorization": f"Bearer {demo_token}"}
    assert demo_data["user"]["is_onboarded"] is True
    assert "Artisan Roasters" in demo_data["merchant"]["name"]

    # Demo user sees 220 customers
    demo_cust = await client.get("/api/customers?limit=250", headers=demo_headers)
    assert demo_cust.status_code == 200
    assert len(demo_cust.json()) == 220

    # 2. Register a separate merchant
    new_email = f"pooja_{uuid.uuid4().hex[:6]}@chicboutique.in"
    new_reg = await client.post("/api/auth/register", json={"full_name": "Pooja K", "email": new_email, "password": "password123"})
    new_token = new_reg.json()["token"]
    new_headers = {"Authorization": f"Bearer {new_token}"}

    # New merchant sees ZERO customers (strict isolation)
    new_cust = await client.get("/api/customers", headers=new_headers)
    assert new_cust.status_code == 200
    assert len(new_cust.json()) == 0

    # 3. Log back in as Demo User
    demo_relogin = await client.post("/api/auth/login", json={"email": "merchant@artisanroasters.in", "password": "password123"})
    assert demo_relogin.status_code == 200
    demo_relogin_token = demo_relogin.json()["token"]
    demo_relogin_headers = {"Authorization": f"Bearer {demo_relogin_token}"}

    # Demo user still sees all 220 customers
    demo_relogin_cust = await client.get("/api/customers?limit=250", headers=demo_relogin_headers)
    assert demo_relogin_cust.status_code == 200
    assert len(demo_relogin_cust.json()) == 220
