from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('teacher', 'Teacher'),
        ('student', 'Student'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    is_approved = models.BooleanField(default=False, help_text="Designates whether this user has been approved by the admin.")

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class TeacherProfile(models.Model):
    user = models.OneToOneField(
        CustomUser, on_delete=models.CASCADE,
        related_name='teacher_profile', verbose_name="Utilisateur"
    )
    photo = models.ImageField(
        upload_to='teacher_photos/', null=True, blank=True,
        verbose_name="Photo de profil"
    )
    bio = models.TextField(blank=True, verbose_name="Biographie")
    speciality = models.CharField(max_length=255, blank=True, verbose_name="Spécialité")
    linkedin = models.URLField(blank=True, verbose_name="LinkedIn")
    website = models.URLField(blank=True, verbose_name="Site web")
    phone = models.CharField(max_length=30, blank=True, verbose_name="Téléphone")

    class Meta:
        verbose_name = "Profil Formateur"
        verbose_name_plural = "Profils Formateurs"

    def __str__(self):
        return f"Profil de {self.user.username}"
