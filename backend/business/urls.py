# business/urls.py
from django.urls import path
from .views import BusinessView, BusinessDetailView

urlpatterns = [
    path('manufacturer/businesses/', BusinessView.as_view(), name='business-list-create'),
    path('manufacturer/businesses/<int:id>/', BusinessDetailView.as_view(), name='business-detail')

    # Add update/delete routes later
]
