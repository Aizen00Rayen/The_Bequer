from django.urls import path
from .views import BrandRequestCreateView, BrandRequestListView

urlpatterns = [
    path('brand/requests/', BrandRequestCreateView.as_view(), name='brand-request-create'),
    path('admin/brand-requests/', BrandRequestListView.as_view(), name='brand-request-list'),
]
