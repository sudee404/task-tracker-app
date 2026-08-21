"""Who may change a task — see tasks/permissions.TaskPermission."""

import pytest

from tasks.models import Task

pytestmark = pytest.mark.django_db


@pytest.fixture
def priya(db):
    from django.contrib.auth import get_user_model

    return get_user_model().objects.create_user("priya", password="pw", first_name="Priya")


@pytest.fixture
def client_ben(ben):
    from rest_framework.test import APIClient

    client = APIClient()
    client.force_authenticate(ben)
    return client


@pytest.fixture
def bens_task(ben, amara):
    """Created by Ben, assigned to Amara."""
    return Task.objects.create(title="Ben's task", created_by=ben, assignee=amara)


def test_anyone_signed_in_can_read_any_task(client_auth, bens_task):
    assert client_auth.get(f"/api/tasks/{bens_task.pk}/").status_code == 200


def test_assignee_can_edit(client_auth, bens_task):
    response = client_auth.patch(f"/api/tasks/{bens_task.pk}/", {"title": "Renamed by assignee"})
    assert response.status_code == 200


def test_assignee_can_complete(client_auth, bens_task):
    assert (
        client_auth.patch(f"/api/tasks/{bens_task.pk}/", {"is_complete": True}).status_code == 200
    )


def test_creator_can_edit(client_ben, bens_task):
    assert client_ben.patch(f"/api/tasks/{bens_task.pk}/", {"title": "Renamed"}).status_code == 200


def test_bystander_cannot_edit(priya, bens_task):
    from rest_framework.test import APIClient

    client = APIClient()
    client.force_authenticate(priya)
    assert client.patch(f"/api/tasks/{bens_task.pk}/", {"title": "Nope"}).status_code == 403


def test_assignee_cannot_delete(client_auth, bens_task):
    assert client_auth.delete(f"/api/tasks/{bens_task.pk}/").status_code == 403
    assert Task.objects.filter(pk=bens_task.pk).exists()


def test_creator_can_delete(client_ben, bens_task):
    assert client_ben.delete(f"/api/tasks/{bens_task.pk}/").status_code == 204


def test_anyone_signed_in_can_create(client_ben):
    assert client_ben.post("/api/tasks/", {"title": "Fresh"}).status_code == 201


def test_serializer_reports_what_the_caller_may_do(client_auth, bens_task):
    """The assignee may edit but not delete — the flags must say so."""
    data = client_auth.get(f"/api/tasks/{bens_task.pk}/").data
    assert data["can_edit"] is True
    assert data["can_delete"] is False


def test_creator_sees_both_flags_set(client_ben, bens_task):
    data = client_ben.get(f"/api/tasks/{bens_task.pk}/").data
    assert data["can_edit"] is True
    assert data["can_delete"] is True


def test_bystander_sees_no_flags(priya, bens_task):
    from rest_framework.test import APIClient

    client = APIClient()
    client.force_authenticate(priya)
    data = client.get(f"/api/tasks/{bens_task.pk}/").data
    assert data["can_edit"] is False
    assert data["can_delete"] is False
