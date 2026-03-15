from django.db import models
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.http import StreamingHttpResponse, Http404, HttpResponse
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import get_user_model
import os
import re
import mimetypes
from io import BytesIO
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.pdfgen import canvas as rl_canvas
from django.utils import timezone
from datetime import timedelta
from .models import Training, Category, VideoLesson, Enrollment, VideoProgress, CourseComment, Conversation, Message, Book, Complaint
from .serializers import (
    CategorySerializer, TrainingSerializer, VideoLessonSerializer, EnrollmentSerializer,
    VideoProgressSerializer, CourseCommentSerializer, CourseCommentReplySerializer, BookSerializer, CouponSerializer, ConversationSerializer, MessageSerializer, ComplaintSerializer
)

User = get_user_model()
range_re = re.compile(r'bytes\s*=\s*(\d+)\s*-\s*(\d*)', re.I)

def file_iterator(file_path, chunk_size=8192, offset=0, length=None):
    with open(file_path, "rb") as f:
        f.seek(offset, os.SEEK_SET)
        remaining = length
        while True:
            bytes_length = chunk_size if remaining is None else min(remaining, chunk_size)
            data = f.read(bytes_length)
            if not data:
                break
            if remaining:
                remaining -= len(data)
            yield data

@api_view(['GET'])
def stream_video(request, pk):
    token = request.GET.get('token')
    if not token:
        return Response({"error": "Token missing"}, status=401)
        
    try:
        access_token = AccessToken(token)
        user = User.objects.get(id=access_token['user_id'])
        if not (user.is_active and user.is_approved):
             return Response({"error": "Unauthorized user"}, status=401)
    except (TokenError, User.DoesNotExist):
        return Response({"error": "Invalid token"}, status=401)

    try:
        video = VideoLesson.objects.get(pk=pk)
    except VideoLesson.DoesNotExist:
        raise Http404

    path = video.video_file.path
    if not os.path.exists(path):
        raise Http404

    range_header = request.META.get('HTTP_RANGE', '').strip()
    range_match = range_re.match(range_header)
    size = os.path.getsize(path)
    content_type, encoding = mimetypes.guess_type(path)
    content_type = content_type or 'application/octet-stream'

    if range_match:
        first_byte, last_byte = range_match.groups()
        first_byte = int(first_byte) if first_byte else 0
        last_byte = int(last_byte) if last_byte else size - 1
        if last_byte >= size:
            last_byte = size - 1
        length = last_byte - first_byte + 1
        resp = StreamingHttpResponse(file_iterator(path, offset=first_byte, length=length), status=206, content_type=content_type)
        resp['Content-Length'] = str(length)
        resp['Content-Range'] = 'bytes %s-%s/%s' % (first_byte, last_byte, size)
    else:
        resp = StreamingHttpResponse(file_iterator(path), content_type=content_type)
        resp['Content-Length'] = str(size)

    resp['Accept-Ranges'] = 'bytes'
    return resp

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and request.user.role == 'admin')

class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    
    def get_queryset(self):
        # For list: only return root categories (subcategories are nested inside)
        # For detail actions (retrieve/update/destroy): return all so subcategories can be found by ID
        if self.action == 'list':
            return Category.objects.filter(parent__isnull=True)
        return Category.objects.all()

class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'admin')

class IsTeacherOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ('admin', 'teacher'))

class VideoLessonViewSet(viewsets.ModelViewSet):
    queryset = VideoLesson.objects.all()
    serializer_class = VideoLessonSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        user = self.request.user
        if user.is_authenticated and user.role in ('admin', 'teacher'):
            return [permissions.IsAuthenticated()]
        return [IsAdminOrReadOnly()]

    def get_queryset(self):
        queryset = VideoLesson.objects.all()
        course_id = self.request.query_params.get('course_id', None)
        if course_id is not None:
            queryset = queryset.filter(course_id=course_id)
        return queryset

    @action(detail=False, methods=['post'])
    def reorder(self, request):
        updates = request.data.get('updates', [])
        for item in updates:
            video_id = item.get('id')
            new_order = item.get('order')
            if video_id is not None and new_order is not None:
                VideoLesson.objects.filter(id=video_id).update(order=new_order)
        return Response({"status": "success"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def approve(self, request, pk=None):
        if request.user.role != 'admin':
            return Response({'detail': 'Admin only.'}, status=status.HTTP_403_FORBIDDEN)
        video = self.get_object()
        video.status = 'approved'
        video.save()
        return Response(VideoLessonSerializer(video).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def reject(self, request, pk=None):
        if request.user.role != 'admin':
            return Response({'detail': 'Admin only.'}, status=status.HTTP_403_FORBIDDEN)
        video = self.get_object()
        video.status = 'rejected'
        video.save()
        return Response(VideoLessonSerializer(video).data)

class TrainingViewSet(viewsets.ModelViewSet):
    serializer_class = TrainingSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [permissions.AllowAny()]
        user = self.request.user
        if user.is_authenticated and user.role == 'admin':
            return [permissions.IsAuthenticated()]
        if user.is_authenticated and user.role == 'teacher':
            return [permissions.IsAuthenticated()]
        return [IsAdminOrReadOnly()]

    def get_queryset(self):
        user = self.request.user
        # Admin sees everything
        if user.is_authenticated and user.role == 'admin':
            queryset = Training.objects.all()
        # Teacher sees own submissions + all approved
        elif user.is_authenticated and user.role == 'teacher':
            queryset = Training.objects.filter(
                models.Q(status=Training.STATUS_APPROVED) | models.Q(submitted_by=user)
            )
        else:
            # Public: only approved courses
            queryset = Training.objects.filter(status=Training.STATUS_APPROVED)

        category_id = self.request.query_params.get('category_id', None)
        if category_id is not None:
            try:
                category = Category.objects.get(id=category_id)

                def get_descendant_ids(cat):
                    res = [cat.id]
                    for child in cat.subcategories.all():
                        res.extend(get_descendant_ids(child))
                    return res

                all_ids = get_descendant_ids(category)
                queryset = queryset.filter(category_id__in=all_ids)
            except Category.DoesNotExist:
                queryset = queryset.none()

        # Filter by status (for admin review)
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'teacher':
            serializer.save(
                submitted_by=user,
                teacher=user,
                status=Training.STATUS_PENDING,
                submitted_at=timezone.now()
            )
        else:
            serializer.save(status=Training.STATUS_APPROVED)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def approve(self, request, pk=None):
        if request.user.role != 'admin':
            return Response({'detail': 'Admin only.'}, status=status.HTTP_403_FORBIDDEN)
        course = self.get_object()
        course.status = Training.STATUS_APPROVED
        course.rejection_reason = ''
        course.reviewed_at = timezone.now()
        course.save()
        return Response(TrainingSerializer(course, context={'request': request}).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def reject(self, request, pk=None):
        if request.user.role != 'admin':
            return Response({'detail': 'Admin only.'}, status=status.HTTP_403_FORBIDDEN)
        course = self.get_object()
        course.status = Training.STATUS_REJECTED
        course.rejection_reason = request.data.get('reason', '')
        course.reviewed_at = timezone.now()
        course.save()
        return Response(TrainingSerializer(course, context={'request': request}).data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_courses(self, request):
        """Teacher's own submitted courses."""
        courses = Training.objects.filter(submitted_by=request.user)
        return Response(TrainingSerializer(courses, many=True, context={'request': request}).data)


class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'mine']:
            return [permissions.IsAuthenticated()]
        return [IsAdminOrReadOnly()]

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)

    @action(detail=False, methods=['get'])
    def mine(self, request):
        enrollments = Enrollment.objects.filter(student=request.user)
        serializer = self.get_serializer(enrollments, many=True)
        return Response(serializer.data)

class VideoProgressViewSet(viewsets.ModelViewSet):
    queryset = VideoProgress.objects.all()
    serializer_class = VideoProgressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return VideoProgress.objects.filter(student=self.request.user)

    @action(detail=False, methods=['post'])
    def toggle(self, request):
        video_id = request.data.get('video_id')
        if not video_id:
            return Response({"error": "video_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            video = VideoLesson.objects.get(id=video_id)
        except VideoLesson.DoesNotExist:
            return Response({"error": "Video not found"}, status=status.HTTP_404_NOT_FOUND)

        progress, created = VideoProgress.objects.get_or_create(student=request.user, video=video)
        progress.is_completed = not progress.is_completed
        progress.save()

        return Response({"status": "success", "is_completed": progress.is_completed})

class CourseCommentViewSet(viewsets.ModelViewSet):
    queryset = CourseComment.objects.all()
    serializer_class = CourseCommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = CourseComment.objects.filter(parent__isnull=True)  # Only top-level comments
        course_id = self.request.query_params.get('course_id')
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ConversationViewSet(viewsets.ModelViewSet):
    """Messenger-style conversations between students and teachers."""
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Conversation.objects.all()
        return Conversation.objects.filter(
            models.Q(student=user) | models.Q(teacher=user)
        )

    def create(self, request, *args, **kwargs):
        teacher_id = request.data.get('teacher_id')
        if not teacher_id:
            return Response({'error': 'teacher_id required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            teacher = User.objects.get(id=teacher_id, role='teacher')
        except User.DoesNotExist:
            return Response({'error': 'Teacher not found'}, status=status.HTTP_404_NOT_FOUND)

        conv, created = Conversation.objects.get_or_create(
            student=request.user, teacher=teacher
        )
        if created:
            conv.access_expires_at = timezone.now() + timedelta(days=30)
            conv.save()
        return Response(ConversationSerializer(conv, context={'request': request}).data,
                        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Get all messages in a conversation and mark received ones as read."""
        conv = self.get_object()
        # Mark messages from the other party as read
        conv.messages.exclude(sender=request.user).filter(is_read=False).update(is_read=True)
        msgs = conv.messages.all()
        return Response(MessageSerializer(msgs, many=True, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        """Send a message in the conversation."""
        conv = self.get_object()
        
        # Check expiration
        if conv.access_expires_at and timezone.now() > conv.access_expires_at:
            return Response({'error': 'L\'accès à cette conversation a expiré.'}, status=status.HTTP_403_FORBIDDEN)
            
        body = request.data.get('body', '').strip()
        if not body:
            return Response({'error': 'Message cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)
        msg = Message.objects.create(conversation=conv, sender=request.user, body=body)
        # Touch the conversation timestamp
        conv.save()
        return Response(MessageSerializer(msg, context={'request': request}).data, status=status.HTTP_201_CREATED)


class ComplaintViewSet(viewsets.ModelViewSet):
    """Students can complain to admins about unresponsive teachers."""
    serializer_class = ComplaintSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Complaint.objects.all()
        return Complaint.objects.filter(student=user)

    def create(self, request, *args, **kwargs):
        teacher_id = request.data.get('teacher_id')
        reason = request.data.get('reason', '').strip()
        
        if not teacher_id or not reason:
            return Response({'error': 'teacher_id and reason are required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            teacher = User.objects.get(id=teacher_id, role='teacher')
        except User.DoesNotExist:
            return Response({'error': 'Teacher not found'}, status=status.HTTP_404_NOT_FOUND)
            
        complaint = Complaint.objects.create(
            student=request.user,
            teacher=teacher,
            reason=reason
        )
        return Response(ComplaintSerializer(complaint).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Admin marks complaint as resolved."""
        if request.user.role != 'admin':
            return Response({'error': 'Admin only'}, status=status.HTTP_403_FORBIDDEN)
            
        complaint = self.get_object()
        complaint.is_resolved = True
        complaint.save()
        return Response(ComplaintSerializer(complaint).data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def generate_certificate(request, course_id):
    user = request.user

    # Check enrollment exists and is approved
    try:
        enrollment = Enrollment.objects.get(student=user, course_id=course_id, is_approved=True)
    except Enrollment.DoesNotExist:
        return Response({"error": "Non inscrit ou non approuvé."}, status=403)

    course = enrollment.course
    videos = course.videos.all()

    if videos.count() == 0:
        return Response({"error": "Aucune vidéo dans ce cours."}, status=400)

    completed = VideoProgress.objects.filter(
        student=user, video__course=course, is_completed=True
    ).count()

    if completed < videos.count():
        return Response({"error": "Formation non terminée."}, status=400)

    # Generate PDF
    buffer = BytesIO()
    page_width, page_height = landscape(A4)

    def draw_certificate(c):
        w, h = page_width, page_height

        # Background
        c.setFillColor(colors.HexColor("#0a0a0a"))
        c.rect(0, 0, w, h, fill=True, stroke=False)

        # Gold outer border
        c.setStrokeColor(colors.HexColor("#D4AF37"))
        c.setLineWidth(4)
        c.rect(1*cm, 1*cm, w - 2*cm, h - 2*cm, fill=False, stroke=True)

        # Inner thin border
        c.setLineWidth(1)
        c.rect(1.4*cm, 1.4*cm, w - 2.8*cm, h - 2.8*cm, fill=False, stroke=True)

        # Title
        c.setFont("Helvetica-Bold", 32)
        c.setFillColor(colors.HexColor("#D4AF37"))
        c.drawCentredString(w / 2, h - 4.5*cm, "CERTIFICAT DE REUSSITE")

        # Subtitle
        c.setFillColor(colors.HexColor("#888888"))
        c.setFont("Helvetica", 13)
        c.drawCentredString(w / 2, h - 5.8*cm, "Ce certificat est decerne a")

        # Student Name
        full_name = f"{user.first_name} {user.last_name}".strip() or user.username
        c.setFont("Helvetica-Bold", 28)
        c.setFillColor(colors.white)
        c.drawCentredString(w / 2, h - 7.5*cm, full_name)

        # Underline name
        name_width = c.stringWidth(full_name, "Helvetica-Bold", 28)
        c.setStrokeColor(colors.HexColor("#D4AF37"))
        c.setLineWidth(1)
        c.line((w - name_width) / 2, h - 7.8*cm, (w + name_width) / 2, h - 7.8*cm)

        # Completion text
        c.setFillColor(colors.HexColor("#aaaaaa"))
        c.setFont("Helvetica", 13)
        c.drawCentredString(w / 2, h - 9.2*cm, "pour avoir complete avec succes la formation")

        # Course Name
        c.setFont("Helvetica-Bold", 20)
        c.setFillColor(colors.HexColor("#D4AF37"))
        c.drawCentredString(w / 2, h - 10.7*cm, course.title)

        # Date
        from datetime import date
        date_str = date.today().strftime("%d/%m/%Y")
        c.setFont("Helvetica", 11)
        c.setFillColor(colors.HexColor("#888888"))
        c.drawCentredString(w / 2, h - 12.5*cm, f"Delivre le {date_str}  -  Bequer Academy")

        # Decorative bottom line
        c.setStrokeColor(colors.HexColor("#D4AF37"))
        c.setLineWidth(0.8)
        c.line(3*cm, 3.2*cm, w - 3*cm, 3.2*cm)

    c_obj = rl_canvas.Canvas(buffer, pagesize=landscape(A4))
    draw_certificate(c_obj)
    c_obj.save()

    buffer.seek(0)
    response = HttpResponse(buffer, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="certificat_{course_id}.pdf"'
    return response


class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        queryset = Book.objects.all()
        category_id = self.request.query_params.get('category_id', None)
        if category_id is not None:
            try:
                category = Category.objects.get(id=category_id)

                def get_descendant_ids(cat):
                    res = [cat.id]
                    for child in cat.subcategories.all():
                        res.extend(get_descendant_ids(child))
                    return res

                all_ids = get_descendant_ids(category)
                queryset = queryset.filter(category_id__in=all_ids)
            except Category.DoesNotExist:
                queryset = queryset.none()
        return queryset
