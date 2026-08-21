import pytest

pytestmark = pytest.mark.django_db


def test_login_with_valid_credentials(client_anon, amara):
    response = client_anon.post("/api/auth/login/", {"username": "amara", "password": "pw"})
    assert response.status_code == 200
    assert response.data["display_name"] == "Amara Okafor"


def test_login_with_bad_password_is_rejected(client_anon, amara):
    response = client_anon.post("/api/auth/login/", {"username": "amara", "password": "wrong"})
    assert response.status_code == 400


def test_me_requires_authentication(client_anon):
    assert client_anon.get("/api/auth/me/").status_code == 403


def test_login_then_me_then_logout(client_anon, amara):
    client_anon.post("/api/auth/login/", {"username": "amara", "password": "pw"})
    assert client_anon.get("/api/auth/me/").data["username"] == "amara"

    assert client_anon.post("/api/auth/logout/").status_code == 204
    assert client_anon.get("/api/auth/me/").status_code == 403


def test_users_endpoint_lists_team_for_assignment(client_auth, ben):
    response = client_auth.get("/api/users/")
    assert response.status_code == 200
    assert {u["username"] for u in response.data} == {"amara", "ben"}
