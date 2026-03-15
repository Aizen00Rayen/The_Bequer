from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, CustomTokenObtainPairView, PendingUsersView,
    ApproveUserView, AllUsersView, DeleteUserView, StatsView, UserMeView,
    TeacherProfileView, PublicTeacherProfileView, TeachersListView
)

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    path('users/', AllUsersView.as_view(), name='all_users'),
    path('users/me/', UserMeView.as_view(), name='user_me'),
    path('users/pending/', PendingUsersView.as_view(), name='pending_users'),
    path('users/<int:pk>/approve/', ApproveUserView.as_view(), name='approve_user'),
    path('users/<int:pk>/delete/', DeleteUserView.as_view(), name='delete_user'),
    
    path('stats/', StatsView.as_view(), name='admin_stats'),

    # Teacher routes
    path('teacher/profile/', TeacherProfileView.as_view(), name='teacher_profile'),
    path('teachers/', TeachersListView.as_view(), name='teachers_list'),
    path('teachers/<int:pk>/', PublicTeacherProfileView.as_view(), name='public_teacher_profile'),
]
