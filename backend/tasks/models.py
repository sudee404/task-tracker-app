from django.conf import settings
from django.db import models


class Priority(models.TextChoices):
    LOW = "LOW", "Low"
    MEDIUM = "MEDIUM", "Medium"
    HIGH = "HIGH", "High"


class Task(models.Model):
    """A unit of work owned by the team and optionally assigned to one member."""

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    is_complete = models.BooleanField(default=False)
    priority = models.CharField(
        max_length=6, choices=Priority.choices, default=Priority.MEDIUM
    )
    due_date = models.DateField(null=True, blank=True)
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="assigned_tasks",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="created_tasks",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Incomplete work first, then most recently created.
        ordering = ["is_complete", "-created_at"]

    def __str__(self) -> str:
        return self.title
