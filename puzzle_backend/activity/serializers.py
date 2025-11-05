# activity/serializers.py - FIXED VERSION

from gameplay.models import Submission
from rest_framework import serializers
from users.models import User


class ActivityEventSerializer(serializers.ModelSerializer):
    """Serializer for recent puzzle completions"""

    user = serializers.SerializerMethodField()
    puzzle_name = serializers.SerializerMethodField()
    time_in_minutes = serializers.SerializerMethodField()

    class Meta:
        model = Submission
        fields = ['id', 'user', 'puzzle_name', 'difficulty', 'time_in_minutes', 'created_at']

    def get_user(self, obj):
        return {'id': obj.user.id, 'username': obj.user.username}

    def get_puzzle_name(self, obj):
        """
        ✅ FIX: Derive puzzle_name from content_type instead of puzzle_type field
        """
        # Get the model name from the GenericForeignKey's content_type
        model_name = obj.content_type.model.lower()

        # Map model names to display names
        puzzle_names = {
            'wordlepuzzle': 'Wordle',
            'sudokupuzzle': 'Sudoku',
            'ernigrampuzzle': 'ERNIgram',
        }

        return puzzle_names.get(model_name, model_name.title())

    def get_time_in_minutes(self, obj):
        """Convert milliseconds to MM:SS format"""
        total_seconds = obj.time_taken_ms // 1000
        minutes = total_seconds // 60
        seconds = total_seconds % 60
        return f"{minutes}:{seconds:02d}"


class OnlineUserSerializer(serializers.ModelSerializer):
    """Serializer for users currently online"""

    class Meta:
        model = User
        fields = ['id', 'username']


class ActivityHubResponseSerializer(serializers.Serializer):
    """Combined response for activity hub endpoint"""

    recent_activity = ActivityEventSerializer(many=True)
    online_users = OnlineUserSerializer(many=True)
