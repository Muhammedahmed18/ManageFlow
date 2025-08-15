"""
Enhanced Views with Performance Optimization
===========================================
Optimized views with better query performance, caching, and error handling.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.core.cache import cache
from django.db.models import Q, Count, Sum, Avg
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_cookie

from .models import (
    Product, ProductTemplate, TemplateField, ProductCategory,
    Order, OrderStatusHistory, Invoice, NumberConfig, Business
)
from .serializers import (
    EnhancedProductSerializer, EnhancedOrderSerializer,
    BulkProductSerializer
)
from .api_responses import APIResponseBuilder, BulkOperationResponse
from .optimizers import QueryOptimizer, AnalyticsOptimizer, CacheManager
from authapp.permissions import IsCustomer, IsManufacturer, IsBusinessOwner
import logging

logger = logging.getLogger(__name__)

class EnhancedProductViewSet(viewsets.ModelViewSet):
    """
    Enhanced Product ViewSet with performance optimization
    """
    serializer_class = EnhancedProductSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Optimized queryset with selective prefetching"""
        user = self.request.user
        queryset = Product.objects.all()
        
        # Filter by user permissions
        if user.role == 'customer':
            business = user.business
            if business:
                queryset = queryset.filter(business=business)
            else:
                queryset = queryset.none()
        else:
            queryset = queryset.filter(business__manufacturer=user)
        
        # Apply filters
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        template_id = self.request.query_params.get('template')
        if template_id:
            queryset = queryset.filter(template_id=template_id)
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(custom_id__icontains=search) |
                Q(field_values__value__icontains=search)
            ).distinct()
        
        # Optimize query
        include_field_values = self.request.query_params.get('include_fields', 'true').lower() == 'true'
        include_template = self.request.query_params.get('include_template', 'true').lower() == 'true'
        
        return QueryOptimizer.optimize_product_queryset(
            queryset, include_field_values, include_template
        )
    
    def get_serializer_context(self):
        """Add business context to serializer"""
        context = super().get_serializer_context()
        user = self.request.user
        
        if user.role == 'customer':
            context['business'] = user.business
        else:
            # For manufacturers, get business from query params or first business
            business_id = self.request.query_params.get('business')
            if business_id:
                context['business'] = Business.objects.filter(
                    id=business_id, manufacturer=user
                ).first()
            else:
                context['business'] = Business.objects.filter(manufacturer=user).first()
        
        return context
    
    def list(self, request, *args, **kwargs):
        """Enhanced list with pagination and caching"""
        try:
            # Check cache for business products
            user = request.user
            cache_key = f"business_products_{user.id}_{request.query_params}"
            
            if user.role == 'customer' and user.business:
                cache_key = f"business_products_{user.business.id}_{request.query_params}"
            
            cached_data = cache.get(cache_key)
            if cached_data:
                return Response(cached_data)
            
            queryset = self.get_queryset()
            
            # Pagination
            page = int(request.query_params.get('page', 1))
            page_size = min(int(request.query_params.get('page_size', 20)), 100)
            
            response = APIResponseBuilder.paginated_response(
                queryset, page, page_size, self.get_serializer_class()
            )
            
            # Cache for 5 minutes
            cache.set(cache_key, response.data, 300)
            
            return response
            
        except Exception as e:
            logger.error(f"Error in product list: {str(e)}")
            return APIResponseBuilder.error_response(
                message="Failed to retrieve products",
                status_code=500
            )
    
    def create(self, request, *args, **kwargs):
        """Enhanced create with validation"""
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            with transaction.atomic():
                product = serializer.save()
                
                # Invalidate cache
                CacheManager.invalidate_business_cache(product.business.id)
                
                return APIResponseBuilder.success_response(
                    data=serializer.data,
                    message="Product created successfully"
                )
                
        except Exception as e:
            logger.error(f"Error creating product: {str(e)}")
            return APIResponseBuilder.error_response(
                message="Failed to create product",
                errors=serializer.errors if 'serializer' in locals() else None
            )
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """Bulk create products"""
        try:
            serializer = BulkProductSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            products_data = serializer.validated_data['products']
            created_count = 0
            failed_items = []
            
            with transaction.atomic():
                for i, product_data in enumerate(products_data):
                    try:
                        product_serializer = self.get_serializer(data=product_data)
                        product_serializer.is_valid(raise_exception=True)
                        product_serializer.save()
                        created_count += 1
                    except Exception as e:
                        failed_items.append({
                            'index': i,
                            'data': product_data,
                            'error': str(e)
                        })
                
                # Invalidate cache
                if created_count > 0:
                    user = request.user
                    if user.role == 'customer' and user.business:
                        CacheManager.invalidate_business_cache(user.business.id)
            
            return BulkOperationResponse.bulk_create_response(
                created_count, failed_items, len(products_data)
            )
            
        except Exception as e:
            logger.error(f"Error in bulk create: {str(e)}")
            return APIResponseBuilder.error_response(
                message="Failed to create products in bulk"
            )
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get product analytics"""
        try:
            user = request.user
            business_id = None
            
            if user.role == 'customer':
                business_id = user.business.id if user.business else None
            else:
                business_id = request.query_params.get('business')
            
            if not business_id:
                return APIResponseBuilder.error_response(
                    message="Business ID is required"
                )
            
            analytics = AnalyticsOptimizer.get_product_performance(business_id)
            
            return APIResponseBuilder.success_response(
                data=analytics,
                message="Product analytics retrieved successfully"
            )
            
        except Exception as e:
            logger.error(f"Error getting product analytics: {str(e)}")
            return APIResponseBuilder.error_response(
                message="Failed to retrieve product analytics"
            )

class EnhancedOrderViewSet(viewsets.ModelViewSet):
    """
    Enhanced Order ViewSet with status management
    """
    serializer_class = EnhancedOrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Optimized order queryset"""
        user = self.request.user
        queryset = Order.objects.all()
        
        # Filter by user permissions
        if user.role == 'customer':
            business = user.business
            if business:
                queryset = queryset.filter(business=business, customer=user)
            else:
                queryset = queryset.none()
        else:
            queryset = queryset.filter(business__manufacturer=user)
        
        # Apply filters
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        date_from = self.request.query_params.get('date_from')
        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        
        date_to = self.request.query_params.get('date_to')
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)
        
        return QueryOptimizer.optimize_order_queryset(queryset)
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Update order status with validation"""
        try:
            order = self.get_object()
            new_status = request.data.get('status')
            notes = request.data.get('notes', '')
            
            if not new_status:
                return APIResponseBuilder.error_response(
                    message="Status is required"
                )
            
            # Validate status transition
            serializer = self.get_serializer(order, data={'status': new_status}, partial=True)
            serializer.is_valid(raise_exception=True)
            
            with transaction.atomic():
                old_status = order.status
                order.status = new_status
                order.save()
                
                # Create status history
                OrderStatusHistory.objects.create(
                    order=order,
                    status=new_status,
                    changed_by=request.user,
                    notes=notes
                )
                
                # Invalidate cache
                CacheManager.invalidate_business_cache(order.business.id)
                
                return APIResponseBuilder.success_response(
                    data=serializer.data,
                    message=f"Order status updated from {old_status} to {new_status}"
                )
                
        except Exception as e:
            logger.error(f"Error updating order status: {str(e)}")
            return APIResponseBuilder.error_response(
                message="Failed to update order status"
            )
    
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """Get order dashboard statistics"""
        try:
            user = request.user
            business_id = None
            
            if user.role == 'customer':
                business_id = user.business.id if user.business else None
            else:
                business_id = request.query_params.get('business')
            
            if not business_id:
                return APIResponseBuilder.error_response(
                    message="Business ID is required"
                )
            
            # Get cached analytics
            analytics = AnalyticsOptimizer.get_business_analytics(business_id)
            
            return APIResponseBuilder.success_response(
                data=analytics,
                message="Dashboard statistics retrieved successfully"
            )
            
        except Exception as e:
            logger.error(f"Error getting dashboard stats: {str(e)}")
            return APIResponseBuilder.error_response(
                message="Failed to retrieve dashboard statistics"
            )

