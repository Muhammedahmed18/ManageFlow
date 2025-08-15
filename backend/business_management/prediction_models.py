from django.db import models
from django.conf import settings
from business.models import Business
from .models import Product, Order, Invoice

class PredictionRecord(models.Model):
    """
    Stores AI prediction results for businesses
    """
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='predictions')
    prediction_date = models.DateTimeField(auto_now_add=True)
    prediction_type = models.CharField(max_length=50, choices=[
        ('sales_forecast', 'Sales Forecast'),
        ('product_performance', 'Product Performance'),
        ('trend_analysis', 'Trend Analysis')
    ])
    prediction_data = models.JSONField()  # Store prediction results
    confidence_score = models.FloatField()  # Overall confidence
    data_quality_score = models.FloatField()  # Data quality assessment
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-prediction_date']

class ProductConfidence(models.Model):
    """
    Stores confidence levels for individual products
    """
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='product_confidences')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='confidence_records')
    confidence_score = models.FloatField()
    order_count = models.IntegerField()
    quantity_consistency = models.FloatField()
    time_pattern_score = models.FloatField()
    data_recency_score = models.FloatField()
    last_calculated = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['business', 'product']

