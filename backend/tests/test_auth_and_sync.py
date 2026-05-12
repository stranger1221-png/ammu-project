"""Backend tests for GENVO auth + cloud sync (iteration 2)."""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    with open('/app/frontend/.env') as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL='):
                BASE_URL = line.split('=', 1)[1].strip().rstrip('/').strip('"')
                break

TIMEOUT = 30


def _unique_email(prefix="tester"):
    # Backend lowercases emails on store; keep prefix lowercase to compare cleanly
    return f"test_{prefix}_{uuid.uuid4().hex[:10]}@example.com"


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def fresh_user(api):
    email = _unique_email("primary")
    payload = {"email": email, "password": "genvo-test-pass", "name": "Tester", "icon": "🦊", "remember": False}
    r = api.post(f"{BASE_URL}/api/auth/register", json=payload, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    body = r.json()
    return {**body, "password": "genvo-test-pass", "email": email}


# ============ Register ============
class TestRegister:
    def test_register_new_user(self, api):
        email = _unique_email("new")
        r = api.post(f"{BASE_URL}/api/auth/register",
                     json={"email": email, "password": "secret123", "name": "New User", "icon": "🐱"},
                     timeout=TIMEOUT)
        assert r.status_code == 200, r.text
        body = r.json()
        assert "user" in body and "access_token" in body and "refresh_token" in body
        assert body["user"]["email"] == email
        assert body["user"]["name"] == "New User"
        assert body["user"]["icon"] == "🐱"
        assert isinstance(body["access_token"], str) and len(body["access_token"]) > 20

    def test_register_duplicate_email_409(self, api, fresh_user):
        r = api.post(f"{BASE_URL}/api/auth/register",
                     json={"email": fresh_user["email"], "password": "anything123", "name": "Dup"},
                     timeout=TIMEOUT)
        assert r.status_code == 409
        assert "already" in r.text.lower()

    def test_register_short_password_400(self, api):
        r = api.post(f"{BASE_URL}/api/auth/register",
                     json={"email": _unique_email("short"), "password": "abc", "name": "X"},
                     timeout=TIMEOUT)
        assert r.status_code == 400


# ============ Login ============
class TestLogin:
    def test_login_correct(self, api, fresh_user):
        r = api.post(f"{BASE_URL}/api/auth/login",
                     json={"email": fresh_user["email"], "password": fresh_user["password"]},
                     timeout=TIMEOUT)
        assert r.status_code == 200, r.text
        body = r.json()
        assert "access_token" in body and "refresh_token" in body
        assert body["user"]["email"] == fresh_user["email"]

    def test_login_wrong_password_401(self, api, fresh_user):
        r = api.post(f"{BASE_URL}/api/auth/login",
                     json={"email": fresh_user["email"], "password": "wrong-password!!"},
                     timeout=TIMEOUT)
        assert r.status_code == 401

    def test_brute_force_lockout_429(self, api):
        # Use fresh email to avoid colliding with previous tests
        email = _unique_email("brute")
        # First register the user
        api.post(f"{BASE_URL}/api/auth/register",
                 json={"email": email, "password": "rightpass1", "name": "Brute"},
                 timeout=TIMEOUT)
        statuses = []
        for _ in range(5):
            r = api.post(f"{BASE_URL}/api/auth/login",
                         json={"email": email, "password": "wrong-on-purpose"},
                         timeout=TIMEOUT)
            statuses.append(r.status_code)
        # 6th attempt — should be locked out
        r6 = api.post(f"{BASE_URL}/api/auth/login",
                      json={"email": email, "password": "wrong-on-purpose"},
                      timeout=TIMEOUT)
        assert r6.status_code == 429, f"expected 429, got {r6.status_code}; prior={statuses}"


# ============ Me / Refresh ============
class TestMeAndRefresh:
    def test_me_with_token(self, api, fresh_user):
        h = {"Authorization": f"Bearer {fresh_user['access_token']}"}
        r = api.get(f"{BASE_URL}/api/auth/me", headers=h, timeout=TIMEOUT)
        assert r.status_code == 200
        assert r.json()["user"]["email"] == fresh_user["email"]

    def test_me_without_token_401(self, api):
        r = api.get(f"{BASE_URL}/api/auth/me", timeout=TIMEOUT)
        assert r.status_code == 401

    def test_me_with_invalid_token_401(self, api):
        r = api.get(f"{BASE_URL}/api/auth/me",
                    headers={"Authorization": "Bearer not.a.real.jwt"}, timeout=TIMEOUT)
        assert r.status_code == 401

    def test_refresh_returns_new_access(self, api, fresh_user):
        r = api.post(f"{BASE_URL}/api/auth/refresh",
                     json={"refresh_token": fresh_user["refresh_token"]}, timeout=TIMEOUT)
        assert r.status_code == 200, r.text
        new_access = r.json().get("access_token")
        assert isinstance(new_access, str) and len(new_access) > 20
        # The new access should work for /me
        r2 = api.get(f"{BASE_URL}/api/auth/me",
                     headers={"Authorization": f"Bearer {new_access}"}, timeout=TIMEOUT)
        assert r2.status_code == 200


# ============ Forgot / Reset Password ============
class TestForgotReset:
    def test_forgot_returns_token(self, api, fresh_user):
        r = api.post(f"{BASE_URL}/api/auth/forgot-password",
                     json={"email": fresh_user["email"]}, timeout=TIMEOUT)
        assert r.status_code == 200
        body = r.json()
        assert body.get("ok") is True
        assert isinstance(body.get("reset_token"), str) and len(body["reset_token"]) > 10

    def test_reset_then_login_with_new_password(self, api):
        # create a fresh user
        email = _unique_email("reset")
        old_pass = "oldpassword1"
        new_pass = "newpassword1"
        api.post(f"{BASE_URL}/api/auth/register",
                 json={"email": email, "password": old_pass, "name": "Reset"},
                 timeout=TIMEOUT)
        rf = api.post(f"{BASE_URL}/api/auth/forgot-password", json={"email": email}, timeout=TIMEOUT)
        token = rf.json()["reset_token"]
        rr = api.post(f"{BASE_URL}/api/auth/reset-password",
                      json={"token": token, "password": new_pass}, timeout=TIMEOUT)
        assert rr.status_code == 200
        # login with old should fail
        r1 = api.post(f"{BASE_URL}/api/auth/login",
                      json={"email": email, "password": old_pass}, timeout=TIMEOUT)
        assert r1.status_code == 401
        # login with new should succeed
        r2 = api.post(f"{BASE_URL}/api/auth/login",
                      json={"email": email, "password": new_pass}, timeout=TIMEOUT)
        assert r2.status_code == 200
        # reuse token should fail
        r3 = api.post(f"{BASE_URL}/api/auth/reset-password",
                      json={"token": token, "password": "another1"}, timeout=TIMEOUT)
        assert r3.status_code == 400


# ============ Profile / Password update ============
class TestProfileUpdate:
    def test_update_profile(self, api, fresh_user):
        h = {"Authorization": f"Bearer {fresh_user['access_token']}"}
        r = api.put(f"{BASE_URL}/api/auth/profile",
                    headers=h, json={"name": "Updated Name", "icon": "🐯"}, timeout=TIMEOUT)
        assert r.status_code == 200
        u = r.json()["user"]
        assert u["name"] == "Updated Name"
        assert u["icon"] == "🐯"
        # GET /me confirms persistence
        r2 = api.get(f"{BASE_URL}/api/auth/me", headers=h, timeout=TIMEOUT)
        assert r2.json()["user"]["name"] == "Updated Name"

    def test_password_change_wrong_current_400(self, api, fresh_user):
        h = {"Authorization": f"Bearer {fresh_user['access_token']}"}
        r = api.put(f"{BASE_URL}/api/auth/password",
                    headers=h,
                    json={"current_password": "wrong-current!", "new_password": "newpass99"},
                    timeout=TIMEOUT)
        assert r.status_code == 400


# ============ Sessions ============
class TestSessions:
    def test_list_sessions(self, api, fresh_user):
        h = {"Authorization": f"Bearer {fresh_user['access_token']}"}
        r = api.get(f"{BASE_URL}/api/auth/sessions", headers=h, timeout=TIMEOUT)
        assert r.status_code == 200
        assert isinstance(r.json().get("sessions"), list)
        assert len(r.json()["sessions"]) >= 1

    def test_logout_everywhere_revokes_refresh(self, api):
        email = _unique_email("rev")
        reg = api.post(f"{BASE_URL}/api/auth/register",
                       json={"email": email, "password": "secret123", "name": "Rev"},
                       timeout=TIMEOUT).json()
        h = {"Authorization": f"Bearer {reg['access_token']}"}
        rl = api.post(f"{BASE_URL}/api/auth/logout-everywhere", headers=h, timeout=TIMEOUT)
        assert rl.status_code == 200
        # refresh token should now fail
        rr = api.post(f"{BASE_URL}/api/auth/refresh",
                      json={"refresh_token": reg["refresh_token"]}, timeout=TIMEOUT)
        assert rr.status_code == 401


# ============ Cloud Sync ============
class TestSync:
    def test_sync_requires_auth(self, api):
        assert api.get(f"{BASE_URL}/api/sync", timeout=TIMEOUT).status_code == 401
        assert api.post(f"{BASE_URL}/api/sync", json={"theme": "dark"}, timeout=TIMEOUT).status_code == 401

    def test_sync_set_then_get(self, api, fresh_user):
        h = {"Authorization": f"Bearer {fresh_user['access_token']}"}
        progress = {"xp": 150, "learned": ["abate", "obfuscate"], "bookmarks": ["abate"]}
        custom = [{"word": "frobnicate", "meaning": "to fiddle with"}]
        r = api.post(f"{BASE_URL}/api/sync", headers=h,
                     json={"progress": progress, "custom_words": custom, "theme": "dark"},
                     timeout=TIMEOUT)
        assert r.status_code == 200 and r.json().get("ok") is True
        rg = api.get(f"{BASE_URL}/api/sync", headers=h, timeout=TIMEOUT)
        assert rg.status_code == 200
        body = rg.json()
        assert body["progress"]["xp"] == 150
        assert "abate" in body["progress"]["learned"]
        assert body["theme"] == "dark"
        assert body["custom_words"][0]["word"] == "frobnicate"


# ============ AI endpoints still public ============
class TestAiPublic:
    def test_ai_lookup_no_auth(self, api):
        r = api.post(f"{BASE_URL}/api/ai/lookup", json={"query": "ephemeral"}, timeout=90)
        assert r.status_code == 200, r.text
        assert r.json().get("ok") is True
