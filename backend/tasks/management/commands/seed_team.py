"""Create the example team members the brief allows us to hard-code.

Idempotent: safe to re-run. Passwords come from SEED_PASSWORD (see .env.example)
and exist only so a reviewer can log in immediately.
"""

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()

TEAM = [
    ("amara", "Amara", "Okafor"),
    ("ben", "Ben", "Whitfield"),
    ("priya", "Priya", "Raman"),
    ("sofia", "Sofia", "Marchetti"),
]


class Command(BaseCommand):
    help = "Seed the example team members used for assignment and login."

    def handle(self, *args, **options):
        password = settings.SEED_PASSWORD
        for username, first, last in TEAM:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={"first_name": first, "last_name": last},
            )
            user.set_password(password)
            user.first_name, user.last_name = first, last
            user.save()
            verb = "Created" if created else "Updated"
            self.stdout.write(f"{verb} {username} ({first} {last})")
        self.stdout.write(
            self.style.SUCCESS(f"\n{len(TEAM)} team members ready. Password: {password}")
        )
