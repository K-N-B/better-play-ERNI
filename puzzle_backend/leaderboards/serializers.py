# leaderboards/serializers.py
from rest_framework import serializers
from users.models import Department, User

from .models import (
    DailyDepartmentScore,
    DailyIndividualScore,
    MonthlyDepartmentScore,
    MonthlyIndividualScore,
    WeeklyDepartmentScore,
    WeeklyIndividualScore,
)



# --- Individual Score Serializers ---
class UserBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'profile_picture_url']


class DailyIndividualScoreSerializer(serializers.ModelSerializer):
    user = UserBasicSerializer(read_only=True)

    class Meta:
        model = DailyIndividualScore
        fields = ['user', 'score', 'date']


class WeeklyIndividualScoreSerializer(serializers.ModelSerializer):
    user = UserBasicSerializer(read_only=True)

    class Meta:
        model = WeeklyIndividualScore
        fields = ['user', 'score', 'week_start_date']


class MonthlyIndividualScoreSerializer(serializers.ModelSerializer):
    user = UserBasicSerializer(read_only=True)

    class Meta:
        model = MonthlyIndividualScore
        fields = ['user', 'score', 'month_start_date']


# --- Department Score Serializers ---
class DepartmentBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name']


class DailyDepartmentScoreSerializer(serializers.ModelSerializer):
    department = DepartmentBasicSerializer(read_only=True)

    class Meta:
        model = DailyDepartmentScore
        fields = ['department', 'score', 'date']


class WeeklyDepartmentScoreSerializer(serializers.ModelSerializer):
    department = DepartmentBasicSerializer(read_only=True)

    class Meta:
        model = WeeklyDepartmentScore
        fields = ['department', 'score', 'week_start_date']


class MonthlyDepartmentScoreSerializer(serializers.ModelSerializer):
    department = DepartmentBasicSerializer(read_only=True)

    class Meta:
        model = MonthlyDepartmentScore
        fields = ['department', 'score', 'month_start_date']
