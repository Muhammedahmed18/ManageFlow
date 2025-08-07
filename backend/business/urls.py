# business/urls.py
from django.urls import path
from .views import BusinessView, BusinessDetailView, CustomerBusinessDetail
from . import views

urlpatterns = [
    path('manufacturer/businesses/', BusinessView.as_view(), name='business-list-create'),
    path('manufacturer/businesses/<int:id>/', BusinessDetailView.as_view(), name='business-detail'),
    path('businesses/link/', views.link_business, name='link_business'),
    path('businesses/pending-requests/', views.pending_requests, name='pending_requests'),
    path('businesses/approve/', views.approve_manufacturer, name='approve_manufacturer'),
    path('businesses/reject/', views.reject_manufacturer, name='reject_manufacturer'),
    path('customer/business/<int:id>/', CustomerBusinessDetail.as_view()),
]
