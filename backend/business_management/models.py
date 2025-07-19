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
        ("date", "Date")
    ]

    template = models.ForeignKey(ProductTemplate, on_delete=models.CASCADE, related_name='fields')
    label = models.CharField(max_length=100)
    type = models.CharField(max_length=20, choices=FIELD_TYPES)
    required = models.BooleanField(default=False)
    currency_symbol = models.CharField(max_length=3, default='$', blank=True, null=True)
    decimal_places = models.PositiveSmallIntegerField(default=2, blank=True, null=True)
    options = models.JSONField(default=list, blank=True)
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

class TemplateUpload(models.Model):
    """
    Template Upload Model
    ---------------------
    Manages uploaded PDF templates for order forms and invoices.
    Stores file metadata and field mappings for form processing.
    """
    TEMPLATE_TYPE_CHOICES = [
        ("order", "Order Form"),
        ("invoice", "Invoice Form"),
    ]

    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="template_uploads"
    )
    template_type = models.CharField(max_length=10, choices=TEMPLATE_TYPE_CHOICES)
    file = models.FileField(upload_to='templates/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    field_mappings = models.JSONField(default=dict, blank=True, help_text="Mapping of form labels to field keys")
    preview_image = models.ImageField(upload_to='templates/previews/', null=True, blank=True)
    preview_dpi = models.PositiveIntegerField(null=True, blank=True)
    pdf_width_pt = models.FloatField(null=True, blank=True)
    pdf_height_pt = models.FloatField(null=True, blank=True)

    class Meta:
        unique_together = ('uploaded_by', 'template_type')


class OrderFormTemplate(models.Model):
    """
    Order Form Template Model
    -------------------------
    Defines the structure of order forms for businesses.
    Contains fields that customers need to fill when placing orders.
    """
    business = models.ForeignKey("business.Business", on_delete=models.CASCADE, related_name="order_form_templates")
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} (Business ID: {self.business_id})"


class OrderFormField(models.Model):
    """
    Order Form Field Model
    ----------------------
    Defines individual fields within an order form template.
    Specifies field types, validation rules, and display order.
    """
    FIELD_TYPES = [
        ('text', 'Text'),
        ('number', 'Number'),
        ('date', 'Date'),
        ('dropdown', 'Dropdown'),
    ]

    template = models.ForeignKey(OrderFormTemplate, on_delete=models.CASCADE, related_name="fields")
    label = models.CharField(max_length=255)
    key = models.SlugField(max_length=255)  # e.g., 'material', 'delivery_date'
    type = models.CharField(max_length=20, choices=FIELD_TYPES)
    required = models.BooleanField(default=False)
    description = models.TextField(blank=True, null=True)
    order = models.PositiveIntegerField(default=0)

    def save(self, *args, **kwargs):
        if not self.key:
            self.key = slugify(self.label)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.label} ({self.type})"


class OrderFieldPosition(models.Model):
    """
    Order Field Position Model
    --------------------------
    Defines the position of form fields on uploaded PDF templates.
    Stores coordinates for placing dynamic content on PDF forms.
    """
    order_form_template = models.ForeignKey(OrderFormTemplate, on_delete=models.CASCADE, related_name="field_positions")
    template_upload = models.ForeignKey('TemplateUpload', on_delete=models.CASCADE, related_name='field_positions', null=True, blank=True)
    field_key = models.CharField(max_length=255, default="unknown")  # Must match OrderFormField.key
    x = models.FloatField(help_text="X coordinate in PDF points")
    y = models.FloatField(help_text="Y coordinate in PDF points")
    page = models.IntegerField(default=1)

    def __str__(self):
        return f"{self.field_key} @ ({self.x}, {self.y}) on page {self.page}"


# =============================================================================
# ORDER MODELS
# =============================================================================

class OrderNumberConfig(models.Model):
    """
    Order Number Configuration Model
    --------------------------------
    Manages automatic order number generation for businesses.
    Tracks current sequence and prefix for order numbering.
    """
    business = models.OneToOneField(Business, on_delete=models.CASCADE, related_name='order_number_config')
    start_number = models.IntegerField(default=1)
    current_number = models.IntegerField(default=1)
    prefix = models.CharField(max_length=10, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order Config for {self.business.name}"

    def get_next_number(self):
        """Generate the next unique order number with atomic transaction"""
        with transaction.atomic():
            # Lock the row for update
            config = OrderNumberConfig.objects.select_for_update().get(pk=self.pk)
            number = config.current_number
            config.current_number += 1
            config.save()
            return f"{config.prefix or ''}{number}"


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
        ("completed", "Completed")
    ]

    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="orders")
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name="orders")
    template_type = models.CharField(max_length=20, default="order")
    data = models.JSONField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    placed_by = models.CharField(max_length=20, choices=[("middleman", "Middleman"), ("manufacturer", "Manufacturer")])
    order_number = models.CharField(max_length=50, unique=True, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        """Override save to automatically generate order numbers"""
        if not self.order_number:
            try:
                config, created = OrderNumberConfig.objects.get_or_create(
                    business=self.business,
                    defaults={'start_number': 1, 'current_number': 1}
                )
                
                # Generate a unique order number
                max_attempts = 10
                for attempt in range(max_attempts):
                    try:
                        self.order_number = config.get_next_number()
                        # Try to save with the generated number
                        super().save(*args, **kwargs)
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
        else:
            super().save(*args, **kwargs)

    def __str__(self):
        return f"Order #{self.order_number} by {self.customer.username}"
