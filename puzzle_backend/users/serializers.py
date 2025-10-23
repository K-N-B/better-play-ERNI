# /users/serializers.py
from rest_framework import serializers
from .models import User, Department # Import your models

class DepartmentSerializer(serializers.ModelSerializer):
    """ Serializer for the Department model. """
    class Meta:
        model = Department
        fields = ['id', 'name'] # Specify fields to include in JSON

class UserProfileSerializer(serializers.ModelSerializer):
    """ Serializer for the custom User model (profile view). """
    # Nest the Department details using its serializer
    department = DepartmentSerializer(read_only=True)

    class Meta:
        model = User
        # Define the fields to include for the user profile API response
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'department', # Will be a nested object like {"id": 1, "name": "Engineering"} or null
            'profile_complete',
            'is_admin', # Include the admin flag
            'total_points_alltime',
            'current_streak_count',
            'max_streak_count',
            'challenges_made_count',
        ]
        read_only_fields = ['department'] # Department is set via separate endpoint