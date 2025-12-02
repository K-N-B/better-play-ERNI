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
    """Unified serializer for all activity events (submissions + challenges + purchases)"""

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

    # ✅ For shop purchases - use JSONField to accept any structure
    reward = serializers.JSONField(required=False, allow_null=True)
    points_spent = serializers.IntegerField(required=False, allow_null=True)


class OnlineUserSerializer(serializers.ModelSerializer):
    """Serializer for users currently online"""

    class Meta:
        model = User
        fields = ['id', 'username', 'profile_picture_url']


class ActivityHubResponseSerializer(serializers.Serializer):
    """Combined response for activity hub endpoint"""

    recent_activity = ActivityEventSerializer(many=True)
    online_users = OnlineUserSerializer(many=True)
    
    def to_representation(self, instance):
        """Debug serialization"""
        print(f"[ActivityHubResponseSerializer] 🔍 Input instance keys: {instance.keys()}")
        print(f"[ActivityHubResponseSerializer] 🔍 Activity count: {len(instance.get('recent_activity', []))}")
        
        # Check for shop purchases in input
        shop_purchases = [e for e in instance.get('recent_activity', []) if e.get('event_type') == 'shop_purchase']
        print(f"[ActivityHubResponseSerializer] 🛒 Found {len(shop_purchases)} shop purchases in input")
        for purchase in shop_purchases:
            print(f"  - Purchase has reward? {purchase.get('reward')}")
        
        data = super().to_representation(instance)
        
        # Check for shop purchases in output
        serialized_purchases = [e for e in data.get('recent_activity', []) if e.get('event_type') == 'shop_purchase']
        print(f"[ActivityHubResponseSerializer] 🛒 {len(serialized_purchases)} shop purchases in output")
        for purchase in serialized_purchases:
            print(f"  - Serialized purchase has reward? {purchase.get('reward')}")
        
        return data