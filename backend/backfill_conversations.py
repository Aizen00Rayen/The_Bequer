import os
import django
from django.utils import timezone
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bequer_backend.settings') # Assuming 'backend.settings' or project name
django.setup()

from courses.models import Conversation

qs = Conversation.objects.filter(access_expires_at__isnull=True)
count = qs.count()
print(f"Found {count} conversations to update.")
qs.update(access_expires_at=timezone.now() + timedelta(days=30))
print("Update complete.")
