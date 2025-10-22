# games/serializers.py
from rest_framework import serializers
from .models import DailyPuzzle, UserPuzzleAttempt, UserDailyProgress, UserStreak, Leaderboard


class DailyPuzzleSerializer(serializers.ModelSerializer):
    """Serializer for DailyPuzzle - hides the answer"""
    theme = serializers.SerializerMethodField()
    
    class Meta:
        model = DailyPuzzle
        fields = ['id', 'date', 'game_type', 'difficulty', 'theme']
    
    def get_theme(self, obj):
        return obj.puzzle_data.get('theme', 'General')


class UserPuzzleAttemptSerializer(serializers.ModelSerializer):
    puzzle_info = DailyPuzzleSerializer(source='puzzle', read_only=True)
    
    class Meta:
        model = UserPuzzleAttempt
        fields = [
            'id', 'puzzle_info', 'started_at', 'completed_at',
            'time_taken_seconds', 'base_score', 'hints_used',
            'hint_penalties', 'final_score', 'is_completed', 'is_successful'
        ]


class LeaderboardSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username')
    display_name = serializers.CharField(source='user.display_name', default='')
    is_current_user = serializers.SerializerMethodField()

    class Meta:
        model = Leaderboard
        fields = [
            'rank',
            'username',
            'display_name',
            'total_points',
            'puzzles_completed',
            'is_current_user'
        ]

    def get_is_current_user(self, obj):
        request = self.context.get('request')
        if not request or not hasattr(request, 'user'):
            return False
        return obj.user == request.user

class UserProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserDailyProgress
        fields = ['date', 'puzzles_completed', 'total_daily_score', 'is_complete']


class UserStreakSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserStreak
        fields = ['current_streak', 'longest_streak', 'last_completion_date']