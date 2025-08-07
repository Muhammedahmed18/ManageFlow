from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductTemplateViewSet,
    TemplateFieldViewSet,
    ProductViewSet,
    ProductCategoryViewSet,
    CustomerProductListView,

    CustomerOrderView,

    CustomerOrderDetailView,
    CustomerOrderConfirmDeliveryView,
    ManufacturerOrderView,
    ManufacturerOrderDetailView,


    ManufacturerBusinessListView,
    BusinessCustomerListView,

    BusinessViewSet,
    BusinessManufacturerListView,
    CustomerBusinessInviteCodeView,
    CustomerBusinessManufacturerView,
    join_business,
    InvoiceViewSet,
    EnhancedInvoiceView,
    NumberConfigViewSet,
)
from business.views import CustomerBusinessDetail
from django.conf import settings
from django.conf.urls.static import static

# Routers
router = DefaultRouter()
router.register(r'product-templates', ProductTemplateViewSet, basename='product-templates')
router.register(r'template-fields', TemplateFieldViewSet, basename='template-fields')
router.register(r'products', ProductViewSet, basename='products')
router.register(r'product-categories', ProductCategoryViewSet, basename='product-categories')

router.register(r'businesses', BusinessViewSet, basename='businesses')
router.register(r'invoices', InvoiceViewSet, basename='invoices')
router.register(r'number-configs', NumberConfigViewSet, basename='number-configs')

# URL Patterns
urlpatterns = [
    # Auth / Customer API
    path('customer/products/', CustomerProductListView.as_view()),
    path('customer/orders/', CustomerOrderView.as_view()),
    path('customer/orders/<int:order_id>/', CustomerOrderDetailView.as_view()),
    path('customer/orders/<int:order_id>/confirm-delivery/', CustomerOrderConfirmDeliveryView.as_view()),

    path('customer/business/<int:id>/', CustomerBusinessDetail.as_view()),
    path('customer/business-invite-code/', CustomerBusinessInviteCodeView.as_view()),
    path('customer/business-manufacturer/', CustomerBusinessManufacturerView.as_view()),



    # Manufacturer API
    path('manufacturer/orders/', ManufacturerOrderView.as_view()),
    path('manufacturer/orders/<int:order_id>/', ManufacturerOrderDetailView.as_view()),
    path('manufacturer/businesses/', ManufacturerBusinessListView.as_view()),
    path('manufacturer/business-customers/', BusinessCustomerListView.as_view()),
    path('manufacturer/business-manufacturers/', BusinessManufacturerListView.as_view()),
    path('manufacturer/join-business/', join_business),



    # Enhanced Invoice API
    path('enhanced-invoices/', EnhancedInvoiceView.as_view(), name='enhanced_invoices'),
    path('enhanced-invoices/<int:invoice_id>/', EnhancedInvoiceView.as_view(), name='enhanced_invoice_detail'),



] + router.urls + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
