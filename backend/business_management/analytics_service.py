"""
Advanced Analytics Service
==========================
Real-time data aggregation and analytics processing.
"""
from django.db import models
from django.db.models import Count, Sum, Avg, Max, Min, Q
from django.core.cache import cache
from django.utils import timezone
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class AnalyticsService:
    """Advanced analytics service for business data analysis."""
    
    @staticmethod
    def get_business_dashboard_data(business_id, days=30):
        """Get comprehensive dashboard data for a business."""
        cache_key = f"dashboard_data_{business_id}_{days}"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return cached_data
        
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        # Product analytics
        products_data = AnalyticsService._get_products_analytics(business_id, start_date, end_date)
        
        # Order analytics
        orders_data = AnalyticsService._get_orders_analytics(business_id, start_date, end_date)
        
        # Revenue analytics
        revenue_data = AnalyticsService._get_revenue_analytics(business_id, start_date, end_date)
        
        # Customer analytics
        customers_data = AnalyticsService._get_customers_analytics(business_id, start_date, end_date)
        
        dashboard_data = {
            'products': products_data,
            'orders': orders_data,
            'revenue': revenue_data,
            'customers': customers_data,
            'period': {
                'start_date': start_date,
                'end_date': end_date,
                'days': days
            }
        }
        
        # Cache for 15 minutes
        cache.set(cache_key, dashboard_data, 900)
        return dashboard_data
    
    @staticmethod
    def _get_products_analytics(business_id, start_date, end_date):
        """Get product analytics data."""
        from .models import Product, ProductCategory
        
        products = Product.objects.filter(
            business_id=business_id,
            created_at__range=(start_date, end_date)
        )
        
        total_products = products.count()
        active_products = products.filter(is_active=True).count()
        
        # Category distribution
        category_distribution = products.values('category__name').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        # Recent products
        recent_products = products.order_by('-created_at')[:5]
        
        return {
            'total_products': total_products,
            'active_products': active_products,
            'category_distribution': list(category_distribution),
            'recent_products': list(recent_products.values('id', 'name', 'custom_id', 'created_at'))
        }
    
    @staticmethod
    def _get_orders_analytics(business_id, start_date, end_date):
        """Get order analytics data."""
        from .models import Order, OrderStatusHistory
        
        orders = Order.objects.filter(
            business_id=business_id,
            created_at__range=(start_date, end_date)
        )
        
        total_orders = orders.count()
        completed_orders = orders.filter(status='completed').count()
        pending_orders = orders.filter(status='pending').count()
        
        # Status distribution
        status_distribution = orders.values('status').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Daily order trend
        daily_orders = orders.extra(
            select={'day': 'date(created_at)'}
        ).values('day').annotate(
            count=Count('id')
        ).order_by('day')
        
        return {
            'total_orders': total_orders,
            'completed_orders': completed_orders,
            'pending_orders': pending_orders,
            'completion_rate': (completed_orders / total_orders * 100) if total_orders > 0 else 0,
            'status_distribution': list(status_distribution),
            'daily_trend': list(daily_orders)
        }
    
    @staticmethod
    def _get_revenue_analytics(business_id, start_date, end_date):
        """Get revenue analytics data."""
        from .models import Order, Invoice
        
        orders = Order.objects.filter(
            business_id=business_id,
            created_at__range=(start_date, end_date)
        )
        
        invoices = Invoice.objects.filter(
            business_id=business_id,
            created_at__range=(start_date, end_date)
        )
        
        total_revenue = orders.aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        total_invoices = invoices.aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        # Monthly revenue trend
        monthly_revenue = orders.extra(
            select={'month': 'strftime("%%Y-%%m", created_at)'}
        ).values('month').annotate(
            revenue=Sum('total_amount')
        ).order_by('month')
        
        return {
            'total_revenue': float(total_revenue),
            'total_invoices': float(total_invoices),
            'monthly_trend': list(monthly_revenue)
        }
    
    @staticmethod
    def _get_customers_analytics(business_id, start_date, end_date):
        """Get customer analytics data."""
        from .models import Order
        
        # Get unique customers
        unique_customers = Order.objects.filter(
            business_id=business_id,
            created_at__range=(start_date, end_date)
        ).values('customer').distinct().count()
        
        # Top customers by order count
        top_customers = Order.objects.filter(
            business_id=business_id,
            created_at__range=(start_date, end_date)
        ).values('customer__name').annotate(
            order_count=Count('id'),
            total_spent=Sum('total_amount')
        ).order_by('-total_spent')[:10]
        
        return {
            'unique_customers': unique_customers,
            'top_customers': list(top_customers)
        }
    
    @staticmethod
    def get_product_performance(business_id, product_id=None, days=30):
        """Get detailed product performance analytics."""
        cache_key = f"product_performance_{business_id}_{product_id}_{days}"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return cached_data
        
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        from .models import Product, Order
        
        if product_id:
            products = Product.objects.filter(id=product_id, business_id=business_id)
        else:
            products = Product.objects.filter(business_id=business_id)
        
        performance_data = []
        
        for product in products:
            # Get orders for this product
            product_orders = Order.objects.filter(
                business_id=business_id,
                items__product=product,
                created_at__range=(start_date, end_date)
            )
            
            order_count = product_orders.count()
            total_revenue = product_orders.aggregate(
                total=Sum('total_amount')
            )['total'] or 0
            
            performance_data.append({
                'product_id': product.id,
                'product_name': product.name,
                'custom_id': product.custom_id,
                'order_count': order_count,
                'total_revenue': float(total_revenue),
                'avg_order_value': float(total_revenue / order_count) if order_count > 0 else 0
            })
        
        # Sort by revenue
        performance_data.sort(key=lambda x: x['total_revenue'], reverse=True)
        
        # Cache for 10 minutes
        cache.set(cache_key, performance_data, 600)
        return performance_data
    
    @staticmethod
    def get_trend_analysis(business_id, metric='orders', days=90):
        """Get trend analysis for various metrics."""
        cache_key = f"trend_analysis_{business_id}_{metric}_{days}"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return cached_data
        
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        from .models import Order, Product
        
        if metric == 'orders':
            trend_data = Order.objects.filter(
                business_id=business_id,
                created_at__range=(start_date, end_date)
            ).extra(
                select={'date': 'date(created_at)'}
            ).values('date').annotate(
                count=Count('id')
            ).order_by('date')
        
        elif metric == 'revenue':
            trend_data = Order.objects.filter(
                business_id=business_id,
                created_at__range=(start_date, end_date)
            ).extra(
                select={'date': 'date(created_at)'}
            ).values('date').annotate(
                revenue=Sum('total_amount')
            ).order_by('date')
        
        elif metric == 'products':
            trend_data = Product.objects.filter(
                business_id=business_id,
                created_at__range=(start_date, end_date)
            ).extra(
                select={'date': 'date(created_at)'}
            ).values('date').annotate(
                count=Count('id')
            ).order_by('date')
        
        else:
            return []
        
        trend_list = list(trend_data)
        
        # Cache for 15 minutes
        cache.set(cache_key, trend_list, 900)
        return trend_list

