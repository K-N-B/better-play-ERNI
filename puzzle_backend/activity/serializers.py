# activity/serializers.py 
from gameplay.models import Submission, Challenge
from rest_framework import serializers
from users.models import User


class UserBriefSerializer(serializers.ModelSerializer):
    """Serializer for user info in activity events"""
    class Meta:
        model = User
        fields = ['id', 'username', 'profile_picture_url']


class ActivityEventSerializer(serializers.Serializer):
    """Unified serializer for all activity events (submissions + challenges)"""
    
    # ✅ FIX: Change from IntegerField to CharField to support "sub_123" format
    id = serializers.CharField()
    event_type = serializers.CharField()
    created_at = serializers.DateTimeField()
    
    # For submissions
    user = UserBriefSerializer(required=False, allow_null=True)
    puzzle_name = serializers.CharField(required=False, allow_null=True)
    difficulty = serializers.CharField(required=False, allow_null=True)
    time_in_minutes = serializers.CharField(required=False, allow_null=True)
    
    # For challenges
    challenger = UserBriefSerializer(required=False, allow_null=True)
    recipient = UserBriefSerializer(required=False, allow_null=True)
    status = serializers.CharField(required=False, allow_null=True)
    winner = UserBriefSerializer(required=False, allow_null=True)


class OnlineUserSerializer(serializers.ModelSerializer):
    """Serializer for users currently online"""

    class Meta:
        model = User
        fields = ['id', 'username', 'profile_picture_url']


class ActivityHubResponseSerializer(serializers.Serializer):
    """Combined response for activity hub endpoint"""

    recent_activity = ActivityEventSerializer(many=True)
    online_users = OnlineUserSerializer(many=True)