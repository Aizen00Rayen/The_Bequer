from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TrainingViewSet, CategoryViewSet, VideoLessonViewSet,
    stream_video, EnrollmentViewSet, VideoProgressViewSet, CourseCommentViewSet,
    generate_certificate, ConversationViewSet, BookViewSet, ComplaintViewSet
)
from .payment_views import (
    initiate_payment, verify_payment, my_purchased_books,
    admin_payments, validate_coupon, coupon_list_create, coupon_detail
)

router = DefaultRouter()
router.register(r'courses', TrainingViewSet, basename='course')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'video-lessons', VideoLessonViewSet)
router.register(r'enrollments', EnrollmentViewSet)
router.register(r'video-progress', VideoProgressViewSet, basename='video-progress')
router.register(r'comments', CourseCommentViewSet)
router.register(r'conversations', ConversationViewSet, basename='conversations')
router.register(r'books', BookViewSet, basename='book')
router.register(r'complaints', ComplaintViewSet, basename='complaint')

urlpatterns = [
    path('', include(router.urls)),
    path('video-lessons/<int:pk>/stream/', stream_video, name='stream-video'),
    path('courses/<int:course_id>/certificate/', generate_certificate, name='generate-certificate'),
    path('payment/initiate/', initiate_payment, name='payment-initiate'),
    path('payment/verify/', verify_payment, name='payment-verify'),
    path('payment/my-books/', my_purchased_books, name='my-purchased-books'),
    path('payment/admin-payments/', admin_payments, name='admin-payments'),
    path('payment/validate-coupon/', validate_coupon, name='validate-coupon'),
    path('payment/coupons/', coupon_list_create, name='coupon-list-create'),
    path('payment/coupons/<int:pk>/', coupon_detail, name='coupon-detail'),
]

