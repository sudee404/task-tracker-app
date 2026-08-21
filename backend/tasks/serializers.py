from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Task

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """A team member, as shown in the assignment dropdown."""

    display_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "display_name"]

    def get_display_name(self, obj) -> str:
        return obj.get_full_name() or obj.username


class TaskSerializer(serializers.ModelSerializer):
    assignee = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), allow_null=True, required=False
    )
    # Nested copy so the list view can render the assignee without a second request.
    assignee_detail = UserSerializer(source="assignee", read_only=True)
    created_by_detail = UserSerializer(source="created_by", read_only=True)

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "description",
            "is_complete",
            "priority",
            "due_date",
            "assignee",
            "assignee_detail",
            "created_by_detail",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def validate_title(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Title cannot be blank.")
        return value
