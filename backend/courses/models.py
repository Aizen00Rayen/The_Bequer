from django.db import models
from django.conf import settings

class Category(models.Model):
    name = models.CharField(max_length=255, unique=True, verbose_name="Nom de la catégorie")
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subcategories', verbose_name="Catégorie Parente")

    class Meta:
        verbose_name = "Catégorie"
        verbose_name_plural = "Catégories"
        ordering = ['name']

    def __str__(self):
        return self.name

class Training(models.Model):
    STATUS_DRAFT    = 'draft'
    STATUS_PENDING  = 'pending'
    STATUS_APPROVED = 'approved'
    STATUS_REJECTED = 'rejected'
    STATUS_CHOICES = [
        (STATUS_DRAFT,    'Brouillon'),
        (STATUS_PENDING,  'En attente de validation'),
        (STATUS_APPROVED, 'Approuvée'),
        (STATUS_REJECTED, 'Refusée'),
    ]

    title = models.CharField(max_length=255, verbose_name="Titre")
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name="courses", verbose_name="Catégorie")
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="taught_courses", verbose_name="Formateur")
    submitted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="submitted_courses", verbose_name="Soumis par")
    description = models.TextField(verbose_name="Description")
    price_dzd = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Prix (DZD)")
    discount_percent = models.PositiveSmallIntegerField(default=0, verbose_name="Réduction expert (%)")
    admin_discount_percent = models.PositiveSmallIntegerField(default=0, verbose_name="Réduction admin (%)")
    start_date = models.DateField(verbose_name="Date de début", null=True, blank=True)
    duration = models.CharField(max_length=100, verbose_name="Durée", blank=True)
    cover_image = models.ImageField(upload_to='course_covers/', null=True, blank=True, verbose_name="Image de couverture")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_APPROVED, verbose_name="Statut")
    rejection_reason = models.TextField(blank=True, verbose_name="Raison du refus")
    submitted_at = models.DateTimeField(null=True, blank=True, verbose_name="Soumis le")
    reviewed_at = models.DateTimeField(null=True, blank=True, verbose_name="Revu le")

    class Meta:
        verbose_name = "Formation"
        verbose_name_plural = "Formations"
        ordering = ['-submitted_at', 'start_date']

    def __str__(self):
        return f"{self.title} - {self.price_dzd} DZD"

class VideoLesson(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_APPROVED = 'approved'
    STATUS_REJECTED = 'rejected'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'En attente'),
        (STATUS_APPROVED, 'Approuvée'),
        (STATUS_REJECTED, 'Refusée'),
    ]

    course = models.ForeignKey(Training, on_delete=models.CASCADE, related_name="videos", verbose_name="Formation")
    title = models.CharField(max_length=255, verbose_name="Titre de la vidéo")
    description = models.TextField(verbose_name="Description", blank=True, null=True)
    video_file = models.FileField(upload_to='course_videos/', verbose_name="Fichier Vidéo")
    duration_seconds = models.PositiveIntegerField(default=0, verbose_name="Durée en secondes")
    order = models.PositiveIntegerField(default=0, verbose_name="Ordre de lecture")
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default=STATUS_PENDING, verbose_name="Statut")
    is_free_preview = models.BooleanField(default=False, verbose_name="Vidéo d'aperçu gratuite")

    class Meta:
        verbose_name = "Leçon Vidéo"
        verbose_name_plural = "Leçons Vidéos"
        ordering = ['order']

    def __str__(self):
        return f"{self.course.title} - {self.title}"

class Enrollment(models.Model):
    student = models.ForeignKey('users.CustomUser', on_delete=models.CASCADE, related_name='enrollments', verbose_name="Étudiant")
    course = models.ForeignKey(Training, on_delete=models.CASCADE, related_name='enrollments', verbose_name="Formation")
    is_approved = models.BooleanField(default=False, verbose_name="Approuvée")
    enrolled_at = models.DateTimeField(auto_now_add=True, verbose_name="Date d'inscription")

    class Meta:
        verbose_name = "Inscription"
        verbose_name_plural = "Inscriptions"
        unique_together = ['student', 'course']

    def __str__(self):
        return f"{self.student.username} - {self.course.title} ({'Approuvée' if self.is_approved else 'En attente'})"

class VideoProgress(models.Model):
    student = models.ForeignKey('users.CustomUser', on_delete=models.CASCADE, related_name='video_progress', verbose_name="Étudiant")
    video = models.ForeignKey(VideoLesson, on_delete=models.CASCADE, related_name='progress', verbose_name="Vidéo")
    is_completed = models.BooleanField(default=False, verbose_name="Terminé")
    completed_at = models.DateTimeField(auto_now=True, verbose_name="Date de complétion")

    class Meta:
        verbose_name = "Progression Vidéo"
        verbose_name_plural = "Progressions Vidéos"
        unique_together = ['student', 'video']

    def __str__(self):
        return f"{self.student.username} - {self.video.title} ({'Terminé' if self.is_completed else 'En cours'})"

class CourseComment(models.Model):
    course = models.ForeignKey(Training, on_delete=models.CASCADE, related_name='comments', verbose_name="Formation")
    user = models.ForeignKey('users.CustomUser', on_delete=models.CASCADE, related_name='course_comments', verbose_name="Utilisateur")
    content = models.TextField(verbose_name="Commentaire")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    parent = models.ForeignKey(
        'self', on_delete=models.CASCADE, null=True, blank=True,
        related_name='replies', verbose_name="Réponse à"
    )

    class Meta:
        verbose_name = "Commentaire"
        verbose_name_plural = "Commentaires"
        ordering = ['-created_at']

    def __str__(self):
        return f"Commentaire de {self.user.username} sur {self.course.title}"


class Conversation(models.Model):
    """A chat thread between a student and a teacher."""
    student = models.ForeignKey(
        'users.CustomUser', on_delete=models.CASCADE,
        related_name='student_conversations', verbose_name="Étudiant"
    )
    teacher = models.ForeignKey(
        'users.CustomUser', on_delete=models.CASCADE,
        related_name='teacher_conversations', verbose_name="Formateur"
    )
    access_expires_at = models.DateTimeField(null=True, blank=True, verbose_name="Accès expire le")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Conversation"
        verbose_name_plural = "Conversations"
        unique_together = [['student', 'teacher']]
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.student.username} ↔ {self.teacher.username}"


class Message(models.Model):
    """A single message in a Conversation."""
    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE,
        related_name='messages', verbose_name="Conversation"
    )
    sender = models.ForeignKey(
        'users.CustomUser', on_delete=models.CASCADE,
        related_name='chat_messages', verbose_name="Expéditeur"
    )
    body = models.TextField(verbose_name="Message")
    sent_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Message"
        verbose_name_plural = "Messages"
        ordering = ['sent_at']

    def __str__(self):
        return f"{self.sender.username}: {self.body[:40]}"


class Book(models.Model):
    title = models.CharField(max_length=255, verbose_name="Titre")
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="books", verbose_name="Catégorie"
    )
    description = models.TextField(verbose_name="Description", blank=True)
    author = models.CharField(max_length=255, blank=True, verbose_name="Auteur")
    price_dzd = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Prix (DZD)")
    discount_percent = models.PositiveSmallIntegerField(default=0, verbose_name="Réduction expert (%)")
    admin_discount_percent = models.PositiveSmallIntegerField(default=0, verbose_name="Réduction admin (%)")
    cover_image = models.ImageField(
        upload_to='book_covers/', null=True, blank=True, verbose_name="Image de couverture"
    )
    book_file = models.FileField(
        upload_to='book_files/', null=True, blank=True, verbose_name="Fichier PDF"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")

    class Meta:
        verbose_name = "Livre"
        verbose_name_plural = "Livres"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.price_dzd} DZD"


class Payment(models.Model):
    """Tracks a Paypart payment session for a course or book purchase."""
    PENDING = 'pending'
    PAID = 'paid'
    FAILED = 'failed'
    CANCELED = 'canceled'
    STATUS_CHOICES = [
        (PENDING, 'En attente'),
        (PAID, 'Payé'),
        (FAILED, 'Échoué'),
        (CANCELED, 'Annulé'),
    ]
    TYPE_COURSE = 'course'
    TYPE_BOOK = 'book'
    TYPE_CONVERSATION = 'conversation'
    TYPE_CHOICES = [
        (TYPE_COURSE, 'Formation'),
        (TYPE_BOOK, 'Livre'),
        (TYPE_CONVERSATION, 'Abonnement Messagerie'),
    ]

    user = models.ForeignKey(
        'users.CustomUser', on_delete=models.CASCADE,
        related_name='payments', verbose_name="Utilisateur"
    )
    item_type = models.CharField(max_length=20, choices=TYPE_CHOICES, verbose_name="Type")
    item_id = models.IntegerField(verbose_name="ID de l'article")
    # Paypart fields
    paypart_invitation_uuid = models.CharField(max_length=255, blank=True, verbose_name="UUID Invitation Paypart")
    redirection_tag = models.CharField(max_length=50, unique=True, null=True, blank=True, verbose_name="Tag de redirection")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=PENDING, verbose_name="Statut")
    amount = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Montant (DZD)")
    # Delivery info
    delivery_wilaya = models.CharField(max_length=100, blank=True, verbose_name="Wilaya")
    delivery_commune = models.CharField(max_length=100, blank=True, verbose_name="Commune")
    delivery_place = models.CharField(max_length=255, blank=True, verbose_name="Adresse")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Mis à jour le")

    class Meta:
        verbose_name = "Paiement"
        verbose_name_plural = "Paiements"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.item_type} #{self.item_id} - {self.status}"


class BookPurchase(models.Model):
    """Tracks confirmed book purchases after successful payment."""
    user = models.ForeignKey(
        'users.CustomUser', on_delete=models.CASCADE,
        related_name='book_purchases', verbose_name="Utilisateur"
    )
    book = models.ForeignKey(
        Book, on_delete=models.CASCADE,
        related_name='purchases', verbose_name="Livre"
    )
    purchased_at = models.DateTimeField(auto_now_add=True, verbose_name="Acheté le")

    class Meta:
        verbose_name = "Achat de Livre"
        verbose_name_plural = "Achats de Livres"
        unique_together = [['user', 'book']]
        ordering = ['-purchased_at']

    def __str__(self):
        return f"{self.user.username} - {self.book.title}"


class Coupon(models.Model):
    """A discount coupon that can be applied at checkout."""
    SCOPE_ALL    = 'all'
    SCOPE_COURSE = 'course'
    SCOPE_BOOK   = 'book'
    SCOPE_CHOICES = [
        (SCOPE_ALL,    'Tous'),
        (SCOPE_COURSE, 'Formations uniquement'),
        (SCOPE_BOOK,   'Livres uniquement'),
    ]

    code            = models.CharField(max_length=50, unique=True, verbose_name="Code promo")
    description     = models.CharField(max_length=255, blank=True, verbose_name="Description")
    discount_percent= models.PositiveSmallIntegerField(verbose_name="Réduction (%)")
    scope           = models.CharField(max_length=10, choices=SCOPE_CHOICES, default=SCOPE_ALL, verbose_name="Applicable à")
    valid_from      = models.DateTimeField(verbose_name="Valide à partir de")
    valid_until     = models.DateTimeField(verbose_name="Valide jusqu'au")
    max_uses        = models.PositiveIntegerField(default=0, verbose_name="Utilisations max (0 = illimité)")
    used_count      = models.PositiveIntegerField(default=0, verbose_name="Nbr utilisations")
    is_active       = models.BooleanField(default=True, verbose_name="Actif")
    created_at      = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Coupon"
        verbose_name_plural = "Coupons"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.code} – {self.discount_percent}% ({self.scope})"

    def is_valid(self, item_type: str = None) -> tuple[bool, str]:
        """Returns (True, '') if coupon is usable, else (False, reason)."""
        from django.utils import timezone
        now = timezone.now()
        if not self.is_active:
            return False, "Ce coupon est inactif."
        if now < self.valid_from:
            return False, "Ce coupon n'est pas encore valide."
        if now > self.valid_until:
            return False, "Ce coupon a expiré."
        if self.max_uses > 0 and self.used_count >= self.max_uses:
            return False, "Ce coupon a atteint sa limite d'utilisations."
        if item_type and self.scope != self.SCOPE_ALL:
            if self.scope != item_type:
                return False, f"Ce coupon n'est pas applicable à ce type d'article."
        return True, ""


class Complaint(models.Model):
    """A complaint filed by a student against a teacher."""
    student = models.ForeignKey(
        'users.CustomUser', on_delete=models.CASCADE,
        related_name='filed_complaints', verbose_name="Étudiant"
    )
    teacher = models.ForeignKey(
        'users.CustomUser', on_delete=models.CASCADE,
        related_name='complaints_received', verbose_name="Formateur"
    )
    reason = models.TextField(verbose_name="Raison de la réclamation")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créée le")
    is_resolved = models.BooleanField(default=False, verbose_name="Résolue")

    class Meta:
        verbose_name = "Réclamation"
        verbose_name_plural = "Réclamations"
        ordering = ['-created_at']

    def __str__(self):
        return f"Réclamation de {self.student.username} contre {self.teacher.username}"
