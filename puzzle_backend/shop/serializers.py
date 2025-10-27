from rest_framework import serializers
from users.serializers import UserNestedSerializer
from .models import Reward, ClaimedReward

class RewardSerializer(serializers.ModelSerializer):
    """ Serializer for listing rewards in the shop. """
    class Meta:
        model = Reward
        # Expose fields the frontend needs to display the card
        fields = ['id', 'name', 'description', 'cost', 'image', 'stock']

class ClaimedRewardSerializer(serializers.ModelSerializer):
    """ Serializer for viewing claimed rewards. """
    # Nest minimal user info (who claimed it)
    user = UserNestedSerializer(read_only=True)
    # Nest minimal reward info (what was claimed)
    reward = RewardSerializer(read_only=True)

    class Meta:
        model = ClaimedReward
        # Expose all fields the frontend might want to see
        fields = ['id', 'user', 'reward', 'claimed_at', 'points_spent', 'status']