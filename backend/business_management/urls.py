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
    CustomerOrderDetailView
)

from django.conf import settings
from django.conf.urls.static import static

# Routers
router = DefaultRouter()
router.register(r'product-templates', ProductTemplateViewSet, basename='product-templates')
router.register(r'products', ProductViewSet, basename='products')
router.register(r'product-categories', ProductCategoryViewSet, basename='product-categories')

# URL Patterns
urlpatterns = [
    # Auth / Customer API
    path('auth/customer-status/', CustomerStatusCheckView.as_view()),
    path('customer/products/', CustomerProductListView.as_view()),
    path('customer/orders/', CustomerOrderView.as_view()),
    path('customer/orders/<int:order_id>/', CustomerOrderDetailView.as_view()),

    # Template upload + field positions
    path('template-upload/', TemplateUploadView.as_view()),
    path('template-upload/<int:template_id>/positions/', OrderFieldPositionView.as_view()),

    # Legacy (optional)
    path('customer/template-upload/', TemplateUploadView.as_view()),

    # Include DRF router
] + router.urls + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
