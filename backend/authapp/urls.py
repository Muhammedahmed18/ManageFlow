from django.urls import path
from .views import (
    RegisterView,
    VerifyOTPView,
    protected_view,
    LogoutView,
    SendResetOTPView,
    ResetPasswordView,
    DeleteAccountView,
    PendingCustomersView,
    ApproveCustomerView,
    customer_dashboard_view,
    CustomLoginView,
    AllCustomersView,
    CustomTokenRefreshView,  # ✅ Import your new refresh view
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('login/', CustomLoginView.as_view(), name='login'),
    path('protected/', protected_view, name='protected'),
    path('refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),  # ✅ Using custom refresh
    path('send-reset-otp/', SendResetOTPView.as_view(), name='send-reset-otp'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('delete-account/', DeleteAccountView.as_view(), name='delete-account'),
    path('pending-customers/', PendingCustomersView.as_view(), name='pending-customers'),
    path('approve-customer/<int:customer_id>/', ApproveCustomerView.as_view(), name='approve-customer'),
    path('customer-dashboard/', customer_dashboard_view, name='customer-dashboard'),
    path('customers/', AllCustomersView.as_view(), name='all-customers'),
]
