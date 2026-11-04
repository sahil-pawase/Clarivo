def test_register_and_login_flow(client):
    # 1. Register new user
    reg_payload = {
        "name": "Dr. Sarah Agronomist",
        "email": "sarah@seedlab.org",
        "password": "SecurePassword123!"
    }
    response = client.post("/api/auth/register", json=reg_payload)
    assert response.status_code == 201
    res_data = response.json()
    assert res_data["success"] is True
    token = res_data["data"]["access_token"]
    assert token is not None
    assert res_data["data"]["user"]["email"] == "sarah@seedlab.org"

    # 2. Duplicate registration should fail
    dup_response = client.post("/api/auth/register", json=reg_payload)
    assert dup_response.status_code == 400

    # 3. Login with correct credentials
    login_payload = {
        "email": "sarah@seedlab.org",
        "password": "SecurePassword123!"
    }
    login_res = client.post("/api/auth/login", json=login_payload)
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert login_data["success"] is True
    assert "access_token" in login_data["data"]

    # 4. Login with invalid password
    bad_login = client.post("/api/auth/login", json={"email": "sarah@seedlab.org", "password": "WrongPassword"})
    assert bad_login.status_code == 401

    # 5. Access /api/auth/me with Bearer token
    auth_headers = {"Authorization": f"Bearer {token}"}
    me_res = client.get("/api/auth/me", headers=auth_headers)
    assert me_res.status_code == 200
    assert me_res.json()["data"]["email"] == "sarah@seedlab.org"
