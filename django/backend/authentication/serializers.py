from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .validators import validate_email_comprehensive

User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, 
        required=True, 
        validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('email', 'username', 'password', 'password2', 'first_name', 'last_name')

    def validate_email(self, value):
        """Validate email exists and is from correct domain"""
        # Check if email already exists
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        
        # Comprehensive validation
        is_valid, error_msg = validate_email_comprehensive(value)
        if not is_valid:
            raise serializers.ValidationError(error_msg)
        
        return value.lower()  # Store emails in lowercase

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({
                "password": "Password fields didn't match."
            })
        
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id', 'email', 'username', 'first_name', 'last_name', 
            'is_admin_user', 'total_points', 'puzzles_completed', 
            'current_streak', 'longest_streak', 'email_verified'
        )
        read_only_fields = (
            'id', 'is_admin_user', 'total_points', 'puzzles_completed', 
            'current_streak', 'longest_streak', 'email_verified'
        )