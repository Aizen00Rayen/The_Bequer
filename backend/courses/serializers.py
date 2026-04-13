from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Training, Category, VideoLesson, Enrollment, VideoProgress, CourseComment, Book, Coupon, Conversation, Message, Complaint

User = get_user_model()

class CategorySerializer(serializers.ModelSerializer):
    subcategories = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'parent', 'subcategories']

    def get_subcategories(self, obj):
        if obj.subcategories.exists():
            return CategorySerializer(obj.subcategories.all(), many=True, context=self.context).data
        return []

class VideoLessonSerializer(serializers.ModelSerializer):
    stream_url = serializers.SerializerMethodField()

    class Meta:
        model = VideoLesson
        fields = ['id', 'title', 'description', 'duration_seconds', 'order', 'course', 'stream_url', 'video_file', 'status', 'is_free_preview']

    def get_stream_url(self, obj):
        request = self.context.get('request')
        if request is None:
            return f"/api/video-lessons/{obj.id}/stream/"
        return request.build_absolute_uri(f"/api/video-lessons/{obj.id}/stream/")

class TrainingSerializer(serializers.ModelSerializer):
    category_details = CategorySerializer(source='category', read_only=True)
    videos = serializers.SerializerMethodField()
    teacher_details = serializers.SerializerMethodField()
    submitted_by_details = serializers.SerializerMethodField()
    discounted_price = serializers.SerializerMethodField()

    class Meta:
        model = Training
        fields = '__all__'

    def get_videos(self, obj):
        request = self.context.get('request')
        user = request.user if request else None
        qs = obj.videos.all()
        if not user or not user.is_authenticated or user.role not in ['admin', 'teacher']:
            # Public users see approved videos; metadata only (stream blocked at view level)
            # is_free_preview videos are also included so the player can render on CourseDetail
            from django.db.models import Q
            qs = qs.filter(Q(status='approved') | Q(is_free_preview=True))
        return VideoLessonSerializer(qs, many=True, context=self.context).data


    def get_teacher_details(self, obj):
        if obj.teacher:
            return {
                'id': obj.teacher.id,
                'name': f"{obj.teacher.first_name} {obj.teacher.last_name}".strip() or obj.teacher.username,
                'username': obj.teacher.username,
            }
        return None

    def get_submitted_by_details(self, obj):
        if obj.submitted_by:
            return {
                'id': obj.submitted_by.id,
                'name': f"{obj.submitted_by.first_name} {obj.submitted_by.last_name}".strip() or obj.submitted_by.username,
                'username': obj.submitted_by.username,
            }
        return None

    def get_discounted_price(self, obj):
        total_discount = min((obj.discount_percent or 0) + (obj.admin_discount_percent or 0), 100)
        if total_discount > 0:
            return round(float(obj.price_dzd) * (1 - total_discount / 100), 2)
        return float(obj.price_dzd)

class UserSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']

class EnrollmentSerializer(serializers.ModelSerializer):
    student_details = UserSimpleSerializer(source='student', read_only=True)
    course_details = TrainingSerializer(source='course', read_only=True)

    class Meta:
        model = Enrollment
        fields = '__all__'
        read_only_fields = ['student', 'enrolled_at']

class VideoProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoProgress
        fields = ['id', 'student', 'video', 'is_completed', 'completed_at']
        read_only_fields = ['student', 'completed_at']

class CourseCommentReplySerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = CourseComment
        fields = ['id', 'user', 'user_name', 'course', 'content', 'created_at', 'parent']
        read_only_fields = ['user', 'created_at']

class CourseCommentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    replies = CourseCommentReplySerializer(many=True, read_only=True)

    class Meta:
        model = CourseComment
        fields = ['id', 'user', 'user_name', 'course', 'content', 'created_at', 'parent', 'replies']
        read_only_fields = ['user', 'created_at']


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    sender_username = serializers.CharField(source='sender.username', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'sender_name', 'sender_username', 'body', 'sent_at', 'is_read']
        read_only_fields = ['sender', 'sent_at', 'conversation']

    def get_sender_name(self, obj):
        return f"{obj.sender.first_name} {obj.sender.last_name}".strip() or obj.sender.username


class ConversationSerializer(serializers.ModelSerializer):
    student_details = serializers.SerializerMethodField()
    teacher_details = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'student', 'teacher', 'student_details', 'teacher_details',
                  'last_message', 'unread_count', 'access_expires_at', 'created_at', 'updated_at']
        read_only_fields = ['access_expires_at', 'created_at', 'updated_at']

    def get_student_details(self, obj):
        u = obj.student
        return {
            'id': u.id, 'username': u.username,
            'name': f"{u.first_name} {u.last_name}".strip() or u.username,
        }

    def get_teacher_details(self, obj):
        u = obj.teacher
        return {
            'id': u.id, 'username': u.username,
            'name': f"{u.first_name} {u.last_name}".strip() or u.username,
        }

    def get_last_message(self, obj):
        msg = obj.messages.order_by('-sent_at').first()
        if msg:
            return {'body': msg.body, 'sent_at': msg.sent_at, 'sender_id': msg.sender_id}
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
        return 0


class ComplaintSerializer(serializers.ModelSerializer):
    student_details = serializers.SerializerMethodField()
    teacher_details = serializers.SerializerMethodField()

    class Meta:
        model = Complaint
        fields = ['id', 'student', 'teacher', 'student_details', 'teacher_details', 'reason', 'created_at', 'is_resolved']
        read_only_fields = ['student', 'created_at']

    def get_student_details(self, obj):
        u = obj.student
        return {'id': u.id, 'username': u.username, 'name': f"{u.first_name} {u.last_name}".strip() or u.username}

    def get_teacher_details(self, obj):
        u = obj.teacher
        return {'id': u.id, 'username': u.username, 'name': f"{u.first_name} {u.last_name}".strip() or u.username}


class BookSerializer(serializers.ModelSerializer):
    category_details = CategorySerializer(source='category', read_only=True)
    discounted_price = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = ['id', 'title', 'category', 'category_details', 'description', 'author',
                  'price_dzd', 'discount_percent', 'admin_discount_percent', 'discounted_price', 'cover_image', 'book_file', 'created_at']
        read_only_fields = ['created_at']

    def get_discounted_price(self, obj):
        total_discount = min((obj.discount_percent or 0) + (obj.admin_discount_percent or 0), 100)
        if total_discount > 0:
            return round(float(obj.price_dzd) * (1 - total_discount / 100), 2)
        return float(obj.price_dzd)


class CouponSerializer(serializers.ModelSerializer):
    is_expired = serializers.SerializerMethodField()
    uses_left = serializers.SerializerMethodField()

    class Meta:
        model = Coupon
        fields = ['id', 'code', 'description', 'discount_percent', 'scope',
                  'valid_from', 'valid_until', 'max_uses', 'used_count',
                  'is_active', 'created_at', 'is_expired', 'uses_left']
        read_only_fields = ['used_count', 'created_at']

    def get_is_expired(self, obj):
        from django.utils import timezone
        return timezone.now() > obj.valid_until

    def get_uses_left(self, obj):
        if obj.max_uses == 0:
            return None  # unlimited
        return max(0, obj.max_uses - obj.used_count)



