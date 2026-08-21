import datetime

import pytest

from tasks.models import Priority, Task

pytestmark = pytest.mark.django_db


@pytest.fixture
def spread(amara, ben):
    return {
        "urgent": Task.objects.create(
            title="Fix production outage",
            description="Database is down",
            priority=Priority.HIGH,
            assignee=amara,
            due_date=datetime.date(2026, 1, 1),
        ),
        "done": Task.objects.create(
            title="Write onboarding docs", is_complete=True, priority=Priority.LOW, assignee=ben
        ),
        "loose": Task.objects.create(title="Refactor the serializer", priority=Priority.MEDIUM),
    }


def titles(response):
    return {t["title"] for t in response.data["results"]}


def test_filter_by_status(client_auth, spread):
    assert titles(client_auth.get("/api/tasks/?status=complete")) == {"Write onboarding docs"}
    assert "Write onboarding docs" not in titles(client_auth.get("/api/tasks/?status=incomplete"))


def test_filter_by_assignee(client_auth, spread, amara):
    assert titles(client_auth.get(f"/api/tasks/?assignee={amara.pk}")) == {"Fix production outage"}


def test_filter_by_priority(client_auth, spread):
    assert titles(client_auth.get("/api/tasks/?priority=HIGH")) == {"Fix production outage"}


def test_filter_unassigned(client_auth, spread):
    assert titles(client_auth.get("/api/tasks/?unassigned=true")) == {"Refactor the serializer"}


def test_search_matches_title_and_description(client_auth, spread):
    assert titles(client_auth.get("/api/tasks/?search=outage")) == {"Fix production outage"}
    assert titles(client_auth.get("/api/tasks/?search=database")) == {"Fix production outage"}


def test_search_and_filter_combine(client_auth, spread, ben):
    response = client_auth.get(f"/api/tasks/?search=docs&assignee={ben.pk}")
    assert titles(response) == {"Write onboarding docs"}


def test_ordering_by_due_date(client_auth, spread):
    response = client_auth.get("/api/tasks/?ordering=-due_date")
    assert response.data["results"][0]["title"] == "Fix production outage"
