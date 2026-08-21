import pytest
from django.urls import reverse

from tasks.models import Priority, Task

pytestmark = pytest.mark.django_db


def test_anonymous_cannot_list_tasks(client_anon):
    assert client_anon.get("/api/tasks/").status_code == 403


def test_create_task_records_creator(client_auth, amara):
    response = client_auth.post(
        "/api/tasks/", {"title": "Ship the tracker", "description": "End to end"}
    )
    assert response.status_code == 201
    task = Task.objects.get(pk=response.data["id"])
    assert task.created_by == amara
    assert task.is_complete is False
    assert task.priority == Priority.MEDIUM


@pytest.mark.parametrize("payload", [{"title": "   "}, {"title": ""}, {}])
def test_title_must_be_present_and_not_blank(client_auth, payload):
    response = client_auth.post("/api/tasks/", payload)
    assert response.status_code == 400
    assert "title" in response.data


def test_blank_title_error_is_worded_for_a_person(client_auth):
    response = client_auth.post("/api/tasks/", {"title": "   "})
    assert str(response.data["title"][0]) == "Title cannot be blank."


def test_surrounding_whitespace_is_trimmed(client_auth):
    response = client_auth.post("/api/tasks/", {"title": "  Padded title  "})
    assert response.status_code == 201
    assert response.data["title"] == "Padded title"


def test_edit_task(client_auth, task):
    response = client_auth.patch(
        f"/api/tasks/{task.pk}/", {"title": "Renamed", "description": "New body"}
    )
    assert response.status_code == 200
    task.refresh_from_db()
    assert task.title == "Renamed"
    assert task.description == "New body"


def test_toggle_completion_both_ways(client_auth, task):
    assert client_auth.patch(f"/api/tasks/{task.pk}/", {"is_complete": True}).status_code == 200
    task.refresh_from_db()
    assert task.is_complete is True

    assert client_auth.patch(f"/api/tasks/{task.pk}/", {"is_complete": False}).status_code == 200
    task.refresh_from_db()
    assert task.is_complete is False


def test_assign_and_unassign(client_auth, task, ben):
    response = client_auth.patch(f"/api/tasks/{task.pk}/", {"assignee": ben.pk})
    assert response.status_code == 200
    assert response.data["assignee_detail"]["display_name"] == "Ben Whitfield"

    response = client_auth.patch(f"/api/tasks/{task.pk}/", {"assignee": None})
    assert response.status_code == 200
    assert response.data["assignee"] is None


def test_assigning_unknown_user_is_rejected(client_auth, task):
    response = client_auth.patch(f"/api/tasks/{task.pk}/", {"assignee": 9999})
    assert response.status_code == 400


def test_delete_task(client_auth, task):
    assert client_auth.delete(f"/api/tasks/{task.pk}/").status_code == 204
    assert not Task.objects.filter(pk=task.pk).exists()


def test_list_shows_assignee_without_extra_request(client_auth, task, ben):
    task.assignee = ben
    task.save()
    results = client_auth.get("/api/tasks/").data["results"]
    assert results[0]["assignee_detail"]["display_name"] == "Ben Whitfield"


def test_incomplete_tasks_sort_before_complete(client_auth, amara):
    Task.objects.create(title="Done", is_complete=True, created_by=amara)
    Task.objects.create(title="Pending", is_complete=False, created_by=amara)
    titles = [t["title"] for t in client_auth.get("/api/tasks/").data["results"]]
    assert titles.index("Pending") < titles.index("Done")
