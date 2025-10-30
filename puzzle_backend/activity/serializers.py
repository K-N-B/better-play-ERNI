# activity/serializers.py
from rest_framework import serializers
from gameplay.models import Submission
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
        return {
            'id': obj.user.id,
            'username': obj.user.username
        }
    
    def get_puzzle_name(self, obj):
        """Convert puzzle_type to proper display name"""
        puzzle_names = {
            'wordle': 'Wordle',
            'sudoku': 'Sudoku',
            'ernigram': 'ERNIgram'
        }
        return puzzle_names.get(obj.puzzle_type, obj.puzzle_type.title())
    
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