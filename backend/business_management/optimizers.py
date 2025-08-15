"""
Database Query Optimizers
=========================
Optimized query methods and database performance utilities.
"""

from django.db import models
from django.db.models import Prefetch, Q, Count, Sum, Avg, Max, Min
from django.core.cache import cache
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class QueryOptimizer:
    """
    Database query optimization utilities
    """
    
    @staticmethod
    def optimize_product_queryset(queryset, include_field_values=True, include_template=True):
        """
        Optimize product queries with selective prefetching
        """
        if include_field_values:
            queryset = queryset.prefetch_related(
                Prefetch(
                    'field_values',
                    queryset=models.get_model('business_management', 'ProductFieldValue').objects.select_related('field')
                )
            )
        
        if include_template:
            queryset = queryset.select_related('template', 'category', 'business')
        
        return queryset
    
    @staticmethod
    def optimize_order_queryset(queryset, include_status_history=True):
        """
        Optimize order queries with status history
        """
        if include_status_history:
            queryset = queryset.prefetch_related(
                Prefetch(
                    'status_history',
                    queryset=models.get_model('business_management', 'OrderStatusHistory').objects.select_related('changed_by').order_by('-changed_at')
                )
            )
        
        queryset = queryset.select_related('customer', 'business')
        return queryset
    
    @staticmethod
    def optimize_invoice_queryset(queryset):
        """
        Optimize invoice queries
        """
        return queryset.select_related('business', 'order').prefetch_related('related_orders')
    
    @staticmethod
    def get_cached_queryset(cache_key, queryset_func, timeout=300):
        """
        Get cached queryset or create and cache it
        """
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data
        
        data = queryset_func()
        cache.set(cache_key, data, timeout)
        return data

class AnalyticsOptimizer:
    """
    Analytics query optimization
    """
    
    @staticmethod
    def get_business_analytics(business_id, date_range=None):
        """
        Get optimized business analytics
        """
        cache_key = f"business_analytics_{business_id}_{date_range}"
        
        def calculate_analytics():
            from .models import Order, Product, Invoice
            
            # Base querysets
            orders = Order.objects.filter(business_id=business_id)
            products = Product.objects.filter(business_id=business_id)
            invoices = Invoice.objects.filter(business_id=business_id)
            
            if date_range:
                orders = orders.filter(created_at__range=date_range)
                invoices = invoices.filter(created_at__range=date_range)
            
            # Calculate metrics
            analytics = {
                'total_orders': orders.count(),
                'total_products': products.count(),
                'total_invoices': invoices.count(),
                'orders_by_status': dict(orders.values('status').annotate(count=Count('id')).values_list('status', 'count')),
                'invoices_by_status': dict(invoices.values('status').annotate(count=Count('id')).values_list('status', 'count')),
                'total_revenue': invoices.filter(status='paid').aggregate(total=Sum('amount'))['total'] or 0,
                'pending_revenue': invoices.filter(status='pending').aggregate(total=Sum('amount'))['total'] or 0,
            }
            
            return analytics
        
        return QueryOptimizer.get_cached_queryset(cache_key, calculate_analytics, timeout=600)
    
    @staticmethod
    def get_product_performance(business_id, limit=10):
        """
        Get product performance metrics
        """
        cache_key = f"product_performance_{business_id}_{limit}"
        
        def calculate_performance():
            from .models import Product, Order
            
            # Get products with order counts
            products = Product.objects.filter(business_id=business_id).annotate(
                order_count=Count('orders', distinct=True),
                total_quantity=Sum('orders__data__quantity', default=0)
            ).order_by('-order_count')[:limit]
            
            return list(products.values('id', 'name', 'order_count', 'total_quantity'))
        
        return QueryOptimizer.get_cached_queryset(cache_key, calculate_performance, timeout=300)

class CacheManager:
    """
    Cache management utilities
    """
    
    @staticmethod
    def invalidate_business_cache(business_id):
        """
        Invalidate all cache entries for a business
        """
        cache_patterns = [
            f"business_analytics_{business_id}_*",
            f"product_performance_{business_id}_*",
            f"business_products_{business_id}",
            f"business_orders_{business_id}",
            f"business_invoices_{business_id}",
        ]
        
        for pattern in cache_patterns:
            # Note: Django's cache doesn't support pattern deletion
            # In production, use Redis with pattern deletion
            cache.delete(pattern)
    
    @staticmethod
    def clear_all_business_cache():
        """
        Clear all business-related cache
        """
        cache.clear()

