from rest_framework import permissions


class TaskPermission(permissions.BasePermission):
    """Any signed-in team member may read and create tasks.

    Changing one is limited to the people with a stake in it — the person who
    created it or the person it is assigned to. Deleting is the creator's call
    alone, so an assignee cannot destroy work someone else is tracking.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if request.method == "DELETE":
            return obj.created_by_id == request.user.id
        return request.user.id in {obj.created_by_id, obj.assignee_id}
