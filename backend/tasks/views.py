from django.contrib.auth import get_user_model
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .filters import TaskFilter
from .permissions import TaskPermission
from .models import Task
from .serializers import TaskSerializer, UserSerializer

User = get_user_model()


class TaskViewSet(viewsets.ModelViewSet):
    """CRUD for tasks.

    Completion is a normal PATCH of `is_complete` rather than a custom action,
    so the client has one code path for every edit.
    """

    serializer_class = TaskSerializer
    permission_classes = [TaskPermission]
    filterset_class = TaskFilter
    search_fields = ["title", "description"]
    ordering_fields = ["created_at", "due_date", "priority", "title"]

    def get_queryset(self):
        return Task.objects.select_related("assignee", "created_by")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """The team members available for assignment."""

    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    queryset = User.objects.filter(is_active=True).order_by("username")
    pagination_class = None
