from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, MeView, UsersListView,
    ChangePasswordView, ForgotPasswordView, VerifyOTPView, ResetPasswordView
)

urlpatterns = [
    path('register/',              RegisterView.as_view(),        name='register'),
    path('login/',                 LoginView.as_view(),           name='login'),
    path('me/',                    MeView.as_view(),              name='me'),
    path('me/change-password/',    ChangePasswordView.as_view(),  name='change-password'),
    path('forgot-password/',       ForgotPasswordView.as_view(),  name='forgot-password'),
    path('verify-otp/',            VerifyOTPView.as_view(),       name='verify-otp'),
    path('reset-password/',        ResetPasswordView.as_view(),   name='reset-password'),
    path('users/',                 UsersListView.as_view(),       name='users-list'),
    path('token/refresh/',         TokenRefreshView.as_view(),    name='token-refresh'),
]