"""
Custom Permission Classes
=========================
Role-based access control for different user types.
"""

from rest_framework import permissions
from django.contrib.auth.models import AnonymousUser

class IsManufacturer(permissions.BasePermission):
    """
    Allow access only to manufacturer users.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            hasattr(request.user, 'user_type') and
            request.user.user_type == 'manufacturer'
        )

class IsCustomer(permissions.BasePermission):
    """
    Allow access only to customer users.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            hasattr(request.user, 'user_type') and
            request.user.user_type == 'customer'
        )

class IsBusinessOwner(permissions.BasePermission):
    """
    Allow access only to business owners.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            hasattr(request.user, 'business') and
            request.user.business is not None
        )

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object to edit it.
    Assumes the model instance has an `owner` attribute.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Instance must have an attribute named `owner`.
        return obj.owner == request.user

class IsBusinessOwnerOrReadOnly(permissions.BasePermission):
    """
    Object-level permission to only allow business owners to edit objects.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for any request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Check if user is business owner
        if hasattr(obj, 'business'):
            return obj.business == request.user.business
        elif hasattr(obj, 'owner'):
            return obj.owner == request.user
        else:
            return False

class IsCustomerOrManufacturer(permissions.BasePermission):
    """
    Allow access to both customers and manufacturers.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            hasattr(request.user, 'user_type') and
            request.user.user_type in ['customer', 'manufacturer']
        )

class IsActiveUser(permissions.BasePermission):
    """
    Allow access only to active users.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_active
        )

