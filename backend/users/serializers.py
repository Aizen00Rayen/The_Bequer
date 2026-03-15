from rest_framework import serializers
from .models import CustomUser, TeacherProfile
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'role', 'is_approved', 'date_joined')
        read_only_fields = ('is_approved',)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])

    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'password', 'role')

    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data.get('role', 'student'),
            is_approved=False
        )
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['is_approved'] = user.is_approved
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        if not self.user.is_approved and self.user.role != 'admin':
            raise serializers.ValidationError('Your account is pending admin approval.')

        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'role': self.user.role,
            'is_approved': self.user.is_approved
        }
        return data


class TeacherProfileSerializer(serializers.ModelSerializer):
    # Read-only user info — sourced from the related user object
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)

    # Writable user fields — handled separately in the view but included for
    # display purposes; we mark allow_blank so they never fail validation.
    first_name = serializers.CharField(required=False, allow_blank=True, write_only=False, default='')
    last_name = serializers.CharField(required=False, allow_blank=True, write_only=False, default='')

    # URLFields with lax validation so http:// is not strictly required
    linkedin = serializers.CharField(required=False, allow_blank=True, default='')
    website = serializers.CharField(required=False, allow_blank=True, default='')

    class Meta:
        model = TeacherProfile
        fields = [
            'id', 'user_id', 'username', 'email',
            'first_name', 'last_name',
            'photo', 'bio', 'speciality',
            'linkedin', 'website', 'phone'
        ]

    def to_representation(self, instance):
        """Inject first_name and last_name from the related User on read."""
        data = super().to_representation(instance)
        data['first_name'] = instance.user.first_name
        data['last_name'] = instance.user.last_name
        # Return absolute URL for photo
        request = self.context.get('request')
        if data.get('photo') and request:
            data['photo'] = request.build_absolute_uri(instance.photo.url) if instance.photo else None
        return data

    def update(self, instance, validated_data):
        # Pop user-level fields so they don't hit TeacherProfile.save()
        validated_data.pop('first_name', None)
        validated_data.pop('last_name', None)
        return super().update(instance, validated_data)
