from django.db import models

class BrandRequest(models.Model):
    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    brand_name = models.CharField(max_length=255, blank=True, null=True)
    product_category = models.CharField(max_length=100)
    budget = models.CharField(max_length=100)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.full_name} - {self.brand_name or 'Sans marque'}"
