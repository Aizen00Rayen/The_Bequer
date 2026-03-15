from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import CustomUser, TeacherProfile
from brand.models import BrandRequest
from courses.models import Training
from courses.serializers import TrainingSerializer
from .serializers import RegisterSerializer, CustomTokenObtainPairSerializer, UserSerializer, TeacherProfileSerializer

class UserMeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return self.request.user

class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class PendingUsersView(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = UserSerializer

    def get_queryset(self):
        return CustomUser.objects.filter(is_approved=False).exclude(role='admin')

class ApproveUserView(generics.UpdateAPIView):
    permission_classes = (IsAuthenticated,)
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer

    def update(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
        
        user = self.get_object()
        user.is_approved = True
        user.save()
        return Response({"status": "User approved", "user_id": user.id})

class AllUsersView(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = UserSerializer

    def get_queryset(self):
        if self.request.user.role == 'admin':
            return CustomUser.objects.exclude(id=self.request.user.id)
        return CustomUser.objects.none()

class DeleteUserView(generics.DestroyAPIView):
    permission_classes = (IsAuthenticated,)
    queryset = CustomUser.objects.all()

    def destroy(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            instance = self.get_object()
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            # Renvoyer l'erreur en format JSON si la base de données bloque la suppression
            return Response({"detail": f"Erreur de suppression : {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class StatsView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        if request.user.role != 'admin':
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
        
        return Response({
            "total_users": CustomUser.objects.exclude(role='admin').count(),
            "pending_users": CustomUser.objects.filter(is_approved=False).exclude(role='admin').count(),
            "total_courses": Training.objects.count(),
            "brand_requests": BrandRequest.objects.count()
        })


class TeacherProfileView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        if request.user.role != 'teacher':
            return Response({'detail': 'Not a teacher.'}, status=status.HTTP_403_FORBIDDEN)
        profile, _ = TeacherProfile.objects.get_or_create(user=request.user)
        serializer = TeacherProfileSerializer(profile, context={'request': request})
        return Response(serializer.data)

    def patch(self, request):
        if request.user.role != 'teacher':
            return Response({'detail': 'Not a teacher.'}, status=status.HTTP_403_FORBIDDEN)
        profile, _ = TeacherProfile.objects.get_or_create(user=request.user)
        serializer = TeacherProfileSerializer(
            profile, data=request.data,
            partial=True, context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            # Also update first_name / last_name on the user if provided
            user = request.user
            changed = False
            for field in ('first_name', 'last_name'):
                if field in request.data:
                    setattr(user, field, request.data[field])
                    changed = True
            if changed:
                user.save(update_fields=['first_name', 'last_name'])
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PublicTeacherProfileView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request, pk):
        try:
            teacher = CustomUser.objects.get(pk=pk, role='teacher')
        except CustomUser.DoesNotExist:
            return Response({'detail': 'Teacher not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        profile, _ = TeacherProfile.objects.get_or_create(user=teacher)
        profile_data = TeacherProfileSerializer(profile, context={'request': request}).data
        courses = Training.objects.all()
        courses_data = TrainingSerializer(courses, many=True, context={'request': request}).data
        return Response({
            'profile': profile_data,
            'courses': courses_data,
        })


class TeachersListView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request):
        teachers = CustomUser.objects.filter(role='teacher', is_approved=True)
        result = []
        for t in teachers:
            profile, _ = TeacherProfile.objects.get_or_create(user=t)
            result.append(TeacherProfileSerializer(profile, context={'request': request}).data)
        return Response(result)
