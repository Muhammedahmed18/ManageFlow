from rest_framework import serializers
from .models import PredictionRecord, ProductConfidence
from .models import Product, Order

class PredictionRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = PredictionRecord
        fields = '__all__'

class ProductConfidenceSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = ProductConfidence
        fields = '__all__'

class ProductAnalysisSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    product_name = serializers.CharField()
    confidence = serializers.FloatField()
    order_count = serializers.IntegerField()
    quantity_consistency = serializers.FloatField()
    time_pattern_score = serializers.FloatField()
    data_recency_score = serializers.FloatField()
    recommendations = serializers.ListField(child=serializers.CharField())

class SalesForecastSerializer(serializers.Serializer):
    forecast = serializers.ListField()
    confidence = serializers.FloatField()
    historical_data = serializers.DictField()
    message = serializers.CharField(required=False)

