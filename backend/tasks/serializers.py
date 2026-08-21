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
    # DRF trims whitespace and rejects blanks itself; this only supplies
    # wording a person would recognise in place of "This field may not be blank."
    title = serializers.CharField(
        max_length=200,
        error_messages={"blank": "Title cannot be blank.", "required": "Title is required."},
    )
    assignee = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), allow_null=True, required=False
    )
    # Nested copy so the list view can render the assignee without a second request.
    assignee_detail = UserSerializer(source="assignee", read_only=True)
    created_by_detail = UserSerializer(source="created_by", read_only=True)
    # Mirrors TaskPermission so the UI can hide controls it may not use. The
    # API still enforces the rule itself — this is a hint, not the gate.
    can_edit = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()

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
            "can_edit",
            "can_delete",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def _current_user_id(self):
        request = self.context.get("request")
        return getattr(getattr(request, "user", None), "id", None)

    def get_can_edit(self, obj) -> bool:
        return self._current_user_id() in {obj.created_by_id, obj.assignee_id}

    def get_can_delete(self, obj) -> bool:
        return self._current_user_id() == obj.created_by_id

