"""
Business Management Models
==========================

This module contains all the models for the business management system.
Models are organized by functionality: Product, Order, Template, and Configuration models.
"""

from django.db import models
from django.conf import settings
from business.models import Business
import time
from django.db import transaction
from django.utils.text import slugify
from django.contrib.auth import get_user_model
from django.utils import timezone


# =============================================================================
# PRODUCT MODELS
# =============================================================================

class ProductTemplate(models.Model):
    """
    Product Template Model
    ----------------------
    Defines the structure and fields for products in a business.
    Each template contains multiple fields that define the product attributes.
    """
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("active", "Active"),
        ("inactive", "Inactive")
    ]

    name = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='product_templates')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class TemplateField(models.Model):
    """
    Template Field Model
    --------------------
    Defines individual fields within a product template.
    Supports various field types like text, number, currency, dropdown, etc.
    """
    FIELD_TYPES = [
        ("text", "Text"),
        ("textarea", "Text Area"),
        ("number", "Number"),
        ("currency", "Currency"),
        ("dropdown", "Dropdown"),
        ("boolean", "Boolean"),
        ("default_value", "Default Value")
    ]

    template = models.ForeignKey(ProductTemplate, on_delete=models.CASCADE, related_name='fields')
    label = models.CharField(max_length=100)
    type = models.CharField(max_length=20, choices=FIELD_TYPES)
    required = models.BooleanField(default=False)
    currency_symbol = models.CharField(max_length=3, default='$', blank=True, null=True)
    decimal_places = models.PositiveSmallIntegerField(default=2, blank=True, null=True)
    options = models.JSONField(default=list, blank=True)
    default_value = models.CharField(max_length=500, blank=True, null=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.label} ({self.type})"


class ProductCategory(models.Model):
    """
    Product Category Model
    ----------------------
    Hierarchical category system for organizing products.
    Supports nested categories with parent-child relationships.
    """
    name = models.CharField(max_length=255)
    parent = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='children'
    )
    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name='categories'
    )

    class Meta:
        unique_together = ('name', 'parent', 'business')
        verbose_name_plural = "Product Categories"

    def __str__(self):
        full_path = [self.name]
        k = self.parent
        while k is not None:
            full_path.append(k.name)
            k = k.parent
        return " > ".join(full_path[::-1])


class Product(models.Model):
    """
    Product Model
    ------------
    Represents individual products based on templates.
    Contains field values and metadata for each product instance.
    """
    name = models.CharField(max_length=255, blank=True, null=True)
    template = models.ForeignKey(ProductTemplate, on_delete=models.CASCADE, related_name='products')
    custom_id = models.CharField(max_length=100, blank=True, null=True, unique=True)
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='products')
    category = models.ForeignKey(ProductCategory, null=True, blank=True, on_delete=models.SET_NULL, related_name='products')
    image = models.ImageField(upload_to='products/images/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name or f"Product #{self.id}"


class ProductFieldValue(models.Model):
    """
    Product Field Value Model
    -------------------------
    Stores the actual values for each field of a product.
    Links products to their template fields with specific values.
    """
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='field_values')
    field = models.ForeignKey(TemplateField, on_delete=models.CASCADE, related_name='product_values')
    value = models.TextField()

    class Meta:
        unique_together = ('product', 'field')

    def __str__(self):
        return f"{self.field.label}: {self.value}"


# =============================================================================
# TEMPLATE MODELS
# =============================================================================







# =============================================================================
# ORDER MODELS
# =============================================================================


class NumberConfig(models.Model):
    """
    Unified Number Configuration Model
    --------------------------------
    Manages automatic numbering for different document types.
    Supports order numbers, manufacturer invoices, and customer invoices.
    """
    CONFIG_TYPE_CHOICES = [
        ('order', 'Order Number'),
        ('manufacturer_invoice', 'Manufacturer Invoice Number'),
        ('customer_invoice', 'Customer Invoice Number'),
    ]
    
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='number_configs')
    config_type = models.CharField(max_length=20, choices=CONFIG_TYPE_CHOICES)
    start_number = models.IntegerField(default=1)
    current_number = models.IntegerField(default=1)
    prefix = models.CharField(max_length=10, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['business', 'config_type']

    def __str__(self):
        return f"{self.get_config_type_display()} for {self.business.name}"

    def get_next_number(self):
        """Generate the next unique number with atomic transaction"""
        with transaction.atomic():
            # Lock the row for update
            config = NumberConfig.objects.select_for_update().get(pk=self.pk)
            number = config.current_number
            config.current_number += 1
            config.save()
            # Add hyphen between prefix and number for better formatting
            if config.prefix:
                return f"{config.prefix}-{number}"
            else:
                return str(number)


class Order(models.Model):
    """
    Order Model
    -----------
    Represents customer orders with form data and status tracking.
    Automatically generates unique order numbers and manages order lifecycle.
    """
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("in_production", "In Production"),
        ("shipped", "Shipped"),
        ("delivered", "Delivered"),
        ("completed", "Completed")
    ]

    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="orders")
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name="orders")
    template_type = models.CharField(max_length=20, default="order")
    data = models.JSONField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    placed_by = models.CharField(max_length=20, choices=[("middleman", "Middleman"), ("manufacturer", "Manufacturer")])
    order_type = models.CharField(max_length=20, choices=[("order_creator", "Order Creator"), ("dynamic_order_form", "Dynamic Order Form")], default="order_creator")
    order_number = models.CharField(max_length=50, unique=True, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        """Override save to automatically generate order numbers and track status changes"""
        # Check if this is a new order or if status is being changed
        is_new = self.pk is None
        old_status = None
        if not is_new:
            try:
                old_instance = Order.objects.get(pk=self.pk)
                old_status = old_instance.status
            except Order.DoesNotExist:
                pass
        
        if not self.order_number:
            try:
                config, created = NumberConfig.objects.get_or_create(
                    business=self.business,
                    config_type='order',
                    defaults={'start_number': 1, 'current_number': 1}
                )
                
                # Generate a unique order number
                max_attempts = 10
                for attempt in range(max_attempts):
                    try:
                        self.order_number = config.get_next_number()
                        # Try to save with the generated number
                        super().save(*args, **kwargs)
                        # Create initial status history entry for new orders
                        OrderStatusHistory.objects.create(
                            order=self,
                            status=self.status,
                            changed_by=self.customer,
                            notes="Order created"
                        )
                        return
                    except Exception as e:
                        if attempt == max_attempts - 1:
                            raise e
                        # If there's a unique constraint violation, increment and try again
                        config.current_number += 1
                        config.save()
            except Exception as e:
                # If all else fails, use a timestamp-based number
                self.order_number = f"ORD-{int(time.time())}"
                super().save(*args, **kwargs)
                # Create initial status history entry for new orders
                OrderStatusHistory.objects.create(
                    order=self,
                    status=self.status,
                    changed_by=self.customer,
                    notes="Order created"
                )
        else:
            super().save(*args, **kwargs)
            # Note: Status history entries are now created by the views
            # to ensure proper attribution of who made the change

    def __str__(self):
        return f"Order #{self.order_number} by {self.customer.username}"


class OrderStatusHistory(models.Model):
    """
    Order Status History Model
    --------------------------
    Tracks the history of status changes for orders.
    Provides accurate timestamps for order timeline display.
    """
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='status_history')
    status = models.CharField(max_length=20, choices=Order.STATUS_CHOICES)
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='order_status_changes')
    changed_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-changed_at']
        verbose_name_plural = "Order Status Histories"

    def __str__(self):
        return f"Order #{self.order.order_number} - {self.status} at {self.changed_at}"


class EndCustomer(models.Model):
    """
    End Customer Model
    -----------------
    Represents end customers that the business sells to.
    Stores customer information for creating sales invoices.
    """
    name = models.CharField(max_length=255)
    contact_person = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='end_customers')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['name', 'business']

    def __str__(self):
        return f"{self.name} - {self.business.name}"


class Invoice(models.Model):
    """
    Invoice Model
    ------------
    Represents invoices between businesses and customers.
    Supports both manufacturer invoices and customer invoices.
    """
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
    ]
    
    INVOICE_TYPE_CHOICES = [
        ('manufacturer', 'Manufacturer Invoice'),
        ('customer', 'Customer Invoice'),
    ]
    
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='invoices')
    invoice_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    invoice_type = models.CharField(max_length=30, choices=INVOICE_TYPE_CHOICES, default='manufacturer')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_invoices', null=True, blank=True)
    
    # For manufacturer invoices: recipient_id = manufacturer_id
    # For customer invoices: recipient_id = end_customer_id
    recipient_id = models.IntegerField(null=True, blank=True)
    recipient_name = models.CharField(max_length=255, null=True, blank=True)  # Store name for easy access
    
    # Order relationships - support both single and multiple orders
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='invoices', null=True, blank=True)
    related_orders = models.ManyToManyField(Order, related_name='related_invoices', blank=True)
    
    # Invoice details
    customer_name = models.CharField(max_length=255, null=True)
    bill_to = models.TextField(blank=True, null=True)
    contact_info = models.CharField(max_length=255, blank=True, null=True)
    po_number = models.CharField(max_length=255, blank=True, null=True)
    invoice_date = models.DateField(auto_now_add=True, null=True, blank=True)
    due_date = models.DateField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Line items and totals
    line_items = models.JSONField(default=list, blank=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    advanced_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    balance_due = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Additional information
    payment_instructions = models.TextField(blank=True, null=True)
    contact_for_questions = models.CharField(max_length=255, blank=True, null=True)
    thank_you_message = models.TextField(blank=True, null=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.customer_name}"

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            # Support both manufacturer and customer invoices
            config_type = 'manufacturer_invoice' if self.invoice_type == 'manufacturer' else 'customer_invoice'
            
            # Get or create number config for this business and config type
            config, created = NumberConfig.objects.get_or_create(
                business=self.business,
                config_type=config_type,
                defaults={
                    'start_number': 1,
                    'current_number': 1,
                    'prefix': 'INV'
                }
            )
            
            self.invoice_number = config.get_next_number()
        
        # Calculate totals if line items are provided
        if self.line_items:
            from decimal import Decimal, ROUND_HALF_UP
            # Use Decimal arithmetic for precise calculations
            subtotal = Decimal('0')
            for item in self.line_items:
                item_amount = Decimal(str(item.get('amount', 0)))
                subtotal += item_amount
            
            self.subtotal = subtotal
        
        # Ensure all decimal fields are properly formatted for calculations
        from decimal import Decimal, ROUND_HALF_UP
        # Convert all fields to Decimal for precise arithmetic first
        self.subtotal = Decimal(str(self.subtotal)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        self.tax_percentage = Decimal(str(self.tax_percentage)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        self.advanced_paid = Decimal(str(self.advanced_paid)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        
        # Auto-calculate tax amount and total using Decimal arithmetic
        self.tax_amount = (self.subtotal * self.tax_percentage) / Decimal('100')
        self.total_amount = self.subtotal + self.tax_amount
        
        # Ensure balance due is never negative and properly formatted
        self.balance_due = max(Decimal('0'), self.total_amount - self.advanced_paid)
        self.amount = self.total_amount  # Keep amount field for backward compatibility
        
        # Final formatting of calculated fields
        self.tax_amount = self.tax_amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        self.total_amount = self.total_amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        self.balance_due = self.balance_due.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        self.amount = self.amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        
        super().save(*args, **kwargs)

    def get_related_orders_display(self):
        """Get a formatted string of related order numbers"""
        orders = list(self.related_orders.all())
        if self.order:
            orders.append(self.order)
        return ', '.join([f"#{order.order_number}" for order in orders]) if orders else 'No orders'

    def get_total_orders(self):
        """Get total number of orders related to this invoice"""
        count = self.related_orders.count()
        if self.order:
            count += 1
        return count

    def recalculate_totals_from_items(self):
        """Recalculate totals from InvoiceItem objects"""
        from decimal import Decimal, ROUND_HALF_UP
        
        # Calculate subtotal from InvoiceItem objects
        subtotal = Decimal('0')
        for item in self.items.all():
            subtotal += item.total_price
        
        self.subtotal = subtotal
        self.tax_amount = (self.subtotal * self.tax_percentage) / Decimal('100')
        self.total_amount = self.subtotal + self.tax_amount
        self.balance_due = max(Decimal('0'), self.total_amount - self.advanced_paid)
        self.amount = self.total_amount  # Keep amount field for backward compatibility
        
        # Final formatting
        self.subtotal = self.subtotal.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        self.tax_amount = self.tax_amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        self.total_amount = self.total_amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        self.balance_due = self.balance_due.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        self.amount = self.amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)




class InvoiceItem(models.Model):
    """
    Invoice Item Model
    -----------------
    Represents individual items within an invoice.
    Stores product details, quantities, and prices for each line item.
    """
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    product_name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    quantity = models.IntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.product_name} - {self.invoice.invoice_number}"

    def save(self, *args, **kwargs):
        # Auto-calculate total price
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)


# =============================================================================
# PREDICTION MODELS
# =============================================================================

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

# =============================================================================
# REQUEST MODELS FOR PHASE 2
# =============================================================================

class ManufacturerRequest(models.Model):
    """
    Manufacturer Request Model
    -------------------------
    Stores contact and join requests from manufacturers to customers
    """
    REQUEST_TYPE_CHOICES = [
        ('contact', 'Contact Request'),
        ('join', 'Join Business Request'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    manufacturer = models.ForeignKey(get_user_model(), on_delete=models.CASCADE, related_name='sent_requests')
    customer = models.ForeignKey(get_user_model(), on_delete=models.CASCADE, related_name='received_requests')
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='requests')
    
    request_type = models.CharField(max_length=20, choices=REQUEST_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Manufacturer information
    manufacturer_name = models.CharField(max_length=255)
    manufacturer_email = models.EmailField()
    manufacturer_phone = models.CharField(max_length=20, blank=True, null=True)
    manufacturer_company = models.CharField(max_length=255, blank=True, null=True)
    
    # Request details
    message = models.TextField(help_text="Manufacturing details and message to the customer")
    
    # Customer response
    customer_response = models.TextField(blank=True, null=True)
    customer_notes = models.TextField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    responded_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ['manufacturer', 'business', 'request_type']
    
    def __str__(self):
        return f"{self.manufacturer_name} - {self.business.name} ({self.request_type})"
    
    def save(self, *args, **kwargs):
        if self.status in ['approved', 'rejected'] and not self.responded_at:
            self.responded_at = timezone.now()
        super().save(*args, **kwargs)

# =============================================================================
# END OF MODELS
# =============================================================================

class Proposal(models.Model):
    customer = models.ForeignKey(get_user_model(), on_delete=models.CASCADE, related_name='posted_proposals')
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='proposals')
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=100)  # e.g., "Textiles", "Electronics"
    quantity_needed = models.CharField(max_length=100)
    budget_range = models.CharField(max_length=100)
    deadline = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.business.name}"

    @property
    def responses_count(self):
        return self.responses.count()

    @property
    def accepted_responses_count(self):
        return self.responses.filter(status='accepted').count()


class ProposalResponse(models.Model):
    proposal = models.ForeignKey(Proposal, on_delete=models.CASCADE, related_name='responses')
    manufacturer = models.ForeignKey(get_user_model(), on_delete=models.CASCADE, related_name='proposal_responses')
    message = models.TextField()
    price_quote = models.CharField(max_length=100, blank=True, null=True)
    delivery_time = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected')
    ], default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Response to {self.proposal.title} by {self.manufacturer.username}"


# =============================================================================
# CHAT MODELS
# =============================================================================

class ChatRoom(models.Model):
    """
    Chat Room Model
    ---------------
    Represents a chat room between a customer and manufacturer.
    Created automatically when a manufacturer request is approved or a proposal response is accepted.
    """
    customer = models.ForeignKey(get_user_model(), on_delete=models.CASCADE, related_name='customer_chats')
    manufacturer = models.ForeignKey(get_user_model(), on_delete=models.CASCADE, related_name='manufacturer_chats')
    request = models.ForeignKey(ManufacturerRequest, on_delete=models.CASCADE, related_name='chat_room', null=True, blank=True)
    proposal_response = models.ForeignKey(ProposalResponse, on_delete=models.CASCADE, related_name='chat_room', null=True, blank=True)
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='chat_rooms', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    
    class Meta:
        unique_together = [
            ['customer', 'manufacturer', 'request'],
            ['customer', 'manufacturer', 'proposal_response'],
            ['customer', 'manufacturer', 'business']
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Chat: {self.customer.get_full_name()} & {self.manufacturer.get_full_name()}"
    
    def clean(self):
        """Ensure either request, proposal_response, or business is set, but not multiple"""
        from django.core.exceptions import ValidationError
        fields_set = sum([bool(self.request), bool(self.proposal_response), bool(self.business)])
        if fields_set == 0:
            raise ValidationError("Either request, proposal_response, or business must be set")
        if fields_set > 1:
            raise ValidationError("Cannot have multiple of request, proposal_response, or business")
    
    @property
    def unread_count_customer(self):
        """Get unread message count for customer"""
        return self.messages.filter(is_read=False).exclude(sender=self.customer).count()
    
    @property
    def unread_count_manufacturer(self):
        """Get unread message count for manufacturer"""
        return self.messages.filter(is_read=False).exclude(sender=self.manufacturer).count()
    



class ChatMessage(models.Model):
    """
    Chat Message Model
    ------------------
    Individual messages within a chat room.
    Messages are automatically cleaned up after 30 days to prevent database clutter.
    """
    chat_room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['chat_room', 'created_at']),
            models.Index(fields=['sender', 'created_at']),
        ]
    
    def __str__(self):
        return f"Message from {self.sender.get_full_name()} at {self.created_at}"
    
    def mark_as_read(self):
        """Mark message as read"""
        self.is_read = True
        self.save(update_fields=['is_read'])
    
    @classmethod
    def cleanup_old_messages(cls, days=30):
        """Clean up messages older than specified days"""
        from django.utils import timezone
        from datetime import timedelta
        
        cutoff_date = timezone.now() - timedelta(days=days)
        deleted_count, _ = cls.objects.filter(created_at__lt=cutoff_date).delete()
        return deleted_count
