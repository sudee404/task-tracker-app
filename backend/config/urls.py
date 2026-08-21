from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from tasks.views import TaskViewSet, UserViewSet

router = DefaultRouter()
router.register("tasks", TaskViewSet, basename="task")
router.register("users", UserViewSet, basename="user")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/", include(router.urls)),
]
