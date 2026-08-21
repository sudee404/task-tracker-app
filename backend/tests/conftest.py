import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from tasks.models import Task

User = get_user_model()


@pytest.fixture
def amara(db):
    return User.objects.create_user("amara", password="pw", first_name="Amara", last_name="Okafor")


@pytest.fixture
def ben(db):
    return User.objects.create_user("ben", password="pw", first_name="Ben", last_name="Whitfield")


@pytest.fixture
def client_anon():
    return APIClient()


@pytest.fixture
def client_auth(amara):
    client = APIClient()
    client.force_authenticate(amara)
    return client


@pytest.fixture
def task(amara):
    return Task.objects.create(title="Write the API", description="DRF viewset", created_by=amara)
