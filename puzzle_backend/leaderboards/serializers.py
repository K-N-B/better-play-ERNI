# /leaderboards/serializers.py
from rest_framework import serializers
from .models import (
    DailyIndividualScore, WeeklyIndividualScore, MonthlyIndividualScore,
    DailyDepartmentScore, WeeklyDepartmentScore, MonthlyDepartmentScore
)
# Import serializers for nested User/Department data
from users.serializers import UserProfileSerializer, DepartmentSerializer

# --- Individual Score Serializers ---

class DailyIndividualScoreSerializer(serializers.ModelSerializer):
    # Nest minimal user info (can adjust fields as needed)
    user = UserProfileSerializer(read_only=True, fields=('id', 'username'))

    class Meta:
        model = DailyIndividualScore
        fields = ['user', 'score', 'date']

class WeeklyIndividualScoreSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer(read_only=True, fields=('id', 'username'))
 
    class Meta:
        model = WeeklyIndividualScore
        fields = ['user', 'score', 'week_start_date']

class MonthlyIndividualScoreSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer(read_only=True, fields=('id', 'username'))

    class Meta:
        model = MonthlyIndividualScore
        fields = ['user', 'score', 'month_start_date']

# --- Department Score Serializers ---

class DailyDepartmentScoreSerializer(serializers.ModelSerializer):
    # Nest minimal department info
    department = DepartmentSerializer(read_only=True)

    class Meta:
        model = DailyDepartmentScore
        fields = ['department', 'score', 'date']

class WeeklyDepartmentScoreSerializer(serializers.ModelSerializer):
    department = DepartmentSerializer(read_only=True)

    class Meta:
        model = WeeklyDepartmentScore
        fields = ['department', 'score', 'week_start_date']

class MonthlyDepartmentScoreSerializer(serializers.ModelSerializer):
    department = DepartmentSerializer(read_only=True)

    class Meta:
        model = MonthlyDepartmentScore
        fields = ['department', 'score', 'month_start_date']


# --- Serializer for All-Time Scores (from User/Department models) ---
# We already have UserProfileSerializer, let's make one for Department All-Time

class DepartmentAllTimeSerializer(serializers.ModelSerializer):
     class Meta:
         model = Department
         fields = ['id', 'name', 'total_points_alltime']
         # Rename field in output if desired
         # extra_kwargs = {'total_points_alltime': {'source': 'score'}}

# We might need a simpler User serializer just for the all-time list
class UserAllTimeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'total_points_alltime']
         # extra_kwargs = {'total_points_alltime': {'source': 'score'}}