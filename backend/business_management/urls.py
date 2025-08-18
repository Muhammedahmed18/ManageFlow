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
    ManufacturerCustomerOverviewView,  # NEW IMPORT
    CustomerDiscoveryView,  # NEW IMPORT
    ManufacturerRequestView,  # NEW IMPORT
    CustomerToManufacturerRequestView,  # NEW IMPORT
    CustomerRequestManagementView,  # NEW IMPORT
    CustomerMyRequestsView,  # NEW IMPORT
    ManufacturerRequestHistoryView,  # NEW IMPORT
    ManufacturerRequestDetailView,  # NEW IMPORT
    ManufacturerRequestStatsView,  # NEW IMPORT
    ManufacturerRequestLimitCheckView,  # NEW IMPORT
    ManufacturerIncomingRequestsView,  # NEW IMPORT
    ManufacturerIncomingRequestDetailView,  # NEW IMPORT

    BusinessViewSet,
    BusinessManufacturerListView,
    CustomerBusinessInviteCodeView,
    CustomerBusinessManufacturerView,
    join_business,
    InvoiceViewSet,
    EndCustomerViewSet,
    EnhancedInvoiceView,
    NumberConfigViewSet,
    
    # Proposal system imports
    ProposalViewSet,
    ProposalResponseViewSet,
    CustomerProposalListView,
    ManufacturerProposalDiscoveryView,
    ProposalResponseManagementView,
    CustomerManufacturerDiscoveryView,
    
    # Chat system imports
    ChatRoomViewSet,
    ChatMessageViewSet,
    ChatNotificationView,
    ApprovedCustomersView,
    ApprovedManufacturersView,
    JoinBusinessView,
)
from .advanced_views import AdvancedDashboardViewSet, AdvancedSearchViewSet, ReportViewSet
from .prediction_views import PredictionDashboardView, GeneratePredictionView, ProductConfidenceView, GrowthDataView, DebugOrdersView, MLForecastView, AnomalyDetectionView
from .customer_performance_views import CustomerPerformanceView, CustomerOrderAnalyticsView, CustomerSpendingInsightsView, CustomerRevenueTrendsView, CustomerRevenueForecastView, CustomerRevenueInsightsView, GenerateRealInsightsView
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
router.register(r'end-customers', EndCustomerViewSet, basename='endcustomer')
router.register(r'number-configs', NumberConfigViewSet, basename='number-configs')

# Proposal system routers
router.register(r'proposals', ProposalViewSet, basename='proposals')
router.register(r'proposal-responses', ProposalResponseViewSet, basename='proposal-responses')

# Chat system routers
router.register(r'chat-rooms', ChatRoomViewSet, basename='chat-room')
router.register(r'chat-messages', ChatMessageViewSet, basename='chat-message')

# Advanced features routers
router.register(r'advanced-dashboard', AdvancedDashboardViewSet, basename='advanced-dashboard')
router.register(r'advanced-search', AdvancedSearchViewSet, basename='advanced-search')
router.register(r'reports', ReportViewSet, basename='reports')

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
    path('customer/requests/', CustomerRequestManagementView.as_view()),  # NEW URL
    path('customer/requests/<int:request_id>/', CustomerRequestManagementView.as_view()),  # NEW URL
    path('customer/my-requests/', CustomerMyRequestsView.as_view()),  # NEW URL
    
    # Proposal system URLs
    path('customer/proposals/', CustomerProposalListView.as_view()),
    path('proposals/<int:proposal_id>/responses/', ProposalResponseManagementView.as_view()),
    path('proposals/<int:proposal_id>/responses/<int:response_id>/', ProposalResponseManagementView.as_view()),
    
    # Customer manufacturer discovery
    path('customer/manufacturers/', CustomerManufacturerDiscoveryView.as_view()),
    
    # Chat system URLs
path('chat-notifications/', ChatNotificationView.as_view()),
path('manufacturer/approved-customers/', ApprovedCustomersView.as_view()),
path('customer/approved-manufacturers/', ApprovedManufacturersView.as_view()),

# Manufacturer business joining
path('manufacturer/join-business/', JoinBusinessView.as_view()),



    # Manufacturer API
    path('manufacturer/orders/', ManufacturerOrderView.as_view()),
    path('manufacturer/orders/<int:order_id>/', ManufacturerOrderDetailView.as_view()),
    path('manufacturer/businesses/', ManufacturerBusinessListView.as_view()),
    path('manufacturer/business-customers/', BusinessCustomerListView.as_view()),
    path('manufacturer/business-manufacturers/', BusinessManufacturerListView.as_view()),
    path('manufacturer/join-business/', join_business),
    path('manufacturer/customers/', ManufacturerCustomerOverviewView.as_view()),  # NEW URL
    path('manufacturer/discover-customers/', CustomerDiscoveryView.as_view()),  # NEW URL
    path('manufacturer/requests/', ManufacturerRequestView.as_view()),  # NEW URL
    path('customer/requests-to-manufacturer/', CustomerToManufacturerRequestView.as_view()),  # NEW URL
    path('manufacturer/my-requests/', ManufacturerRequestHistoryView.as_view()),  # NEW URL
    path('manufacturer/my-requests/<int:request_id>/', ManufacturerRequestDetailView.as_view()),  # NEW URL
    path('manufacturer/request-stats/', ManufacturerRequestStatsView.as_view()),  # NEW URL
    path('manufacturer/request-limit-check/', ManufacturerRequestLimitCheckView.as_view()),  # NEW URL
    path('manufacturer/incoming-requests/', ManufacturerIncomingRequestsView.as_view()),  # NEW URL
    path('manufacturer/incoming-requests/<int:request_id>/', ManufacturerIncomingRequestDetailView.as_view()),  # NEW URL
    
    # Manufacturer proposal discovery
    path('manufacturer/proposals/', ManufacturerProposalDiscoveryView.as_view()),



    # Enhanced Invoice API
    path('enhanced-invoices/', EnhancedInvoiceView.as_view(), name='enhanced_invoices'),
    path('enhanced-invoices/<int:invoice_id>/', EnhancedInvoiceView.as_view(), name='enhanced_invoice_detail'),

    # AI Prediction API
    path('predictions/<int:business_id>/dashboard/', PredictionDashboardView.as_view(), name='prediction_dashboard'),
    path('predictions/<int:business_id>/generate/', GeneratePredictionView.as_view(), name='generate_prediction'),
    path('predictions/<int:business_id>/product/<int:product_id>/confidence/', ProductConfidenceView.as_view(), name='product_confidence'),
    path('predictions/<int:business_id>/growth/', GrowthDataView.as_view(), name='growth_data'),
    path('predictions/<int:business_id>/debug-orders/', DebugOrdersView.as_view(), name='debug_orders'),
    path('predictions/<int:business_id>/ml-forecast/', MLForecastView.as_view(), name='ml_forecast'),

    path('predictions/<int:business_id>/anomaly-detection/', AnomalyDetectionView.as_view(), name='anomaly_detection'),

    # Customer Performance API
    path('customer/performance/<int:business_id>/', CustomerPerformanceView.as_view(), name='customer_performance'),
    path('customer/analytics/<int:business_id>/', CustomerOrderAnalyticsView.as_view(), name='customer_analytics'),
    path('customer/spending/<int:business_id>/', CustomerSpendingInsightsView.as_view(), name='customer_spending'),
    path('customer/revenue-trends/<int:business_id>/', CustomerRevenueTrendsView.as_view(), name='customer_revenue_trends'),
    path('customer/revenue-forecast/<int:business_id>/', CustomerRevenueForecastView.as_view(), name='customer_revenue_forecast'),
    path('customer/revenue-insights/<int:business_id>/', CustomerRevenueInsightsView.as_view(), name='customer_revenue_insights'),
    path('customer/generate-real-insights/<int:business_id>/', GenerateRealInsightsView.as_view(), name='generate_real_insights'),

] + router.urls + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
