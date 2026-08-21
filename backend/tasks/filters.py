import django_filters as filters

from .models import Task


class TaskFilter(filters.FilterSet):
    """Query-string filters for the task list.

    `status` is exposed instead of the raw boolean because "complete" and
    "incomplete" read better in a URL than `is_complete=true`.
    """

    status = filters.ChoiceFilter(
        choices=[("complete", "Complete"), ("incomplete", "Incomplete")],
        method="filter_status",
    )
    assignee = filters.NumberFilter(field_name="assignee_id")
    unassigned = filters.BooleanFilter(field_name="assignee", lookup_expr="isnull")
    due_before = filters.DateFilter(field_name="due_date", lookup_expr="lte")

    class Meta:
        model = Task
        fields = ["status", "assignee", "priority", "unassigned", "due_before"]

    def filter_status(self, queryset, name, value):
        return queryset.filter(is_complete=(value == "complete"))
