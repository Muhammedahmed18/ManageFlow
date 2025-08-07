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
        ('manufacturer_to_customer', 'Manufacturer to Customer'),
    ]
    
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='invoices')
    invoice_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    invoice_type = models.CharField(max_length=30, choices=INVOICE_TYPE_CHOICES, default='manufacturer_to_customer')
    
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
    sales_tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    gross_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
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
            # Only manufacturer invoices are supported
            config_type = 'manufacturer_invoice'
            
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
            self.gross_total = subtotal + Decimal(str(self.sales_tax))
            # Ensure balance due is never negative and properly formatted
            self.balance_due = max(Decimal('0'), self.gross_total - Decimal(str(self.advanced_paid)))
            self.amount = self.gross_total  # Keep amount field for backward compatibility
        
        # Ensure all decimal fields are properly formatted for calculations
        from decimal import Decimal, ROUND_HALF_UP
        # Convert all fields to Decimal for precise arithmetic
        self.subtotal = Decimal(str(self.subtotal)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        self.sales_tax = Decimal(str(self.sales_tax)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        self.gross_total = Decimal(str(self.gross_total)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        self.advanced_paid = Decimal(str(self.advanced_paid)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        self.balance_due = Decimal(str(self.balance_due)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        self.amount = Decimal(str(self.amount)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        
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


# =============================================================================
# END OF MODELS
# =============================================================================
