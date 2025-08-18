from django.shortcuts import render, get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, serializers
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
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
import time
import logging

# Import new security utilities
from .permissions import IsManufacturer, IsCustomer, IsBusinessOwner, IsActiveUser
from .validators import EmailValidator, PasswordValidator, PhoneValidator, BusinessNameValidator
from .utils import TokenManager, UserActivityTracker, SecurityUtils, RateLimitUtils
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, UserSettingsSerializer
from .models import UserSettings

User = get_user_model()

logger = logging.getLogger(__name__)

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

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """Get or update current user profile data"""
    user = request.user
    
    if request.method == 'GET':
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'is_approved': user.is_approved,
            'location': user.location,
            'company_name': user.company_name,
            'description': user.description
        })
    
    elif request.method == 'PUT':
        data = request.data
        
        # Update allowed fields
        if 'first_name' in data:
            user.first_name = data['first_name'].strip()
        if 'last_name' in data:
            user.last_name = data['last_name'].strip()
        if 'email' in data:
            user.email = data['email'].strip()
        if 'company_name' in data:
            user.company_name = data['company_name'].strip()
        if 'location' in data:
            user.location = data['location'].strip()
        if 'description' in data:
            user.description = data['description'].strip()
        
        try:
            user.save()
            return Response({
                'message': 'Profile updated successfully',
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'is_approved': user.is_approved,
                'location': user.location,
                'company_name': user.company_name,
                'description': user.description
            })
        except Exception as e:
            return Response({
                'error': 'Failed to update profile',
                'details': str(e)
            }, status=400)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_user_location(request):
    """Update user location"""
    user = request.user
    location = request.data.get('location', '').strip()
    
    if not location:
        return Response({
            'error': 'Location is required'
        }, status=400)
    
    user.location = location
    user.save()
    
    return Response({
        'message': 'Location updated successfully',
        'location': user.location
    })

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
        try:
            # Rate limiting check
            client_ip = self.get_client_ip(request)
            rate_limit_key = f"registration_otp:{client_ip}"
            
            if not RateLimitUtils.check_rate_limit(rate_limit_key, 5, 300):  # 5 attempts per 5 minutes
                remaining_time = cache.ttl(rate_limit_key)
                return Response({
                    "error": "Too many registration attempts. Please try again later.",
                    "retry_after": remaining_time
                }, status=429)
            
            data = request.data.copy()
            
            # Enhanced validation
            try:
                # Validate email
                email = EmailValidator.validate_email(data.get('email', ''))
                
                # Validate password strength
                password_errors = SecurityUtils.validate_password_strength(data.get('password', ''))
                if password_errors:
                    return Response({
                        "error": "Password validation failed",
                        "details": password_errors
                    }, status=400)
                
                # Validate required fields
                required_fields = ['username', 'email', 'password', 'role', 'first_name', 'last_name']
                for field in required_fields:
                    if not data.get(field):
                        return Response({
                            "error": f"{field.replace('_', ' ').title()} is required."
                        }, status=400)
                
                # Sanitize inputs
                data['username'] = SecurityUtils.sanitize_input(data['username'])
                data['first_name'] = SecurityUtils.sanitize_input(data['first_name'])
                data['last_name'] = SecurityUtils.sanitize_input(data['last_name'])
                
            except Exception as validation_error:
                return Response({
                    "error": str(validation_error)
                }, status=400)
            
            # Check if email already exists
            if User.objects.filter(email=email).exists():
                return Response({
                    "error": "A user with this email already exists."
                }, status=400)
            
            # Check if username already exists
            if User.objects.filter(username=data['username']).exists():
                return Response({
                    "error": "A user with this username already exists."
                }, status=400)
            
            # Generate OTP
            otp = str(random.randint(100000, 999999))
            
            # Store registration data in cache for 15 minutes
            cache_key = f"registration_{email}"
            registration_data = {
                'username': data['username'],
                'email': email,
                'password': data['password'],
                'role': data['role'],
                'first_name': data['first_name'],
                'last_name': data['last_name'],
                'otp': otp,
                'created_at': time.time(),
                'expires_at': time.time() + 900,  # 15 minutes
                'ip_address': client_ip
            }
            
            cache.set(cache_key, registration_data, 900)  # 15 minutes timeout
            
            # Send OTP email
            try:
                send_mail(
                    subject="ManageFlow Registration OTP",
                    message=f"Your OTP for email verification is: {otp}\n\nThis OTP will expire in 15 minutes.",
                    from_email=settings.EMAIL_HOST_USER,
                    recipient_list=[email],
                    fail_silently=False,
                )
                
                logger.info(f"Registration OTP sent to {email} from IP {client_ip}")
                
                return Response({
                    "message": "OTP sent to email successfully.",
                    "email": email
                }, status=200)
                
            except Exception as e:
                # Remove cached data if email fails
                cache.delete(cache_key)
                logger.error(f"Failed to send registration OTP to {email}: {str(e)}")
                return Response({
                    "error": "Failed to send OTP email. Please try again."
                }, status=500)
                
        except Exception as e:
            logger.error(f"Unexpected error in SendRegistrationOTPView: {str(e)}")
            return Response({
                "error": "An unexpected error occurred. Please try again."
            }, status=500)
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


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
            
            # Record logout activity
            UserActivityTracker.record_logout(request.user)
            
            # Blacklist the token
            if refresh_token:
                TokenManager.blacklist_token(refresh_token)
            
            logger.info(f"User {request.user.email} logged out successfully")
            
            return Response({
                "message": "Logout successful."
            }, status=status.HTTP_205_RESET_CONTENT)
            
        except Exception as e:
            logger.error(f"Logout error: {str(e)}")
            return Response({
                "error": "Logout failed. Please try again."
            }, status=400)

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
    
    def post(self, request, *args, **kwargs):
        try:
            # Call parent method to handle authentication
            response = super().post(request, *args, **kwargs)
            
            # If login successful, enhance response
            if response.status_code == 200:
                try:
                    # Get user from request (set by authentication)
                    user = request.user
                    
                    # Update response with enhanced data
                    response.data.update({
                        'user': {
                            'id': user.id,
                            'username': user.username,
                            'email': user.email,
                            'role': user.role,
                            'first_name': user.first_name or '',
                            'last_name': user.last_name or '',
                            'is_approved': user.is_approved
                        }
                    })
                    
                    logger.info(f"User {user.email} logged in successfully")
                    
                except Exception as e:
                    logger.error(f"Error enhancing login response: {str(e)}")
                    # Don't fail the login if enhancement fails
            
            return response
            
        except serializers.ValidationError as e:
            # Preserve validation errors from serializer (including role validation)
            logger.warning(f"Login validation error: {str(e)}")
            
            # Handle different error formats
            if hasattr(e, 'detail'):
                if isinstance(e.detail, dict):
                    # Handle format like {'non_field_errors': [ErrorDetail(string='Invalid username or password.', code='invalid')]}
                    if 'non_field_errors' in e.detail and len(e.detail['non_field_errors']) > 0:
                        error_message = str(e.detail['non_field_errors'][0])
                    else:
                        error_message = str(e.detail)
                elif isinstance(e.detail, list) and len(e.detail) > 0:
                    error_message = str(e.detail[0])
                else:
                    error_message = str(e.detail)
            else:
                error_message = str(e)
                
            return Response({
                "detail": error_message
            }, status=400)
        except Exception as e:
            logger.error(f"Login error: {str(e)}")
            return Response({
                "error": "Login failed. Please check your credentials and try again."
            }, status=400)

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
            logger.info(f"Password verification successful for user {request.user.username}")
            return Response({'valid': True}, status=status.HTTP_200_OK)
        else:
            logger.warning(f"Password verification failed for user {request.user.username}")
            return Response({'valid': False, 'error': 'Incorrect password'}, status=status.HTTP_200_OK)
            
    except Exception as e:
        logger.error(f"Password verification error for user {request.user.username}: {str(e)}")
        return Response({'valid': False, 'error': 'Password verification failed'}, status=status.HTTP_200_OK)

@api_view(['DELETE', 'POST'])
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
            # Delete all user tokens first
            tokens = OutstandingToken.objects.filter(user=user)
            for token in tokens:
                BlacklistedToken.objects.filter(token=token).delete()
                token.delete()
            
            # Delete user (this will cascade to related objects)
            user.delete()
            
        return Response({'message': 'Account deleted successfully'}, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Account deletion error: {str(e)}")
        return Response({'error': 'Account deletion failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserSettingsView(APIView):
    """Handle user privacy and business settings"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get user settings"""
        try:
            # Get or create settings for the user
            settings, created = UserSettings.objects.get_or_create(user=request.user)
            serializer = UserSettingsSerializer(settings)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"detail": "Error fetching user settings"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def put(self, request):
        """Update user settings"""
        try:
            # Get or create settings for the user
            settings, created = UserSettings.objects.get_or_create(user=request.user)
            serializer = UserSettingsSerializer(settings, data=request.data, partial=True)
            
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {"detail": "Error updating user settings"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class PrivacySettingsView(APIView):
    """Handle privacy settings specifically"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get privacy settings"""
        try:
            settings, created = UserSettings.objects.get_or_create(user=request.user)
            privacy_data = {
                'profile_visibility': settings.profile_visibility,
                'business_visibility': settings.business_visibility,
                'contact_info_visibility': settings.contact_info_visibility,
                'allow_contact_requests': settings.allow_contact_requests
            }
            return Response(privacy_data)
        except Exception as e:
            return Response(
                {"detail": "Error fetching privacy settings"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def put(self, request):
        """Update privacy settings"""
        try:
            settings, created = UserSettings.objects.get_or_create(user=request.user)
            
            # Update only privacy-related fields
            privacy_fields = ['profile_visibility', 'business_visibility', 'contact_info_visibility', 'allow_contact_requests']
            update_data = {k: v for k, v in request.data.items() if k in privacy_fields}
            
            serializer = UserSettingsSerializer(settings, data=update_data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {"detail": "Error updating privacy settings"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class BusinessSettingsView(APIView):
    """Handle business settings specifically"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get business settings"""
        try:
            settings, created = UserSettings.objects.get_or_create(user=request.user)
            business_data = {
                'auto_approve_requests': settings.auto_approve_requests,
                'require_approval': settings.require_approval,
                'max_businesses': settings.max_businesses,
                'default_visibility': settings.default_visibility
            }
            return Response(business_data)
        except Exception as e:
            return Response(
                {"detail": "Error fetching business settings"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def put(self, request):
        """Update business settings"""
        try:
            settings, created = UserSettings.objects.get_or_create(user=request.user)
            
            # Update only business-related fields
            business_fields = ['auto_approve_requests', 'require_approval', 'max_businesses', 'default_visibility']
            update_data = {k: v for k, v in request.data.items() if k in business_fields}
            
            serializer = UserSettingsSerializer(settings, data=update_data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {"detail": "Error updating business settings"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
