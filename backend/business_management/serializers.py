"""
Business Management Serializers
===============================

This module contains all the serializers for the business management system.
Serializers are organized by functionality: Product, Order, Template, and Configuration serializers.
"""

from rest_framework import serializers
from .models import (
    ProductTemplate,
    TemplateField,
    Product,
    ProductFieldValue,
    ProductCategory,
    TemplateUpload,
    Order,
    OrderFieldPosition,
    OrderFormTemplate,
    OrderFormField
)


# =============================================================================
# PRODUCT SERIALIZERS
# =============================================================================

class TemplateFieldSerializer(serializers.ModelSerializer):
    """
    Template Field Serializer
    -------------------------
    Handles serialization of template fields with validation for currency symbols.
    """
    class Meta:
        model = TemplateField
        fields = [
            'id', 'label', 'type', 'required', 'options',
            'currency_symbol', 'decimal_places', 'order'
        ]
        extra_kwargs = {
            'options': {'required': False},
            'currency_symbol': {'required': False},
            'decimal_places': {'required': False},
            'order': {'required': False}
        }

    def update(self, instance, validated_data):
        """Prevent currency symbol changes once set"""
        if instance.type == "currency" and "currency_symbol" in validated_data:
            if instance.currency_symbol != validated_data["currency_symbol"]:
                raise serializers.ValidationError({
                    "currency_symbol": "Currency symbol cannot be changed once set."
                })
        return super().update(instance, validated_data)


class ProductTemplateSerializer(serializers.ModelSerializer):
    """
    Product Template Serializer
    ---------------------------
    Handles complex template creation and updates with nested field management.
    """
    fields = TemplateFieldSerializer(many=True)

    class Meta:
        model = ProductTemplate
        fields = [
            'id', 'name', 'status', 'business', 'fields', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def create(self, validated_data):
        """Create template with nested fields"""
        fields_data = validated_data.pop('fields', [])
        template = ProductTemplate.objects.create(**validated_data)
        for field_data in fields_data:
            TemplateField.objects.create(template=template, **field_data)
        return template

    def update(self, instance, validated_data):
        """Update template with intelligent field matching and currency validation"""
        fields_data = validated_data.pop('fields', [])

        if not isinstance(fields_data, list):
            raise serializers.ValidationError({"fields": "Invalid format: fields must be a list"})

        # Create mappings for existing fields
        existing_fields_by_id = {field.id: field for field in instance.fields.all()}
        existing_fields_by_label_type = {
            (field.label.strip().lower(), field.type): field 
            for field in instance.fields.all()
        }
        processed_field_ids = set()

        for field_data in fields_data:
            field_id = field_data.get('id')
            matched_field = None

            # First try to match by ID if provided
            if field_id and field_id in existing_fields_by_id:
                matched_field = existing_fields_by_id[field_id]
            
            # Fallback to matching by label and type if no ID or not found by ID
            elif not field_id or field_id not in existing_fields_by_id:
                label = field_data.get('label', '').strip().lower()
                field_type = field_data.get('type')
                matched_field = existing_fields_by_label_type.get((label, field_type))

            # If we found a match, update it
            if matched_field:
                # Special handling for currency fields
                if matched_field.type == "currency":
                    new_symbol = field_data.get("currency_symbol")
                    if new_symbol and new_symbol != matched_field.currency_symbol:
                        raise serializers.ValidationError({
                            "currency_symbol": f"Currency symbol is locked as '{matched_field.currency_symbol}'."
                        })

                # Update all other attributes
                for attr, value in field_data.items():
                    if attr != 'id':  # Don't allow changing the ID
                        setattr(matched_field, attr, value)
                matched_field.save()
                processed_field_ids.add(matched_field.id)
            
            # No match found - create new field
            else:
                new_field = TemplateField.objects.create(template=instance, **field_data)
                processed_field_ids.add(new_field.id)

        # Delete fields that weren't included in the update (optional)
        fields_to_delete = instance.fields.exclude(id__in=processed_field_ids)
        if fields_to_delete.exists():
            fields_to_delete.delete()

        # Update template-level attributes
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        return instance


class ProductCategorySerializer(serializers.ModelSerializer):
    """
    Product Category Serializer
    ---------------------------
    Handles hierarchical category serialization with parent-child relationships.
    """
    children = serializers.SerializerMethodField()

    class Meta:
        model = ProductCategory
        fields = ['id', 'name', 'parent', 'business', 'children']
        extra_kwargs = {
            'parent': {'required': False, 'allow_null': True},
            'business': {'required': False, 'read_only': True}
        }

    def get_children(self, obj):
        """Recursively serialize child categories"""
        return ProductCategorySerializer(obj.children.all(), many=True).data

    def validate_parent(self, value):
        """Ensure parent category belongs to user's business"""
        if value and value.business != self.context['request'].user.businesses.first():
            raise serializers.ValidationError("Parent category must belong to your business")
        return value

    def create(self, validated_data):
        """Create category with automatic business assignment"""
        validated_data.pop('business', None)
        business = self.context['request'].user.businesses.first()
        if not business:
            raise serializers.ValidationError("User has no associated business")
        return ProductCategory.objects.create(business=business, **validated_data)

    def update(self, instance, validated_data):
        """Update category with validation for self-referencing"""
        if 'business' in validated_data:
            validated_data.pop('business')
        parent = validated_data.get('parent')
        if parent and parent.id == instance.id:
            raise serializers.ValidationError("A category cannot be its own parent")
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class ProductFieldValueSerializer(serializers.ModelSerializer):
    """
    Product Field Value Serializer
    ------------------------------
    Handles serialization of individual product field values.
    """
    field = TemplateFieldSerializer(read_only=True)
    field_id = serializers.PrimaryKeyRelatedField(
        queryset=TemplateField.objects.all(),
        source='field',
        write_only=True
    )

    class Meta:
        model = ProductFieldValue
        fields = ['id', 'field', 'field_id', 'value']
        extra_kwargs = {'value': {'required': False, 'allow_blank': True}}


class ProductSerializer(serializers.ModelSerializer):
    """
    Product Serializer
    ------------------
    Handles complex product serialization with nested field values and image handling.
    """
    field_values = ProductFieldValueSerializer(many=True, required=False)
    template = ProductTemplateSerializer(read_only=True)
    template_id = serializers.PrimaryKeyRelatedField(
        queryset=ProductTemplate.objects.all(),
        source='template',
        write_only=True
    )
    category = ProductCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=ProductCategory.objects.all(),
        source='category',
        write_only=True,
        allow_null=True,
        required=False
    )
    image = serializers.ImageField(required=False, allow_null=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'custom_id', 'template', 'template_id',
            'category', 'category_id', 'business', 'field_values',
            'image', 'image_url', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'business']

    def get_image_url(self, obj):
        """Generate full URL for product image"""
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        elif obj.image:
            return f'/media/{obj.image}'
        return None

    def validate_field_values(self, value):
        """Validate field values format"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Field values must be a list.")
        return value

    def create(self, validated_data):
        """Create product with field values and permission validation"""
        raw_field_values = self.initial_data.get('field_values', [])
        if isinstance(raw_field_values, str):
            import json
            raw_field_values = json.loads(raw_field_values)

        # Validate with nested serializer
        field_serializer = ProductFieldValueSerializer(data=raw_field_values, many=True)
        field_serializer.is_valid(raise_exception=True)
        validated_field_values = field_serializer.validated_data

        template = validated_data['template']
        user = self.context['request'].user

        if template.business.manufacturer != user:
            raise serializers.ValidationError("You don't have permission to use this template.")

        product = Product.objects.create(business=template.business, **validated_data)

        for value in validated_field_values:
            ProductFieldValue.objects.create(
                product=product,
                field=value['field'],
                value=value['value']
            )

        return product

    def update(self, instance, validated_data):
        """Update product with field values"""
        raw_field_values = self.initial_data.get('field_values', [])
        if isinstance(raw_field_values, str):
            import json
            raw_field_values = json.loads(raw_field_values)

        field_serializer = ProductFieldValueSerializer(data=raw_field_values, many=True)
        field_serializer.is_valid(raise_exception=True)
        validated_field_values = field_serializer.validated_data

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update field values
        instance.field_values.all().delete()
        for value in validated_field_values:
            ProductFieldValue.objects.create(
                product=instance,
                field=value['field'],
                value=value['value']
            )

        return instance


# =============================================================================
# TEMPLATE SERIALIZERS
# =============================================================================

class TemplateUploadSerializer(serializers.ModelSerializer):
    """
    Template Upload Serializer
    --------------------------
    Handles template file uploads with preview image generation.
    """
    preview_image_url = serializers.SerializerMethodField()

    class Meta:
        model = TemplateUpload
        fields = [
            'id',
            'file',
            'template_type',
            'uploaded_at',
            'field_mappings',
            'preview_image',
            'preview_image_url',
            'preview_dpi',
            'pdf_width_pt',
            'pdf_height_pt',
        ]
        read_only_fields = ['uploaded_at', 'preview_image', 'preview_dpi', 'pdf_width_pt', 'pdf_height_pt']

    def get_preview_image_url(self, obj):
        """Generate full URL for preview image"""
        request = self.context.get('request')
        if obj.preview_image and request:
            return request.build_absolute_uri(obj.preview_image.url)
        return None


class OrderFormFieldSerializer(serializers.ModelSerializer):
    """
    Order Form Field Serializer
    ---------------------------
    Handles order form field serialization with automatic key generation.
    """
    class Meta:
        model = OrderFormField
        fields = [
            'id',
            'template',
            'label',
            'key',
            'type',
            'required',
            'description',
            'order',
        ]
        read_only_fields = ['key']


class OrderFormTemplateSerializer(serializers.ModelSerializer):
    """
    Order Form Template Serializer
    ------------------------------
    Handles order form template serialization with nested fields.
    """
    fields = OrderFormFieldSerializer(many=True, read_only=True)

    class Meta:
        model = OrderFormTemplate
        fields = ['id', 'business', 'name', 'created_at', 'fields']

    def create(self, validated_data):
        """Create order form template"""
        return OrderFormTemplate.objects.create(**validated_data)


class OrderFieldPositionSerializer(serializers.ModelSerializer):
    """
    Order Field Position Serializer
    -------------------------------
    Handles field position coordinates for PDF templates.
    """
    class Meta:
        model = OrderFieldPosition
        fields = [
            'id',
            'order_form_template',
            'template_upload',
            'field_key',
            'x',
            'y',
            'page',
        ]


# =============================================================================
# ORDER SERIALIZERS
# =============================================================================

class OrderSerializer(serializers.ModelSerializer):
    """
    Order Serializer
    ----------------
    Handles order serialization with automatic order number generation.
    """
    class Meta:
        model = Order
        fields = ['id', 'order_number', 'template_type', 'data', 'status', 'created_at']
        read_only_fields = ['status', 'created_at']

    def create(self, validated_data):
        """Create order with automatic business assignment"""
        user = self.context['request'].user
        business = user.businesses.first()
        if not business:
            raise serializers.ValidationError("User has no associated business")
        
        validated_data['business'] = business
        validated_data['customer'] = user
        return Order.objects.create(**validated_data)