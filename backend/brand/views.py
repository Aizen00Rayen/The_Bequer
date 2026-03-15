from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import BrandRequest
from .serializers import BrandRequestSerializer

class BrandRequestCreateView(generics.CreateAPIView):
    queryset = BrandRequest.objects.all()
    serializer_class = BrandRequestSerializer
    permission_classes = [AllowAny]

class BrandRequestListView(generics.ListAPIView):
    queryset = BrandRequest.objects.all()
    serializer_class = BrandRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'admin':
            return BrandRequest.objects.all()
        return BrandRequest.objects.none()
