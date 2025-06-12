from django.db import models
from django.conf import settings
from business.models import Business
import time
from django.db import transaction

class ProductTemplate(models.Model):
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
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='field_values')
    field = models.ForeignKey(TemplateField, on_delete=models.CASCADE, related_name='product_values')
    value = models.TextField()

    class Meta:
        unique_together = ('product', 'field')

    def __str__(self):
        return f"{self.field.label}: {self.value}"

class TemplateUpload(models.Model):
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

    class Meta:
        unique_together = ('uploaded_by', 'template_type')

class OrderFieldPosition(models.Model):
    template = models.ForeignKey(
        TemplateUpload,
        on_delete=models.CASCADE,
        related_name='field_positions'
    )
    key = models.CharField(
        max_length=100,
        help_text="Internal field key used in order data (e.g., order_id, sent_by)"
    )
    label = models.CharField(
        max_length=100,
        help_text="Display label for the field (e.g., 'Order ID')"
    )
    x = models.FloatField(
        help_text="X coordinate (in points, 72 DPI) for PDF placement"
    )
    y = models.FloatField(
        help_text="Y coordinate (in points, 72 DPI) for PDF placement"
    )
    page = models.PositiveIntegerField(
        default=1,
        help_text="Page number in the PDF"
    )
    font_size = models.PositiveIntegerField(
        default=12,
        help_text="Font size for rendering text"
    )

    def __str__(self):
        return f"{self.key} at ({self.x}, {self.y}) on page {self.page}"

class OrderNumberConfig(models.Model):
    business = models.OneToOneField(Business, on_delete=models.CASCADE, related_name='order_number_config')
    start_number = models.IntegerField(default=1)
    current_number = models.IntegerField(default=1)
    prefix = models.CharField(max_length=10, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order Config for {self.business.name}"

    def get_next_number(self):
        with transaction.atomic():
            # Lock the row for update
            config = OrderNumberConfig.objects.select_for_update().get(pk=self.pk)
            number = config.current_number
            config.current_number += 1
            config.save()
            return f"{config.prefix or ''}{number}"

class Order(models.Model):
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
