from django.shortcuts import render, get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from .serializers import RegisterSerializer, CustomTokenObtainPairSerializer
from .models import User
from business.models import Business
import random
from django.core.mail import send_mail
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenRefreshSerializer

# ✅ Custom Token Refresh View
class CustomTokenRefreshView(TokenRefreshView):
    """
    Custom refresh view that returns both access and refresh tokens.
    """
    serializer_class = TokenRefreshSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        data['refresh'] = request.data.get("refresh")  # Always include the refresh token
        return Response(data)

# ✅ Auth check test view
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def protected_view(request):
    user = request.user
    if user.role == 'customer' and not user.is_approved:
        return Response({"error": "Your account is pending approval from the manufacturer."}, status=403)
    return Response({"message": f"Welcome {user.username}, you are approved and authenticated!"})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def customer_dashboard_view(request):
    user = request.user
    if user.role != 'customer':
        return Response({"error": "Access denied."}, status=403)

    if user.rejected:
        return Response({"rejected": True}, status=403)

    if not user.is_approved:
        return Response({"pending": True}, status=403)

    if not user.business:
        return Response({"error": "No business linked."}, status=404)

    return Response({
        "username": user.username,
        "business_name": user.business.name,
        "invite_code": user.business.invite_code,
        "is_approved": user.is_approved,
        "rejected": user.rejected,
    })


class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            otp = str(random.randint(100000, 999999))
            user.otp = otp
            user.save()
            send_mail(
                subject="Verify your ManageFlow account",
                message=f"Your OTP for verifying your ManageFlow account is: {otp}",
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[user.email],
                fail_silently=False,
            )
            msg = "Registered successfully. Check your email for OTP."
            if user.role == "customer":
                msg += " Your account will require approval from the manufacturer."
            return Response({"message": msg}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PendingCustomersView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        if request.user.role != 'manufacturer':
            return Response({"error": "Only manufacturers can access this."}, status=status.HTTP_403_FORBIDDEN)
        businesses = Business.objects.filter(manufacturer=request.user)
        pending_customers = User.objects.filter(role='customer', is_approved=False, business__in=businesses).select_related('business')
        data = [
            {
                "id": c.id,
                "username": c.username,
                "email": c.email,
                "business_name": c.business.name if c.business else None,
                "business_id": c.business.id if c.business else None
            }
            for c in pending_customers
        ]
        return Response({"pending_customers": data}, status=status.HTTP_200_OK)

class ApproveCustomerView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, customer_id):
        if request.user.role != 'manufacturer':
            return Response({"error": "Only manufacturers can approve customers."}, status=403)

        customer = get_object_or_404(User, id=customer_id, role='customer')

        if not customer.business or customer.business.manufacturer != request.user:
            return Response({"error": "Customer not linked to your business."}, status=403)

        approved = request.data.get("approved")
        rejected = request.data.get("rejected")

        if approved is not None:
            customer.is_approved = approved
            customer.rejected = False  # clear rejection if approved

        if rejected is not None:
            customer.rejected = rejected
            customer.is_approved = False  # clear approval if rejected

        customer.save()
        return Response({"message": "Customer status updated."})


class AllCustomersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        business_id = request.query_params.get("business")
        if not business_id:
            return Response({"error": "Business ID is required"}, status=400)

        customers = User.objects.filter(role="customer", business_id=business_id).select_related("business")
        data = [
            {
                "id": c.id,
                "username": c.username,
                "email": c.email,
                "is_approved": c.is_approved,
                "rejected": c.rejected,
                "business_id": c.business.id if c.business else None,
                "business_name": c.business.name if c.business else None,
            }
            for c in customers
        ]
        return Response({"customers": data}, status=200)

class VerifyOTPView(APIView):
    def post(self, request):
        email = request.data.get("email")
        otp = request.data.get("otp")
        if not email or not otp:
            return Response({"error": "Email and OTP are required."}, status=400)
        try:
            user = User.objects.get(email=email)
            if user.email_verified:
                return Response({"message": "Email already verified."})
            if user.otp == otp:
                user.email_verified = True
                user.otp = ""
                user.save()
                return Response({"message": "Email verified successfully."})
            return Response({"error": "Invalid OTP."}, status=400)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=404)

class SendResetOTPView(APIView):
    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response({"error": "Email is required."}, status=400)
        try:
            user = User.objects.get(email=email)
            otp = str(random.randint(100000, 999999))
            user.otp = otp
            user.save()
            send_mail(
                subject="ManageFlow Password Reset OTP",
                message=f"Your OTP for resetting password is: {otp}",
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[email],
                fail_silently=False,
            )
            return Response({"message": "OTP sent to email."})
        except User.DoesNotExist:
            return Response({"error": "No user with this email."}, status=404)

class ResetPasswordView(APIView):
    def post(self, request):
        email = request.data.get("email")
        otp = request.data.get("otp")
        new_password = request.data.get("new_password")
        if not all([email, otp, new_password]):
            return Response({"error": "All fields are required."}, status=400)
        try:
            user = User.objects.get(email=email)
            if user.otp != otp:
                return Response({"error": "Invalid OTP."}, status=400)
            user.set_password(new_password)
            user.otp = ""
            user.save()
            return Response({"message": "Password reset successfully."})
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=404)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Logout successful."}, status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response({"error": "Invalid or already blacklisted token."}, status=400)

class DeleteAccountView(APIView):
    permission_classes = [IsAuthenticated]
    
    def delete(self, request):
        user = request.user
        try:
            tokens = OutstandingToken.objects.filter(user=user)
            for token in tokens:
                BlacklistedToken.objects.filter(token=token).delete()
                token.delete()
            user.delete()
            return Response({"message": "Account deleted successfully."})
        except Exception:
            return Response({"error": "Failed to delete account."}, status=400)

class CustomLoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
