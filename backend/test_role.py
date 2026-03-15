import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bequer_backend.settings')
django.setup()

from users.models import CustomUser
user = CustomUser.objects.filter(username='admin_new').first()
if user:
    print(f"User: {user.username}")
    print(f"Role: {user.role}")
    print(f"Is Superuser: {user.is_superuser}")
    print(f"Is Staff: {user.is_staff}")
else:
    print("User not found!")
