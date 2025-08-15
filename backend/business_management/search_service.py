"""
Advanced Search Service
======================
Full-text search functionality with advanced filters.
"""
from django.db.models import Q, Value, CharField
from django.db.models.functions import Concat, Lower
from django.core.paginator import Paginator
from django.utils import timezone
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class SearchService:
    """Advanced search service for business data."""
    
    @staticmethod
    def search_products(business_id, query=None, filters=None, page=1, page_size=20):
        """Search products with advanced filters."""
        from .models import Product
        
        queryset = Product.objects.filter(business_id=business_id)
        
        # Apply search query
        if query:
            queryset = SearchService._apply_product_search(queryset, query)
        
        # Apply filters
        if filters:
            queryset = SearchService._apply_product_filters(queryset, filters)
        
        # Order by relevance or date
        if query:
            queryset = queryset.order_by('-created_at')
        else:
            queryset = queryset.order_by('-created_at')
        
        # Pagination
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)
        
        return {
            'results': list(page_obj.object_list.values(
                'id', 'name', 'custom_id', 'category__name', 
                'is_active', 'created_at', 'template__name'
            )),
            'total_count': paginator.count,
            'page': page,
            'total_pages': paginator.num_pages,
            'has_next': page_obj.has_next(),
            'has_previous': page_obj.has_previous()
        }
    
    @staticmethod
    def _apply_product_search(queryset, query):
        """Apply search query to products."""
        # Create a combined search field
        queryset = queryset.annotate(
            search_field=Concat(
                'name', Value(' '), 
                'custom_id', Value(' '),
                'category__name', Value(' '),
                'template__name',
                output_field=CharField()
            )
        )
        
        # Search in multiple fields
        search_terms = query.split()
        q_objects = Q()
        
        for term in search_terms:
            q_objects |= (
                Q(name__icontains=term) |
                Q(custom_id__icontains=term) |
                Q(category__name__icontains=term) |
                Q(template__name__icontains=term) |
                Q(search_field__icontains=term)
            )
        
        return queryset.filter(q_objects)
    
    @staticmethod
    def _apply_product_filters(queryset, filters):
        """Apply filters to products."""
        if 'category' in filters and filters['category']:
            queryset = queryset.filter(category_id=filters['category'])
        
        if 'status' in filters and filters['status']:
            if filters['status'] == 'active':
                queryset = queryset.filter(is_active=True)
            elif filters['status'] == 'inactive':
                queryset = queryset.filter(is_active=False)
        
        if 'template' in filters and filters['template']:
            queryset = queryset.filter(template_id=filters['template'])
        
        if 'date_from' in filters and filters['date_from']:
            try:
                date_from = datetime.strptime(filters['date_from'], '%Y-%m-%d')
                queryset = queryset.filter(created_at__gte=date_from)
            except ValueError:
                pass
        
        if 'date_to' in filters and filters['date_to']:
            try:
                date_to = datetime.strptime(filters['date_to'], '%Y-%m-%d')
                queryset = queryset.filter(created_at__lte=date_to)
            except ValueError:
                pass
        
        return queryset
    
    @staticmethod
    def search_orders(business_id, query=None, filters=None, page=1, page_size=20):
        """Search orders with advanced filters."""
        from .models import Order
        
        queryset = Order.objects.filter(business_id=business_id)
        
        # Apply search query
        if query:
            queryset = SearchService._apply_order_search(queryset, query)
        
        # Apply filters
        if filters:
            queryset = SearchService._apply_order_filters(queryset, filters)
        
        # Order by date
        queryset = queryset.order_by('-created_at')
        
        # Pagination
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)
        
        return {
            'results': list(page_obj.object_list.values(
                'id', 'order_number', 'customer__name', 'status',
                'total_amount', 'created_at', 'updated_at'
            )),
            'total_count': paginator.count,
            'page': page,
            'total_pages': paginator.num_pages,
            'has_next': page_obj.has_next(),
            'has_previous': page_obj.has_previous()
        }
    
    @staticmethod
    def _apply_order_search(queryset, query):
        """Apply search query to orders."""
        search_terms = query.split()
        q_objects = Q()
        
        for term in search_terms:
            q_objects |= (
                Q(order_number__icontains=term) |
                Q(customer__name__icontains=term) |
                Q(status__icontains=term)
            )
        
        return queryset.filter(q_objects)
    
    @staticmethod
    def _apply_order_filters(queryset, filters):
        """Apply filters to orders."""
        if 'status' in filters and filters['status']:
            queryset = queryset.filter(status=filters['status'])
        
        if 'customer' in filters and filters['customer']:
            queryset = queryset.filter(customer_id=filters['customer'])
        
        if 'amount_min' in filters and filters['amount_min']:
            try:
                amount_min = float(filters['amount_min'])
                queryset = queryset.filter(total_amount__gte=amount_min)
            except ValueError:
                pass
        
        if 'amount_max' in filters and filters['amount_max']:
            try:
                amount_max = float(filters['amount_max'])
                queryset = queryset.filter(total_amount__lte=amount_max)
            except ValueError:
                pass
        
        if 'date_from' in filters and filters['date_from']:
            try:
                date_from = datetime.strptime(filters['date_from'], '%Y-%m-%d')
                queryset = queryset.filter(created_at__gte=date_from)
            except ValueError:
                pass
        
        if 'date_to' in filters and filters['date_to']:
            try:
                date_to = datetime.strptime(filters['date_to'], '%Y-%m-%d')
                queryset = queryset.filter(created_at__lte=date_to)
            except ValueError:
                pass
        
        return queryset
    
    @staticmethod
    def get_search_suggestions(business_id, query, type='products'):
        """Get search suggestions based on query."""
        if type == 'products':
            return SearchService._get_product_suggestions(business_id, query)
        elif type == 'orders':
            return SearchService._get_order_suggestions(business_id, query)
        else:
            return []
    
    @staticmethod
    def _get_product_suggestions(business_id, query):
        """Get product search suggestions."""
        from .models import Product
        
        if len(query) < 2:
            return []
        
        suggestions = []
        
        # Name suggestions
        name_suggestions = Product.objects.filter(
            business_id=business_id,
            name__icontains=query
        ).values_list('name', flat=True).distinct()[:5]
        suggestions.extend(name_suggestions)
        
        # Custom ID suggestions
        custom_id_suggestions = Product.objects.filter(
            business_id=business_id,
            custom_id__icontains=query
        ).values_list('custom_id', flat=True).distinct()[:5]
        suggestions.extend(custom_id_suggestions)
        
        # Category suggestions
        category_suggestions = Product.objects.filter(
            business_id=business_id,
            category__name__icontains=query
        ).values_list('category__name', flat=True).distinct()[:5]
        suggestions.extend(category_suggestions)
        
        return list(set(suggestions))[:10]
    
    @staticmethod
    def _get_order_suggestions(business_id, query):
        """Get order search suggestions."""
        from .models import Order
        
        if len(query) < 2:
            return []
        
        suggestions = []
        
        # Order number suggestions
        order_number_suggestions = Order.objects.filter(
            business_id=business_id,
            order_number__icontains=query
        ).values_list('order_number', flat=True).distinct()[:5]
        suggestions.extend(order_number_suggestions)
        
        # Customer name suggestions
        customer_suggestions = Order.objects.filter(
            business_id=business_id,
            customer__name__icontains=query
        ).values_list('customer__name', flat=True).distinct()[:5]
        suggestions.extend(customer_suggestions)
        
        return list(set(suggestions))[:10]
    
    @staticmethod
    def get_advanced_filters(business_id):
        """Get available filter options."""
        from .models import Product, ProductCategory, Order, Customer
        
        filters = {
            'products': {
                'categories': list(ProductCategory.objects.filter(
                    business_id=business_id
                ).values('id', 'name')),
                'templates': list(Product.objects.filter(
                    business_id=business_id
                ).values('template__id', 'template__name').distinct()),
                'status_options': [
                    {'value': 'active', 'label': 'Active'},
                    {'value': 'inactive', 'label': 'Inactive'}
                ]
            },
            'orders': {
                'customers': list(Customer.objects.filter(
                    orders__business_id=business_id
                ).values('id', 'name').distinct()),
                'status_options': [
                    {'value': 'pending', 'label': 'Pending'},
                    {'value': 'processing', 'label': 'Processing'},
                    {'value': 'completed', 'label': 'Completed'},
                    {'value': 'cancelled', 'label': 'Cancelled'}
                ]
            }
        }
        
        return filters

