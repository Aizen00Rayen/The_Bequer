from rest_framework import serializers
from .models import BrandRequest

class BrandRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = BrandRequest
        fields = '__all__'
        read_only_fields = ('created_at',)
