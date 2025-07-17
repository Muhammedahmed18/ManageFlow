from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductTemplateViewSet,
    ProductViewSet,
    ProductCategoryViewSet,
    CustomerStatusCheckView,
    CustomerProductListView,
    TemplateUploadView,
    CustomerOrderView,
    OrderFieldPositionView,
    CustomerOrderDetailView,
    OrderNumberConfigView,
    ManufacturerOrderView,
    ManufacturerOrderDetailView,
    OrderFormTemplateViewSet,
    OrderFormFieldViewSet,
    CustomerOrderFormTemplateView,
    TemplateFileDownloadView,
    ManufacturerBusinessListView,
    BusinessCustomerListView,
    clear_order_form_fields
)

from django.conf import settings
from django.conf.urls.static import static

# Routers
router = DefaultRouter()
router.register(r'product-templates', ProductTemplateViewSet, basename='product-templates')
router.register(r'products', ProductViewSet, basename='products')
router.register(r'product-categories', ProductCategoryViewSet, basename='product-categories')
router.register(r'order-form-templates', OrderFormTemplateViewSet, basename='order-form-templates')
router.register(r'order-form-fields', OrderFormFieldViewSet, basename='order-form-fields')

# URL Patterns
urlpatterns = [
    # Auth / Customer API
    path('auth/customer-status/', CustomerStatusCheckView.as_view()),
    path('customer/products/', CustomerProductListView.as_view()),
    path('customer/orders/', CustomerOrderView.as_view()),
    path('customer/orders/<int:order_id>/', CustomerOrderDetailView.as_view()),
    path('customer/order-number-config/', OrderNumberConfigView.as_view()),
    path('customer/order-form-template/', CustomerOrderFormTemplateView.as_view()),

    # Template upload + field positions
    path('template-upload/', TemplateUploadView.as_view()),
    path('template-upload/<int:template_id>/', TemplateUploadView.as_view()),
    path('template-upload/<int:template_id>/positions/', OrderFieldPositionView.as_view()),
    path('template-upload/<int:template_id>/positions/<int:position_id>/', OrderFieldPositionView.as_view()),
    path('template-upload/<int:template_id>/stream/', TemplateFileDownloadView.as_view()),

    # Legacy (optional)
    path('customer/template-upload/', TemplateUploadView.as_view()),

    # Manufacturer API
    path('manufacturer/orders/', ManufacturerOrderView.as_view()),
    path('manufacturer/orders/<int:order_id>/', ManufacturerOrderDetailView.as_view()),
    path('manufacturer/businesses/', ManufacturerBusinessListView.as_view()),
    path('manufacturer/business-customers/', BusinessCustomerListView.as_view()),

    # Order form field clear endpoint
    path('order-form-fields/clear/<int:template_id>/', clear_order_form_fields, name='clear_order_form_fields'),

] + router.urls + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
