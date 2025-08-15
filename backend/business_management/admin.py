from django.contrib import admin
from .models import EndCustomer, Invoice, InvoiceItem

@admin.register(EndCustomer)
class EndCustomerAdmin(admin.ModelAdmin):
    list_display = ['name', 'contact_person', 'email', 'business', 'created_at']
    list_filter = ['business', 'created_at']
    search_fields = ['name', 'contact_person', 'email']
    readonly_fields = ['created_at', 'updated_at']


class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 1


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'invoice_type', 'recipient_name', 'total_amount', 'status', 'created_at']
    list_filter = ['invoice_type', 'status', 'created_at', 'business']
    search_fields = ['invoice_number', 'recipient_name']
    readonly_fields = ['created_at', 'updated_at', 'tax_amount', 'total_amount']
    inlines = [InvoiceItemInline]
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('business', 'created_by')
