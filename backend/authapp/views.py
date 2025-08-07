from django.shortcuts import render, get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from .serializers import RegisterSerializer, CustomTokenObtainPairSerializer, UserSerializer
from .models import User
from business.models import Business
import random
from django.core.mail import send_mail
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from django.contrib.auth import authenticate
from django.db import transaction
from django.core.cache import cache
import json
import time

def cleanup_expired_registrations():
    """
    Clean up expired registration data from cache.
    This can be called periodically or on-demand.
    """
    # Note: Django's cache framework doesn't provide a way to iterate over keys
    # This is a limitation, but the cache will automatically expire keys
    # For production, consider using Redis with key scanning capabilities
    pass

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
    return Response({"message": f"Welcome {user.username}, you are approved and authenticated!"})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def customer_dashboard_view(request):
    user = request.user
    if user.role != 'customer':
        return Response({"error": "Access denied."}, status=403)

    # Fetch all businesses owned by this customer
    from business.models import Business
    businesses = Business.objects.filter(owner=user)
    business_list = [
        {
            "id": b.id,
            "name": b.name,
            "invite_code": b.invite_code,
            "is_approved": b.manufacturer is not None,
            "manufacturer_id": b.manufacturer.id if b.manufacturer else None,
            "manufacturer_name": b.manufacturer.get_full_name() if b.manufacturer else None,
        }
        for b in businesses
    ]
    return Response({
        "username": user.username,
        "businesses": business_list,
        "is_approved": user.is_approved,
        "rejected": user.rejected,
    })


class SendRegistrationOTPView(APIView):
    """
    Send OTP for registration without creating user.
    Stores registration data temporarily in cache.
    """
    def post(self, request):
        data = request.data.copy()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password', 'role', 'first_name', 'last_name']
        for field in required_fields:
            if not data.get(field):
                return Response({"error": f"{field.replace('_', ' ').title()} is required."}, status=400)
        
        # Check if email already exists
        if User.objects.filter(email=data['email']).exists():
            return Response({"error": "A user with this email already exists."}, status=400)
        
        # Check if username already exists
        if User.objects.filter(username=data['username']).exists():
            return Response({"error": "A user with this username already exists."}, status=400)
        
        # Generate OTP
        otp = str(random.randint(100000, 999999))
        
        # Store registration data in cache for 15 minutes
        cache_key = f"registration_{data['email']}"
        registration_data = {
            'username': data['username'],
            'email': data['email'],
            'password': data['password'],
            'role': data['role'],
            'first_name': data['first_name'],
            'last_name': data['last_name'],
            'otp': otp,
            'created_at': time.time(),
            'expires_at': time.time() + 900  # 15 minutes
        }
        
        cache.set(cache_key, registration_data, 900)  # 15 minutes timeout
        
        # Send OTP email
        try:
            send_mail(
                subject="ManageFlow Registration OTP",
                message=f"Your OTP for email verification is: {otp}\n\nThis OTP will expire in 15 minutes.",
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[data['email']],
                fail_silently=False,
            )
            return Response({
                "message": "OTP sent to email successfully.",
                "email": data['email']
            }, status=200)
        except Exception as e:
            # Remove cached data if email fails
            cache.delete(cache_key)
            return Response({"error": "Failed to send OTP email. Please try again."}, status=500)


class RegisterView(APIView):
    def post(self, request):
        data = request.data.copy()
        # If user is a customer, auto-approve them.
        if data.get('role') == 'customer':
            data['is_approved'] = True

        serializer = RegisterSerializer(data=data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
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
        
        # First check if this is a new registration (data in cache)
        cache_key = f"registration_{email}"
        registration_data = cache.get(cache_key)
        
        if registration_data:
            # This is a new registration - verify OTP and create user
            if registration_data['otp'] == otp:
                try:
                    with transaction.atomic():
                        # Create the user
                        user = User(
                            username=registration_data['username'],
                            email=registration_data['email'],
                            role=registration_data['role'],
                            first_name=registration_data['first_name'],
                            last_name=registration_data['last_name']
                        )
                        
                        if registration_data['role'] == 'manufacturer':
                            user.is_approved = True
                        else:
                            user.is_approved = False  # Customers still need approval
                        
                        user.set_password(registration_data['password'])
                        user.email_verified = True
                        user.otp = ""
                        user.save()
                        
                        # Clear cached data
                        cache.delete(cache_key)
                        
                        return Response({
                            "message": "Registration completed successfully. Email verified.",
                            "user": {
                                "username": user.username,
                                "email": user.email,
                                "role": user.role,
                                "first_name": user.first_name,
                                "last_name": user.last_name
                            }
                        }, status=201)
                except Exception as e:
                    return Response({"error": "Failed to create user account. Please try again."}, status=500)
            else:
                return Response({"error": "Invalid OTP."}, status=400)
        else:
            # Check if this is an existing user verification
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

class ResendRegistrationOTPView(APIView):
    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response({"error": "Email is required."}, status=400)
        
        # First check if there's pending registration data in cache
        cache_key = f"registration_{email}"
        registration_data = cache.get(cache_key)
        
        if registration_data:
            # Resend OTP for pending registration
            otp = str(random.randint(100000, 999999))
            registration_data['otp'] = otp
            registration_data['created_at'] = time.time()
            registration_data['expires_at'] = time.time() + 900  # 15 minutes
            
            cache.set(cache_key, registration_data, 900)
            
            try:
                send_mail(
                    subject="ManageFlow Registration OTP",
                    message=f"Your OTP for email verification is: {otp}\n\nThis OTP will expire in 15 minutes.",
                    from_email=settings.EMAIL_HOST_USER,
                    recipient_list=[email],
                    fail_silently=False,
                )
                return Response({"message": "OTP resent to email."})
            except Exception as e:
                return Response({"error": "Failed to send OTP email. Please try again."}, status=500)
        else:
            # Check if this is an existing user verification
            try:
                user = User.objects.get(email=email)
                if user.email_verified:
                    return Response({"error": "Email already verified."}, status=400)
                
                otp = str(random.randint(100000, 999999))
                user.otp = otp
                user.save()
                
                send_mail(
                    subject="ManageFlow Registration OTP",
                    message=f"Your OTP for email verification is: {otp}",
                    from_email=settings.EMAIL_HOST_USER,
                    recipient_list=[email],
                    fail_silently=False,
                )
                return Response({"message": "OTP resent to email."})
            except User.DoesNotExist:
                return Response({"error": "No registration found for this email."}, status=404)

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

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_password(request):
    """
    Verify user's password for account deletion
    """
    try:
        password = request.data.get('password')
        if not password:
            return Response({'valid': False, 'error': 'Password is required'}, status=status.HTTP_200_OK)
        
        # Verify password by attempting to authenticate
        user = authenticate(username=request.user.username, password=password)
        
        if user and user == request.user:
            return Response({'valid': True}, status=status.HTTP_200_OK)
        else:
            return Response({'valid': False, 'error': 'Incorrect password'}, status=status.HTTP_200_OK)
            
    except Exception as e:
        return Response({'valid': False, 'error': 'Password verification failed'}, status=status.HTTP_200_OK)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_account(request):
    """
    Delete user account with password verification
    """
    try:
        password = request.data.get('password')
        if not password:
            return Response({'error': 'Password is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify password again for final confirmation
        user = authenticate(username=request.user.username, password=password)
        
        if not user or user != request.user:
            return Response({'error': 'Incorrect password'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Use transaction to ensure all related data is deleted
        with transaction.atomic():
            # Delete user (this will cascade to related objects)
            user.delete()
            
        return Response({'message': 'Account deleted successfully'}, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': 'Account deletion failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
