"""
Custom Authentication Middleware
================================
Handles rate limiting, request logging, and security checks.
"""

import time
import json
from django.core.cache import cache
from django.http import JsonResponse
from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
import logging

logger = logging.getLogger(__name__)

class RateLimitMiddleware:
    """
    Rate limiting middleware to prevent abuse
    """
    def __init__(self, get_response):
        self.get_response = get_response
        # More lenient rate limits for development
        self.maxRequestsPerMinute = 150 if settings.DEBUG else 100
        self.resetInterval = 60  # 1 minute

    def __call__(self, request):
        # Skip rate limiting for static files and admin
        if request.path.startswith('/static/') or request.path.startswith('/admin/'):
            return self.get_response(request)

        # Get client IP
        client_ip = self.get_client_ip(request)
        
        # Rate limit key
        rate_limit_key = f"rate_limit:{client_ip}"
        
        # Get current request count
        request_count = cache.get(rate_limit_key, 0)
        
        # Check if rate limit exceeded
        if request_count >= self.maxRequestsPerMinute:
            logger.warning(f"Rate limit exceeded for IP {client_ip}: {request_count} requests")
            return JsonResponse({
                'error': 'Rate limit exceeded',
                'message': 'Too many requests. Please try again later.',
                'retry_after': self.resetInterval,
                'current_count': request_count,
                'max_requests': self.maxRequestsPerMinute
            }, status=429)
        
        # Increment request count
        cache.set(rate_limit_key, request_count + 1, self.resetInterval)
        
        # Add rate limit headers to response
        response = self.get_response(request)
        response['X-RateLimit-Limit'] = self.maxRequestsPerMinute
        response['X-RateLimit-Remaining'] = max(0, self.maxRequestsPerMinute - request_count - 1)
        response['X-RateLimit-Reset'] = int(time.time()) + self.resetInterval
        
        return response

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

class RequestLoggingMiddleware:
    """
    Log all requests for monitoring and debugging
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start_time = time.time()
        
        # Log request
        logger.info(f"Request: {request.method} {request.path} from {self.get_client_ip(request)}")
        
        response = self.get_response(request)
        
        # Calculate response time
        response_time = time.time() - start_time
        
        # Log response
        logger.info(f"Response: {response.status_code} in {response_time:.3f}s")
        
        return response

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

class SecurityHeadersMiddleware:
    """
    Add security headers to all responses
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
        
        return response

