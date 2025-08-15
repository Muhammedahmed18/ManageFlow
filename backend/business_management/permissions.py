"""
Custom Permissions
=================
Custom permission classes for business management.
"""
from rest_framework import permissions

class BusinessOwnerPermission(permissions.BasePermission):
    """Permission to check if user owns the business."""
    
    def has_permission(self, request, view):
        """Check if user has permission to access the view."""
        return request.user.is_authenticated and hasattr(request.user, 'business')
    
    def has_object_permission(self, request, view, obj):
        """Check if user has permission to access the object."""
        # Check if user owns the business
        if hasattr(obj, 'business'):
            return obj.business == request.user.business
        elif hasattr(obj, 'product') and hasattr(obj.product, 'business'):
            return obj.product.business == request.user.business
        elif hasattr(obj, 'order') and hasattr(obj.order, 'business'):
            return obj.order.business == request.user.business
        else:
            return False

class ProductPermission(permissions.BasePermission):
    """Permission for product-related operations."""
    
    def has_permission(self, request, view):
        """Check if user has permission to access the view."""
        return request.user.is_authenticated and hasattr(request.user, 'business')
    
    def has_object_permission(self, request, view, obj):
        """Check if user has permission to access the product."""
        return obj.business == request.user.business

class OrderPermission(permissions.BasePermission):
    """Permission for order-related operations."""
    
    def has_permission(self, request, view):
        """Check if user has permission to access the view."""
        return request.user.is_authenticated and hasattr(request.user, 'business')
    
    def has_object_permission(self, request, view, obj):
        """Check if user has permission to access the order."""
        return obj.business == request.user.business

class CustomerPermission(permissions.BasePermission):
    """Permission for customer-related operations."""
    
    def has_permission(self, request, view):
        """Check if user has permission to access the view."""
        return request.user.is_authenticated and hasattr(request.user, 'business')
    
    def has_object_permission(self, request, view, obj):
        """Check if user has permission to access the customer."""
        # For customers, check if they have orders in the user's business
        return obj.orders.filter(business=request.user.business).exists()

