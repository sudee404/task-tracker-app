from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from tasks.serializers import UserSerializer


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(style={"input_type": "password"})


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = authenticate(request, **serializer.validated_data)
    if user is None:
        return Response(
            {"detail": "Incorrect username or password."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    login(request, user)
    # Rotate and hand back the CSRF token bound to the new session.
    get_token(request)
    return Response(UserSerializer(user).data)


@api_view(["POST"])
@permission_classes([AllowAny])
def logout_view(request):
    logout(request)
    return Response(status=status.HTTP_204_NO_CONTENT)


@ensure_csrf_cookie
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_view(request):
    """Who am I? Used by the SPA on boot to decide whether to show /login.

    Also refreshes the CSRF cookie, so a returning user with a live session
    can mutate data without logging in again first.
    """
    return Response(UserSerializer(request.user).data)
