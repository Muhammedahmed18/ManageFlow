from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from business.models import Business
from .prediction_service import AIPredictionService
from .models import PredictionRecord, ProductConfidence, Product

class PredictionDashboardView(APIView):
    """
    Main prediction dashboard API
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, business_id):
        try:
            business = get_object_or_404(Business, id=business_id)
            
            # Check if user has access to this business
            if request.user.role == 'customer':
                if business.owner != request.user:
                    return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
            else:  # manufacturer
                if business.manufacturer != request.user:
                    return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
            
            # Initialize prediction service
            prediction_service = AIPredictionService(business_id)
            
            # Get overall confidence
            overall_confidence = prediction_service.calculate_overall_confidence()
            
            # Get product performance analysis
            product_analysis = prediction_service.get_product_performance_analysis()
            
            # Get sales forecast
            sales_forecast = prediction_service.generate_sales_forecast()
            
            return Response({
                'overall_confidence': overall_confidence,
                'product_analysis': product_analysis,
                'sales_forecast': sales_forecast,
                'business_name': business.name,
                'total_products': len(product_analysis),
                'prediction_date': timezone.now().isoformat()
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class GeneratePredictionView(APIView):
    """
    Generate new prediction
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, business_id):
        try:
            business = get_object_or_404(Business, id=business_id)
            
            # Check permissions
            if request.user.role == 'customer':
                if business.owner != request.user:
                    return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
            else:
                if business.manufacturer != request.user:
                    return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
            
            # Initialize prediction service
            prediction_service = AIPredictionService(business_id)
            
            # Generate new prediction
            sales_forecast = prediction_service.generate_sales_forecast()
            overall_confidence = prediction_service.calculate_overall_confidence()
            
            # Save prediction record
            prediction_record = PredictionRecord.objects.create(
                business=business,
                prediction_type='sales_forecast',
                prediction_data=sales_forecast,
                confidence_score=overall_confidence,
                data_quality_score=overall_confidence  # Simplified for demo
            )
            
            return Response({
                'message': 'Prediction generated successfully',
                'prediction_id': prediction_record.id,
                'confidence': overall_confidence,
                'forecast': sales_forecast
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ProductConfidenceView(APIView):
    """
    Get confidence for specific product
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, business_id, product_id):
        try:
            business = get_object_or_404(Business, id=business_id)
            product = get_object_or_404(Product, id=product_id, business=business)
            
            # Check permissions
            if request.user.role == 'customer':
                if business.owner != request.user:
                    return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
            else:
                if business.manufacturer != request.user:
                    return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
            
            # Calculate product confidence
            prediction_service = AIPredictionService(business_id)
            confidence_data = prediction_service.calculate_product_confidence(product)
            
            return Response({
                'product_id': product.id,
                'product_name': product.name,
                'confidence_data': confidence_data,
                'recommendations': prediction_service._get_product_recommendations(confidence_data)
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

