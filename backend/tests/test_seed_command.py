import pytest
from django.contrib.auth import get_user_model
from django.core.management import call_command

User = get_user_model()
pytestmark = pytest.mark.django_db


def test_seed_team_is_idempotent():
    call_command("seed_team")
    call_command("seed_team")
    assert User.objects.count() == 4
    assert User.objects.get(username="amara").check_password("password123")
