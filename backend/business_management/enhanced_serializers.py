"""
Enhanced Serializers with Advanced Validation
============================================
Improved serializers with better validation, error handling, and performance.
"""

from rest_framework import serializers
from django.db import transaction
from django.core.exceptions import ValidationError
from .models import (
    Product, ProductTemplate, TemplateField, ProductFieldValue,
    Order, OrderStatusHistory, Invoice, ProductCategory
)
from authapp.validators import SerializerValidatorMixin
from .optimizers import QueryOptimizer

class EnhancedProductSerializer(serializers.ModelSerializer, SerializerValidatorMixin):
    """
    Enhanced Product Serializer with advanced validation
    """
    field_values = serializers.ListField(write_only=True, required=False)
    template_fields = serializers.SerializerMethodField(read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    business_name = serializers.CharField(source='business.name', read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'custom_id', 'template', 'category', 'category_name',
            'business', 'business_name', 'field_values', 'template_fields',
            'image', 'image_url', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'business']
    
    def get_template_fields(self, obj):
        """Get template fields with optimized query"""
        if not obj.template:
            return []
        
        fields = obj.template.fields.all().order_by('order')
        return [
            {
                'id': field.id,
                'label': field.label,
                'type': field.type,
                'required': field.required,
                'value': obj.field_values.filter(field=field).first().value if obj.field_values.filter(field=field).exists() else None
            }
            for field in fields
        ]
    
    def validate_name(self, value):
        """Validate product name"""
        return self.validate_product_name(value)
    
    def validate_custom_id(self, value):
        """Validate custom ID uniqueness"""
        if value:
            business = self.context.get('business')
            if Product.objects.filter(custom_id=value, business=business).exclude(id=self.instance.id if self.instance else None).exists():
                raise serializers.ValidationError("A product with this custom ID already exists.")
        return value
    
    def validate_field_values(self, value):
        """Validate field values against template"""
        if not value:
            return value
        
        template_id = self.initial_data.get('template')
        if not template_id:
            raise serializers.ValidationError("Template is required when providing field values.")
        
        try:
            template = ProductTemplate.objects.get(id=template_id)
        except ProductTemplate.DoesNotExist:
            raise serializers.ValidationError("Invalid template.")
        
        # Validate required fields
        required_fields = template.fields.filter(required=True)
        provided_field_ids = [fv.get('field_id') for fv in value if fv.get('field_id')]
        
        for field in required_fields:
            if field.id not in provided_field_ids:
                raise serializers.ValidationError(f"Required field '{field.label}' is missing.")
        
        return value
    
    @transaction.atomic
    def create(self, validated_data):
        """Create product with field values"""
        field_values_data = validated_data.pop('field_values', [])
        
        # Set business from context
        validated_data['business'] = self.context.get('business')
        
        product = Product.objects.create(**validated_data)
        
        # Create field values
        for field_value_data in field_values_data:
            ProductFieldValue.objects.create(
                product=product,
                field_id=field_value_data['field_id'],
                value=field_value_data.get('value', '')
            )
        
        return product
    
    @transaction.atomic
    def update(self, instance, validated_data):
        """Update product with field values"""
        field_values_data = validated_data.pop('field_values', [])
        
        # Update product fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update field values
        if field_values_data:
            # Delete existing field values
            instance.field_values.all().delete()
            
            # Create new field values
            for field_value_data in field_values_data:
                ProductFieldValue.objects.create(
                    product=instance,
                    field_id=field_value_data['field_id'],
                    value=field_value_data.get('value', '')
                )
        
        return instance

class EnhancedOrderSerializer(serializers.ModelSerializer):
    """
    Enhanced Order Serializer with status validation
    """
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    business_name = serializers.CharField(source='business.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    can_update_status = serializers.SerializerMethodField()
    next_available_statuses = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'template_type', 'data', 'status', 'status_display',
            'order_type', 'customer', 'customer_name', 'business', 'business_name',
            'created_at', 'updated_at', 'can_update_status', 'next_available_statuses'
        ]
        read_only_fields = ['id', 'order_number', 'created_at', 'updated_at']
    
    def get_can_update_status(self, obj):
        """Check if status can be updated"""
        user = self.context.get('request').user
        if user.role == 'manufacturer':
            return obj.status in ['pending', 'in_production', 'shipped']
        return False
    
    def get_next_available_statuses(self, obj):
        """Get next available statuses based on current status"""
        status_flow = {
            'pending': ['in_production', 'cancelled'],
            'in_production': ['shipped', 'cancelled'],
            'shipped': ['delivered'],
            'delivered': ['completed'],
            'completed': [],
            'cancelled': []
        }
        return status_flow.get(obj.status, [])
    
    def validate_status(self, value):
        """Validate status transition"""
        if self.instance:
            current_status = self.instance.status
            user = self.context.get('request').user
            
            if user.role == 'manufacturer':
                valid_transitions = {
                    'pending': ['in_production', 'cancelled'],
                    'in_production': ['shipped', 'cancelled'],
                    'shipped': ['delivered'],
                    'delivered': ['completed']
                }
                
                if current_status in valid_transitions and value not in valid_transitions[current_status]:
                    raise serializers.ValidationError(f"Invalid status transition from {current_status} to {value}")
        
        return value
    
    def validate_data(self, value):
        """Validate order data structure"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Order data must be a dictionary.")
        
        required_fields = ['customer_name', 'contact_info', 'items']
        for field in required_fields:
            if field not in value:
                raise serializers.ValidationError(f"Required field '{field}' is missing in order data.")
        
        return value

class BulkProductSerializer(serializers.Serializer):
    """
    Bulk Product Operations Serializer
    """
    products = serializers.ListField(
        child=serializers.DictField(),
        min_length=1,
        max_length=100
    )
    operation = serializers.ChoiceField(choices=['create', 'update', 'delete'])
    
    def validate_products(self, value):
        """Validate bulk product data"""
        for i, product_data in enumerate(value):
            if 'name' not in product_data:
                raise serializers.ValidationError(f"Product {i+1}: name is required")
            
            if 'template' not in product_data:
                raise serializers.ValidationError(f"Product {i+1}: template is required")
        
        return value

