from django.contrib import admin

from .models import Task


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ["title", "is_complete", "priority", "assignee", "due_date"]
    list_filter = ["is_complete", "priority"]
    search_fields = ["title", "description"]
