from django.contrib import admin
from .models import Training

@admin.register(Training)
class TrainingAdmin(admin.ModelAdmin):
    list_display = ('title', 'price_dzd', 'start_date', 'duration')
    search_fields = ('title', 'description')
    list_filter = ('start_date',)
