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

    Order,

    Business,
    Invoice,
    InvoiceItem,
    EndCustomer,
    NumberConfig,
    OrderStatusHistory,
    Proposal,
    ProposalResponse,
    ChatRoom,
    ChatMessage,
)
from django.utils.text import slugify


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
            'currency_symbol', 'decimal_places', 'default_value', 'order'
        ]
        extra_kwargs = {
            'options': {'required': False},
            'currency_symbol': {'required': False},
            'decimal_places': {'required': False},
            'default_value': {'required': False},
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
        request = self.context.get('request')
        if not request or request.user.role != 'customer':
            raise serializers.ValidationError('Only customers can create product templates.')
        fields_data = validated_data.pop('fields', [])
        template = ProductTemplate.objects.create(**validated_data)
        for field_data in fields_data:
            TemplateField.objects.create(template=template, **field_data)
        return template

    def update(self, instance, validated_data):
        """Update template with intelligent field matching and currency validation"""
        request = self.context.get('request')
        if not request or request.user.role != 'customer':
            raise serializers.ValidationError('Only customers can update product templates.')
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
        return value

    def create(self, validated_data):
        """Create category with automatic business assignment"""
        request = self.context.get('request')
        if not request or request.user.role != 'customer':
            raise serializers.ValidationError('Only customers can create categories.')
        business = validated_data.get('business')
        if not business:
            raise serializers.ValidationError('Business must be provided.')
        validated_data.pop('business', None)
        return ProductCategory.objects.create(business=business, **validated_data)

    def update(self, instance, validated_data):
        """Update category with validation for self-referencing"""
        request = self.context.get('request')
        if not request or request.user.role != 'customer':
            raise serializers.ValidationError('Only customers can update categories.')
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
        request = self.context.get('request')
        if not request or request.user.role != 'customer':
            raise serializers.ValidationError('Only customers can create products.')
        raw_field_values = self.initial_data.get('field_values', [])
        if isinstance(raw_field_values, str):
            import json
            raw_field_values = json.loads(raw_field_values)

        # Validate with nested serializer
        field_serializer = ProductFieldValueSerializer(data=raw_field_values, many=True)
        field_serializer.is_valid(raise_exception=True)
        validated_field_values = field_serializer.validated_data

        template = validated_data['template']
        user = request.user

        # FIX: Use business from Business.objects.filter(owner=user).first()
        from business.models import Business
        business = Business.objects.filter(owner=user).first()
        if not business or template.business != business:
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
        request = self.context.get('request')
        if not request or request.user.role != 'customer':
            raise serializers.ValidationError('Only customers can update products.')
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







# =============================================================================
# ORDER SERIALIZERS
# =============================================================================

class OrderStatusHistorySerializer(serializers.ModelSerializer):
    """
    Order Status History Serializer
    -------------------------------
    Handles serialization of order status change history.
    """
    changed_by_name = serializers.CharField(source='changed_by.username', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = OrderStatusHistory
        fields = ['id', 'order', 'status', 'status_display', 'changed_by', 'changed_by_name', 'changed_at', 'notes']
        read_only_fields = ['changed_at']


class OrderSerializer(serializers.ModelSerializer):
    """
    Order Serializer
    ----------------
    Handles order serialization with automatic order number generation.
    """
    customer_name = serializers.CharField(source='customer.username', read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    customer_first_name = serializers.CharField(source='customer.first_name', read_only=True)
    business_id = serializers.IntegerField(source='business.id', read_only=True)
    business_name = serializers.CharField(source='business.name', read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    
    class Meta:
        model = Order
        fields = ['id', 'order_number', 'template_type', 'data', 'status', 'order_type', 'created_at', 'business', 'business_id', 'business_name', 'customer_name', 'customer_email', 'customer_first_name', 'status_history']
        read_only_fields = ['status', 'created_at']

    def create(self, validated_data):
        """Create order with automatic business assignment"""
        user = self.context['request'].user
        business = validated_data.get('business')
        if not business:
            raise serializers.ValidationError('Business must be provided.')
        validated_data['customer'] = user
        return Order.objects.create(**validated_data)


# =============================================================================
# BUSINESS SERIALIZER
# =============================================================================

class BusinessSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    owner = serializers.SerializerMethodField()
    manufacturer = serializers.SerializerMethodField()
    
    class Meta:
        model = Business
        fields = [
            'id', 'name', 'slogan', 'invite_code', 'owner', 'manufacturer', 'status', 'is_public'
        ]
        read_only_fields = ['id', 'invite_code', 'owner', 'manufacturer', 'status']
    
    def get_owner(self, obj):
        """Return owner information as nested object"""
        if obj.owner:
            return {
                'id': obj.owner.id,
                'username': obj.owner.username,
                'first_name': obj.owner.first_name,
                'last_name': obj.owner.last_name,
                'email': obj.owner.email,
                'company_name': obj.owner.company_name
            }
        return None
    
    def get_manufacturer(self, obj):
        """Return manufacturer information as nested object"""
        if obj.manufacturer:
            return {
                'id': obj.manufacturer.id,
                'username': obj.manufacturer.username,
                'first_name': obj.manufacturer.first_name,
                'last_name': obj.manufacturer.last_name,
                'email': obj.manufacturer.email,
                'company_name': obj.manufacturer.company_name
            }
        return None
    
    def get_status(self, obj):
        """Determine the status of the business relationship for the current user"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            print(f"DEBUG: No request context or user not authenticated for business {obj.id}")
            return 'none'
        
        user = request.user
        print(f"DEBUG: Computing status for business {obj.id} ({obj.name}) and user {user.username}")
        
        # If user is the approved manufacturer
        if obj.manufacturer == user:
            print(f"DEBUG: User {user.username} is approved manufacturer for business {obj.id}")
            return 'approved'
        
        # If user is in pending manufacturers
        if obj.pending_manufacturers.filter(id=user.id).exists():
            print(f"DEBUG: User {user.username} is pending manufacturer for business {obj.id}")
            return 'pending'
        
        # If user is in rejected manufacturers (map to access_revoked for frontend compatibility)
        if obj.rejected_manufacturers.filter(id=user.id).exists():
            print(f"DEBUG: User {user.username} is rejected manufacturer for business {obj.id}")
            return 'access_revoked'
        
        # If user is the owner (customer)
        if obj.owner == user:
            print(f"DEBUG: User {user.username} is owner for business {obj.id}")
            return 'owned'
        
        # No relationship
        print(f"DEBUG: User {user.username} has no relationship with business {obj.id}")
        return 'none'


# =============================================================================
# END CUSTOMER SERIALIZERS
# =============================================================================

class EndCustomerSerializer(serializers.ModelSerializer):
    """
    End Customer Serializer
    ----------------------
    Handles serialization of end customers for sales invoices.
    """
    class Meta:
        model = EndCustomer
        fields = ['id', 'name', 'contact_person', 'email', 'phone', 'address', 'business', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def create(self, validated_data):
        # Set the business from the request user only if not provided in data
        request = self.context.get('request')
        if 'business' not in validated_data and request and hasattr(request.user, 'business'):
            validated_data['business'] = request.user.business
        return super().create(validated_data)


# =============================================================================
# INVOICE ITEM SERIALIZERS
# =============================================================================

class InvoiceItemSerializer(serializers.ModelSerializer):
    """
    Invoice Item Serializer
    ----------------------
    Handles serialization of individual invoice items.
    """
    class Meta:
        model = InvoiceItem
        fields = ['id', 'invoice', 'product_name', 'description', 'quantity', 'unit_price', 'total_price', 'created_at']
        read_only_fields = ['total_price', 'created_at', 'invoice']  # Make invoice read-only for nested creation


# =============================================================================
# INVOICE SERIALIZERS
# =============================================================================

class InvoiceSerializer(serializers.ModelSerializer):
    """
    Invoice Serializer
    ------------------
    Handles invoice serialization with order and business information.
    Supports both manufacturer and customer invoices.
    """
    order_number = serializers.CharField(source='order.order_number', read_only=True, allow_null=True)
    customer_name = serializers.CharField(required=False, allow_blank=True)
    business_name = serializers.CharField(source='business.name', read_only=True)
    related_orders_display = serializers.CharField(source='get_related_orders_display', read_only=True)
    total_orders = serializers.IntegerField(source='get_total_orders', read_only=True)
    recipient_name_display = serializers.CharField(source='recipient_name', read_only=True)
    items = InvoiceItemSerializer(many=True, read_only=True)
    
    # Custom decimal fields to ensure proper formatting
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, coerce_to_string=True)
    tax_percentage = serializers.DecimalField(max_digits=5, decimal_places=2, coerce_to_string=True)
    tax_amount = serializers.DecimalField(max_digits=12, decimal_places=2, coerce_to_string=True)
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2, coerce_to_string=True)
    advanced_paid = serializers.DecimalField(max_digits=12, decimal_places=2, coerce_to_string=True)
    balance_due = serializers.DecimalField(max_digits=12, decimal_places=2, coerce_to_string=True)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, coerce_to_string=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'business', 'invoice_number', 'invoice_type', 'created_by',
            'recipient_id', 'recipient_name', 'recipient_name_display',
            'order', 'related_orders', 'related_orders_display', 'total_orders',
            'customer_name', 'bill_to', 'contact_info', 'po_number', 'invoice_date',
            'amount', 'due_date', 'status', 'notes', 'created_at', 'updated_at', 
            'order_number', 'business_name', 'items',
            # Enhanced fields
            'line_items', 'subtotal', 'tax_percentage', 'tax_amount', 'total_amount', 
            'advanced_paid', 'balance_due',
            'payment_instructions', 'contact_for_questions', 'thank_you_message'
        ]
        read_only_fields = ['invoice_number', 'created_at', 'updated_at', 'related_orders_display', 'total_orders']

    def create(self, validated_data):
        # Set the business from the request user only if not provided in data
        request = self.context.get('request')
        if 'business' not in validated_data and request and hasattr(request.user, 'business'):
            validated_data['business'] = request.user.business
        
        # Handle related orders
        related_orders = validated_data.pop('related_orders', [])
        invoice = super().create(validated_data)
        
        # Add related orders
        if related_orders:
            invoice.related_orders.set(related_orders)
        
        return invoice

    def validate(self, data):
        """Validate invoice data and ensure proper decimal handling"""
        # Validate recipient_id based on invoice_type
        invoice_type = data.get('invoice_type')
        recipient_id = data.get('recipient_id')
        
        if invoice_type == 'customer' and recipient_id:
            # For customer invoices, recipient_id should be an EndCustomer id
            from .models import EndCustomer
            if not EndCustomer.objects.filter(id=recipient_id, business=data.get('business')).exists():
                raise serializers.ValidationError("Invalid end customer selected")
        elif invoice_type == 'manufacturer' and recipient_id:
            # For manufacturer invoices, recipient_id should be a manufacturer id
            # Add your manufacturer validation logic here if needed
            pass
        
        # Ensure all decimal fields are properly formatted
        decimal_fields = ['subtotal', 'tax_percentage', 'tax_amount', 'total_amount', 'advanced_paid', 'balance_due', 'amount']
        
        for field in decimal_fields:
            if field in data:
                try:
                    # Convert to Decimal and ensure 2 decimal places
                    from decimal import Decimal, ROUND_HALF_UP
                    value = Decimal(str(data[field]))
                    data[field] = float(value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
                except (ValueError, TypeError):
                    raise serializers.ValidationError(f"Invalid decimal value for {field}")
        
        return data

    def update(self, instance, validated_data):
        # Handle related orders
        related_orders = validated_data.pop('related_orders', None)
        invoice = super().update(instance, validated_data)
        
        # Update related orders if provided
        if related_orders is not None:
            invoice.related_orders.set(related_orders)
        
        return invoice


class InvoiceCreateSerializer(serializers.ModelSerializer):
    """
    Invoice Create Serializer
    ------------------------
    Handles invoice creation with items.
    """
    items = InvoiceItemSerializer(many=True)
    
    class Meta:
        model = Invoice
        fields = [
            'invoice_number', 'invoice_type', 'business', 'created_by',
            'recipient_id', 'recipient_name', 'subtotal', 'tax_percentage',
            'status', 'due_date', 'notes', 'items'
        ]

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        invoice = Invoice.objects.create(**validated_data)
        
        # Create invoice items
        for item_data in items_data:
            InvoiceItem.objects.create(invoice=invoice, **item_data)
        
        # Recalculate totals from invoice items
        invoice.recalculate_totals_from_items()
        invoice.save()
        
        return invoice


# =============================================================================
# NUMBER CONFIGURATION SERIALIZERS
# =============================================================================

class NumberConfigSerializer(serializers.ModelSerializer):
    """
    Number Configuration Serializer
    -------------------------------
    Handles serialization of number configuration for orders and invoices.
    """
    class Meta:
        model = NumberConfig
        fields = [
            'id', 'business', 'config_type', 'start_number', 
            'current_number', 'prefix', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'business']  # Removed 'config_type' from read-only

    def validate(self, data):
        """Allow setting current_number to any value"""
        # Allow any current_number value - remove restrictive validation
        # This allows resetting the numbering sequence
        return data


class ProposalSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    business_name = serializers.CharField(source='business.name', read_only=True)
    responses_count = serializers.IntegerField(read_only=True)
    accepted_responses_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Proposal
        fields = [
            'id', 'customer', 'customer_name', 'business', 'business_name',
            'title', 'description', 'category', 'quantity_needed', 'budget_range',
            'deadline', 'is_active', 'created_at', 'updated_at',
            'responses_count', 'accepted_responses_count'
        ]
        read_only_fields = ['customer', 'created_at', 'updated_at']


class ProposalResponseSerializer(serializers.ModelSerializer):
    manufacturer_name = serializers.CharField(source='manufacturer.get_full_name', read_only=True)
    manufacturer_email = serializers.CharField(source='manufacturer.email', read_only=True)
    manufacturer_company = serializers.CharField(source='manufacturer.company_name', read_only=True)
    manufacturer_location = serializers.CharField(source='manufacturer.location', read_only=True)
    proposal_title = serializers.CharField(source='proposal.title', read_only=True)
    business_name = serializers.CharField(source='proposal.business.name', read_only=True)

    class Meta:
        model = ProposalResponse
        fields = [
            'id', 'proposal', 'proposal_title', 'business_name',
            'manufacturer', 'manufacturer_name', 'manufacturer_email',
            'manufacturer_company', 'manufacturer_location',
            'message', 'price_quote', 'delivery_time', 'status', 'created_at'
        ]
        read_only_fields = ['manufacturer', 'created_at']


# =============================================================================
# CHAT SERIALIZERS
# =============================================================================

class ChatMessageSerializer(serializers.ModelSerializer):
    """
    Chat Message Serializer
    -----------------------
    Handles serialization of individual chat messages.
    """
    sender_name = serializers.CharField(source='sender.get_full_name', read_only=True)
    sender_email = serializers.CharField(source='sender.email', read_only=True)
    
    class Meta:
        model = ChatMessage
        fields = [
            'id', 'chat_room', 'sender', 'sender_name', 'sender_email',
            'message', 'created_at', 'is_read'
        ]
        read_only_fields = ['sender', 'created_at', 'is_read']


class ChatRoomSerializer(serializers.ModelSerializer):
    """
    Chat Room Serializer
    --------------------
    Handles serialization of chat rooms with related data.
    """
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    manufacturer_name = serializers.CharField(source='manufacturer.get_full_name', read_only=True)
    request_title = serializers.CharField(source='request.business.name', read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatRoom
        fields = [
            'id', 'customer', 'customer_name', 'manufacturer', 'manufacturer_name',
            'request', 'request_title', 'created_at', 'is_active',
            'last_message', 'unread_count'
        ]
        read_only_fields = ['created_at']
    
    def get_last_message(self, obj):
        """Get the last message in the chat room"""
        last_message = obj.messages.last()
        if last_message:
            return {
                'id': last_message.id,
                'message': last_message.message[:100] + '...' if len(last_message.message) > 100 else last_message.message,
                'sender_name': last_message.sender.get_full_name(),
                'created_at': last_message.created_at
            }
        return None
    
    def get_unread_count(self, obj):
        """Get unread message count for the current user"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0
        
        user = request.user
        if user == obj.customer:
            return obj.unread_count_customer
        elif user == obj.manufacturer:
            return obj.unread_count_manufacturer
        return 0


class ChatRoomDetailSerializer(ChatRoomSerializer):
    """
    Chat Room Detail Serializer
    ---------------------------
    Extended serializer for detailed chat room view with messages.
    """
    messages = ChatMessageSerializer(many=True, read_only=True)
    
    class Meta(ChatRoomSerializer.Meta):
        fields = ChatRoomSerializer.Meta.fields + ['messages']