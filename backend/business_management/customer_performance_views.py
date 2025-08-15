from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Count, Sum, Avg, Q
from datetime import datetime, timedelta
import calendar
from business.models import Business
from .models import Order, Product, Invoice, EndCustomer
from .customer_performance_service import CustomerPerformanceService


class CustomerPerformanceView(APIView):
    """
    Customer Performance Dashboard API
    Provides analytics and insights relevant to customers
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, business_id):
        try:
            # Verify business exists and user has access
            business = get_object_or_404(Business, id=business_id)
            
            # Check if user is the business owner (customer)
            if business.owner != request.user:
                return Response(
                    {'error': 'Access denied. You can only view your own business performance.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get time period from query params
            period = request.query_params.get('period', 'monthly')
            
            # Initialize performance service
            performance_service = CustomerPerformanceService(business_id)
            
            # Get performance data
            performance_data = performance_service.get_performance_data(period)
            
            return Response(performance_data)
            
        except Business.DoesNotExist:
            return Response(
                {'error': 'Business not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Error fetching performance data: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CustomerOrderAnalyticsView(APIView):
    """
    Customer Order Analytics API
    Provides detailed order analytics for customers
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, business_id):
        try:
            business = get_object_or_404(Business, id=business_id)
            
            if business.owner != request.user:
                return Response(
                    {'error': 'Access denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            performance_service = CustomerPerformanceService(business_id)
            analytics_data = performance_service.get_order_analytics()
            
            return Response(analytics_data)
            
        except Exception as e:
            return Response(
                {'error': f'Error fetching analytics: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CustomerSpendingInsightsView(APIView):
    """
    Customer Spending Insights API
    Provides spending analysis and insights
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, business_id):
        try:
            business = get_object_or_404(Business, id=business_id)
            
            if business.owner != request.user:
                return Response(
                    {'error': 'Access denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            performance_service = CustomerPerformanceService(business_id)
            spending_data = performance_service.get_spending_insights()
            
            return Response(spending_data)
            
        except Exception as e:
            return Response(
                {'error': f'Error fetching spending insights: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CustomerRevenueTrendsView(APIView):
    """
    Customer Revenue Trends API
    Provides revenue trend analysis with AI predictions
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, business_id):
        try:
            business = get_object_or_404(Business, id=business_id)
            
            if business.owner != request.user:
                return Response(
                    {'error': 'Access denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            period = request.query_params.get('period', 'monthly')
            performance_service = CustomerPerformanceService(business_id)
            trend_data = performance_service.get_revenue_trends(period)
            
            return Response(trend_data)
            
        except Exception as e:
            return Response(
                {'error': f'Error fetching revenue trends: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CustomerRevenueForecastView(APIView):
    """
    Customer Revenue Forecast API
    Provides AI-powered revenue predictions
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, business_id):
        try:
            business = get_object_or_404(Business, id=business_id)
            
            if business.owner != request.user:
                return Response(
                    {'error': 'Access denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            months = int(request.query_params.get('months', 6))
            performance_service = CustomerPerformanceService(business_id)
            forecast_data = performance_service.predict_revenue_forecast(months)
            
            return Response(forecast_data)
            
        except Exception as e:
            return Response(
                {'error': f'Error generating revenue forecast: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CustomerRevenueInsightsView(APIView):
    """
    Customer Revenue Insights API
    Provides AI-generated business insights and recommendations
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, business_id):
        try:
            business = get_object_or_404(Business, id=business_id)
            
            if business.owner != request.user:
                return Response(
                    {'error': 'Access denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            performance_service = CustomerPerformanceService(business_id)
            insights_data = performance_service.get_revenue_insights()
            
            return Response(insights_data)
            
        except Exception as e:
            return Response(
                {'error': f'Error fetching revenue insights: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GenerateRealInsightsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, business_id):
        """Generate real AI insights based on actual business data"""
        try:
            # Get business
            business = get_object_or_404(Business, id=business_id)
            
            # Create service instance
            service = CustomerPerformanceService(business_id)
            
            # Perform comprehensive analysis
            analysis = service.analyze_real_business_data()
            
            # Generate intelligent insights
            insights = service._generate_intelligent_insights(analysis)
            
            # Generate actionable recommendations
            recommendations = service._generate_actionable_recommendations(analysis, insights)
            
            # Assess risks
            risks = service._assess_real_risks(
                Order.objects.filter(business=business),
                Invoice.objects.filter(business=business)
            )
            
            # Identify opportunities
            opportunities = service._identify_real_opportunities(
                Order.objects.filter(business=business),
                Invoice.objects.filter(business=business),
                EndCustomer.objects.filter(business=business)
            )
            
            # Generate revenue forecast
            forecast = service.predict_revenue_forecast(months=6)
            
            # Compile comprehensive response
            response_data = {
                'analysis_summary': {
                    'total_orders': analysis['order_analysis']['total_orders'],
                    'total_revenue': analysis['revenue_analysis']['total_revenue'],
                    'payment_rate': analysis['payment_analysis']['payment_rate'],
                    'customer_count': analysis['customer_analysis']['total_customers'],
                    'performance_score': analysis['order_analysis']['performance_score']
                },
                'insights': insights,
                'recommendations': recommendations,
                'risk_alerts': risks,
                'opportunities': opportunities,
                'forecast': forecast,
                'generated_at': timezone.now().isoformat(),
                'analysis_period': 'last_30_days'
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Business.DoesNotExist:
            return Response({'error': 'Business not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



