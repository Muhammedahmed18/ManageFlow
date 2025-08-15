"""
Authentication Utilities
=======================
JWT token management and user operations.
"""

import jwt
from datetime import datetime, timedelta
from django.conf import settings
from django.core.cache import cache
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
import logging

logger = logging.getLogger(__name__)

class TokenManager:
    """
    JWT Token management utilities
    """
    
    @staticmethod
    def generate_tokens(user):
        """
        Generate access and refresh tokens for a user
        """
        try:
            refresh = RefreshToken.for_user(user)
            
            # Add custom claims
            refresh['user_id'] = user.id
            refresh['email'] = user.email
            refresh['user_type'] = getattr(user, 'user_type', 'customer')
            refresh['business_id'] = getattr(user.business, 'id', None) if hasattr(user, 'business') else None
            
            access_token = refresh.access_token
            access_token['user_id'] = user.id
            access_token['email'] = user.email
            access_token['user_type'] = getattr(user, 'user_type', 'customer')
            access_token['business_id'] = getattr(user.business, 'id', None) if hasattr(user, 'business') else None
            
            return {
                'access': str(access_token),
                'refresh': str(refresh),
                'access_token_expires': access_token.current_time + timedelta(minutes=60),
                'refresh_token_expires': refresh.current_time + timedelta(days=7)
            }
        except Exception as e:
            logger.error(f"Error generating tokens for user {user.id}: {str(e)}")
            raise
    
    @staticmethod
    def refresh_access_token(refresh_token_str):
        """
        Refresh access token using refresh token
        """
        try:
            refresh = RefreshToken(refresh_token_str)
            access_token = refresh.access_token
            
            # Add custom claims
            access_token['user_id'] = refresh['user_id']
            access_token['email'] = refresh['email']
            access_token['user_type'] = refresh['user_type']
            access_token['business_id'] = refresh['business_id']
            
            return {
                'access': str(access_token),
                'access_token_expires': access_token.current_time + timedelta(minutes=60)
            }
        except TokenError as e:
            logger.error(f"Token refresh failed: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error during token refresh: {str(e)}")
            raise
    
    @staticmethod
    def blacklist_token(token_str):
        """
        Blacklist a token to prevent reuse
        """
        try:
            refresh = RefreshToken(token_str)
            refresh.blacklist()
            return True
        except Exception as e:
            logger.error(f"Error blacklisting token: {str(e)}")
            return False
    
    @staticmethod
    def is_token_blacklisted(token_str):
        """
        Check if a token is blacklisted
        """
        try:
            refresh = RefreshToken(token_str)
            return refresh.blacklisted_at is not None
        except Exception:
            return True

class UserActivityTracker:
    """
    Track user activity and sessions
    """
    
    @staticmethod
    def record_login(user, ip_address=None, user_agent=None):
        """
        Record user login activity
        """
        try:
            activity_data = {
                'user_id': user.id,
                'email': user.email,
                'login_time': datetime.now().isoformat(),
                'ip_address': ip_address,
                'user_agent': user_agent,
                'user_type': getattr(user, 'user_type', 'customer')
            }
            
            # Store in cache for quick access
            cache_key = f"user_activity:{user.id}"
            cache.set(cache_key, activity_data, timeout=3600)  # 1 hour
            
            # Log the activity
            logger.info(f"User {user.email} logged in from {ip_address}")
            
            return activity_data
        except Exception as e:
            logger.error(f"Error recording login for user {user.id}: {str(e)}")
            return None
    
    @staticmethod
    def record_logout(user):
        """
        Record user logout activity
        """
        try:
            # Remove from cache
            cache_key = f"user_activity:{user.id}"
            cache.delete(cache_key)
            
            logger.info(f"User {user.email} logged out")
            return True
        except Exception as e:
            logger.error(f"Error recording logout for user {user.id}: {str(e)}")
            return False
    
    @staticmethod
    def get_user_activity(user_id):
        """
        Get current user activity
        """
        cache_key = f"user_activity:{user_id}"
        return cache.get(cache_key)

class SecurityUtils:
    """
    Security-related utilities
    """
    
    @staticmethod
    def validate_password_strength(password):
        """
        Validate password strength
        """
        errors = []
        
        if len(password) < 8:
            errors.append("Password must be at least 8 characters long")
        
        if not any(c.isupper() for c in password):
            errors.append("Password must contain at least one uppercase letter")
        
        if not any(c.islower() for c in password):
            errors.append("Password must contain at least one lowercase letter")
        
        if not any(c.isdigit() for c in password):
            errors.append("Password must contain at least one digit")
        
        if not any(c in '!@#$%^&*(),.?":{}|<>' for c in password):
            errors.append("Password must contain at least one special character")
        
        return errors
    
    @staticmethod
    def sanitize_input(input_string):
        """
        Sanitize user input to prevent XSS
        """
        if not input_string:
            return input_string
        
        import html
        return html.escape(input_string.strip())
    
    @staticmethod
    def generate_secure_invite_code():
        """
        Generate a secure invite code
        """
        import secrets
        import string
        
        alphabet = string.ascii_uppercase + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(8))
    
    @staticmethod
    def validate_invite_code(code):
        """
        Validate invite code format
        """
        if not code:
            return False
        
        # Check if code is 8 characters and contains only uppercase letters and digits
        import re
        pattern = r'^[A-Z0-9]{8}$'
        return bool(re.match(pattern, code))

class RateLimitUtils:
    """
    Rate limiting utilities
    """
    
    @staticmethod
    def check_rate_limit(key, limit, window):
        """
        Check if rate limit is exceeded
        """
        current_count = cache.get(key, 0)
        
        if current_count >= limit:
            return False
        
        cache.set(key, current_count + 1, window)
        return True
    
    @staticmethod
    def get_remaining_attempts(key, limit):
        """
        Get remaining attempts for rate limiting
        """
        current_count = cache.get(key, 0)
        return max(0, limit - current_count)

