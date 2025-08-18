from django.urls import path
from .views import (
    RegisterView, CustomLoginView, LogoutView, 
    VerifyOTPView, ResendRegistrationOTPView, 
    SendResetOTPView, ResetPasswordView, DeleteAccountView,
    UserSettingsView, PrivacySettingsView, BusinessSettingsView,
    user_profile, SendRegistrationOTPView, verify_password, delete_account
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomLoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('profile/', user_profile, name='profile'),
    path('send-registration-otp/', SendRegistrationOTPView.as_view(), name='send-registration-otp'),
    path('resend-registration-otp/', ResendRegistrationOTPView.as_view(), name='resend-registration-otp'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('resend-otp/', ResendRegistrationOTPView.as_view(), name='resend-otp'),
    path('send-reset-otp/', SendResetOTPView.as_view(), name='send-reset-otp'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    path('verify-password/', verify_password, name='verify-password'),
    path('delete-account/', delete_account, name='delete-account'),
    
    # User Settings endpoints
    path('settings/', UserSettingsView.as_view(), name='user-settings'),
    path('settings/privacy/', PrivacySettingsView.as_view(), name='privacy-settings'),
    path('settings/business/', BusinessSettingsView.as_view(), name='business-settings'),
]
