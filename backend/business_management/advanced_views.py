"""
Advanced Views
=============
Advanced API endpoints for dashboard and analytics.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.utils import timezone
from datetime import datetime, timedelta
import logging
from django.db.models import Sum

from .analytics_service import AnalyticsService
from .search_service import SearchService
from .report_generators import ReportGenerator
from .api_responses import APIResponse
from .permissions import BusinessOwnerPermission

logger = logging.getLogger(__name__)

class AdvancedDashboardViewSet(viewsets.ViewSet):
    """Advanced dashboard views for business analytics."""
    permission_classes = [IsAuthenticated, BusinessOwnerPermission]
    
    @action(detail=False, methods=['get'])
    def dashboard_data(self, request):
        """Get comprehensive dashboard data."""
        try:
            business_id = request.user.business.id
            days = int(request.query_params.get('days', 30))
            
            dashboard_data = AnalyticsService.get_business_dashboard_data(business_id, days)
            
            return APIResponse.success(
                data=dashboard_data,
                message="Dashboard data retrieved successfully"
            )
        except Exception as e:
            logger.error(f"Error getting dashboard data: {str(e)}")
            return APIResponse.error(
                message="Failed to retrieve dashboard data",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def product_performance(self, request):
        """Get product performance analytics."""
        try:
            business_id = request.user.business.id
            product_id = request.query_params.get('product_id')
            days = int(request.query_params.get('days', 30))
            
            performance_data = AnalyticsService.get_product_performance(
                business_id, product_id, days
            )
            
            return APIResponse.success(
                data=performance_data,
                message="Product performance data retrieved successfully"
            )
        except Exception as e:
            logger.error(f"Error getting product performance: {str(e)}")
            return APIResponse.error(
                message="Failed to retrieve product performance data",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def trend_analysis(self, request):
        """Get trend analysis for various metrics."""
        try:
            business_id = request.user.business.id
            metric = request.query_params.get('metric', 'orders')
            days = int(request.query_params.get('days', 90))
            
            trend_data = AnalyticsService.get_trend_analysis(business_id, metric, days)
            
            return APIResponse.success(
                data=trend_data,
                message="Trend analysis data retrieved successfully"
            )
        except Exception as e:
            logger.error(f"Error getting trend analysis: {str(e)}")
            return APIResponse.error(
                message="Failed to retrieve trend analysis data",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def quick_stats(self, request):
        """Get quick statistics for the business."""
        try:
            business_id = request.user.business.id
            days = int(request.query_params.get('days', 30))
            
            end_date = timezone.now()
            start_date = end_date - timedelta(days=days)
            
            from .models import Product, Order, Customer
            
            # Quick stats
            total_products = Product.objects.filter(business_id=business_id).count()
            active_products = Product.objects.filter(business_id=business_id, is_active=True).count()
            
            total_orders = Order.objects.filter(
                business_id=business_id,
                created_at__range=(start_date, end_date)
            ).count()
            
            completed_orders = Order.objects.filter(
                business_id=business_id,
                status='completed',
                created_at__range=(start_date, end_date)
            ).count()
            
            total_revenue = Order.objects.filter(
                business_id=business_id,
                created_at__range=(start_date, end_date)
            ).aggregate(total=Sum('total_amount'))['total'] or 0
            
            unique_customers = Order.objects.filter(
                business_id=business_id,
                created_at__range=(start_date, end_date)
            ).values('customer').distinct().count()
            
            quick_stats = {
                'total_products': total_products,
                'active_products': active_products,
                'total_orders': total_orders,
                'completed_orders': completed_orders,
                'completion_rate': (completed_orders / total_orders * 100) if total_orders > 0 else 0,
                'total_revenue': float(total_revenue),
                'unique_customers': unique_customers,
                'period_days': days
            }
            
            return APIResponse.success(
                data=quick_stats,
                message="Quick stats retrieved successfully"
            )
        except Exception as e:
            logger.error(f"Error getting quick stats: {str(e)}")
            return APIResponse.error(
                message="Failed to retrieve quick stats",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class AdvancedSearchViewSet(viewsets.ViewSet):
    """Advanced search views."""
    permission_classes = [IsAuthenticated, BusinessOwnerPermission]
    
    @action(detail=False, methods=['get'])
    def search_products(self, request):
        """Search products with advanced filters."""
        try:
            business_id = request.user.business.id
            query = request.query_params.get('q', '')
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 20))
            
            # Parse filters
            filters = {}
            for key in ['category', 'status', 'template', 'date_from', 'date_to']:
                if key in request.query_params:
                    filters[key] = request.query_params[key]
            
            search_results = SearchService.search_products(
                business_id, query, filters, page, page_size
            )
            
            return APIResponse.success(
                data=search_results,
                message="Product search completed successfully"
            )
        except Exception as e:
            logger.error(f"Error searching products: {str(e)}")
            return APIResponse.error(
                message="Failed to search products",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def search_orders(self, request):
        """Search orders with advanced filters."""
        try:
            business_id = request.user.business.id
            query = request.query_params.get('q', '')
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 20))
            
            # Parse filters
            filters = {}
            for key in ['status', 'customer', 'amount_min', 'amount_max', 'date_from', 'date_to']:
                if key in request.query_params:
                    filters[key] = request.query_params[key]
            
            search_results = SearchService.search_orders(
                business_id, query, filters, page, page_size
            )
            
            return APIResponse.success(
                data=search_results,
                message="Order search completed successfully"
            )
        except Exception as e:
            logger.error(f"Error searching orders: {str(e)}")
            return APIResponse.error(
                message="Failed to search orders",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def search_suggestions(self, request):
        """Get search suggestions."""
        try:
            business_id = request.user.business.id
            query = request.query_params.get('q', '')
            search_type = request.query_params.get('type', 'products')
            
            if len(query) < 2:
                return APIResponse.success(data=[], message="Query too short")
            
            suggestions = SearchService.get_search_suggestions(business_id, query, search_type)
            
            return APIResponse.success(
                data=suggestions,
                message="Search suggestions retrieved successfully"
            )
        except Exception as e:
            logger.error(f"Error getting search suggestions: {str(e)}")
            return APIResponse.error(
                message="Failed to get search suggestions",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def advanced_filters(self, request):
        """Get available filter options."""
        try:
            business_id = request.user.business.id
            
            filters = SearchService.get_advanced_filters(business_id)
            
            return APIResponse.success(
                data=filters,
                message="Advanced filters retrieved successfully"
            )
        except Exception as e:
            logger.error(f"Error getting advanced filters: {str(e)}")
            return APIResponse.error(
                message="Failed to get advanced filters",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ReportViewSet(viewsets.ViewSet):
    """Report generation views."""
    permission_classes = [IsAuthenticated, BusinessOwnerPermission]
    
    @action(detail=False, methods=['get'])
    def generate_products_report(self, request):
        """Generate products report."""
        try:
            business_id = request.user.business.id
            format_type = request.query_params.get('format', 'excel')
            
            if format_type not in ['excel', 'csv']:
                return APIResponse.error(
                    message="Unsupported format. Use 'excel' or 'csv'",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            report_response = ReportGenerator.generate_products_report(business_id, format_type)
            
            return report_response
        except Exception as e:
            logger.error(f"Error generating products report: {str(e)}")
            return APIResponse.error(
                message="Failed to generate products report",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def generate_orders_report(self, request):
        """Generate orders report."""
        try:
            business_id = request.user.business.id
            format_type = request.query_params.get('format', 'excel')
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            
            if format_type not in ['excel', 'csv']:
                return APIResponse.error(
                    message="Unsupported format. Use 'excel' or 'csv'",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            report_response = ReportGenerator.generate_orders_report(
                business_id, format_type, start_date, end_date
            )
            
            return report_response
        except Exception as e:
            logger.error(f"Error generating orders report: {str(e)}")
            return APIResponse.error(
                message="Failed to generate orders report",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

