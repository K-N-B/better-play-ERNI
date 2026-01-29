# /users/serializers.py
from rest_framework import serializers

from .models import Department, User  # Import your models


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ["id", "name", "total_points_alltime"]


class AssignDepartmentSerializer(serializers.Serializer):
    department_name = serializers.CharField(max_length=100)

    def validate_department_name(self, value):
        """Make sure the department name exists (or create it if new)."""
        if not value.strip():
            raise serializers.ValidationError("Department name cannot be blank.")
        return value

    def save(self, user):
        """Assigns a department to the user."""
        department_name = self.validated_data["department_name"]

        # Check if department already exists, otherwise create it
        department, created = Department.objects.get_or_create(name=department_name)

        # Assign department to user
        user.department = department
        user.profile_complete = True  # optional, if you use it for tracking
        user.save()

        return user


class UserNestedSerializer(serializers.ModelSerializer):
    """
    A minimal serializer for nesting inside other models.
    Only exposes essential user info.
    """

    class Meta:
        model = User
        fields = ["id", "username"]  # Only include id and userna


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for the custom User model (profile view)."""

    # Nest the Department details using its serializer
    department = DepartmentSerializer(read_only=True)

    class Meta:
        model = User
        # Define the fields to include for the user profile API response
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "department",  # Will be a nested object like {"id": 1, "name": "Engineering"} or null
            "profile_complete",
            "is_admin",  # Include the admin flag
            "total_points_alltime",
            "current_points",
            "current_streak_count",
            "max_streak_count",
            "challenges_made_count",
            "profile_picture_url",
            "email_notifications",
        ]
        read_only_fields = [
            "department",
            "total_points_alltime",
            "current_streak_count",
            "max_streak_count",
            "challenges_made_count",
            "profile_picture_url",
        ]
