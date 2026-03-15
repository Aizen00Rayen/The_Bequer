import os
import django
from django.utils import timezone
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bequer_backend.settings') # Assuming 'backend.settings' or project name
django.setup()

from courses.models import Conversation
from courses.payment_views import _paypart_create_invitation

# Let's test calling Paypart explicitly with the Conversation item format
conv = Conversation.objects.first()
title = "Abonnement Messagerie Formateur"
desc = f"Extension de 30 jours pour la discussion avec le formateur."
amount = 10000.00
inv_result = _paypart_create_invitation(title, desc, amount)

print(inv_result)
