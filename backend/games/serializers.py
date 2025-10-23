from rest_framework import serializers
from .models import Puzzle, UserProgress, Submission, DailyCompletionStatus, Streak, LeaderboardCache, ActivityFeed
from django.contrib.auth import get_user_model

User = get_user_model()


# ============================================
# USER SERIALIZERS
# ============================================
class UserBasicSerializer(serializers.ModelSerializer):
    """Minimal user info for leaderboards/activity feed"""
    class Meta:
        model = User
        fields = ['id', 'username', 'avatar_url']


class UserProfileSerializer(serializers.ModelSerializer):
    """Full user profile for authenticated requests"""
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'display_name',
            'avatar_url', 'total_points_alltime',
            'current_streak_count', 'max_streak_count',
            'last_active', 'created_at'
        ]


# ============================================
# PUZZLE SERIALIZERS
# ============================================
class WordlePuzzleSerializer(serializers.Serializer):
    """Wordle puzzle data (WITHOUT solution)"""
    id = serializers.IntegerField()
    # solution_word is intentionally excluded (security)


class SudokuPuzzleSerializer(serializers.Serializer):
    """Sudoku puzzle data"""
    id = serializers.IntegerField()
    puzzle_string = serializers.CharField()
    difficulty = serializers.CharField()
    # solution_string is intentionally excluded


class ErnigramPuzzleSerializer(serializers.Serializer):
    """ERNIgram puzzle data"""
    id = serializers.IntegerField()
    clue = serializers.CharField()
    # solution_phrase is intentionally excluded


class DailyPuzzleResponseSerializer(serializers.Serializer):
    """
    Response format matching your frontend's DailyPuzzleResponse type.
    Returns puzzles for the selected difficulty.
    """
    date = serializers.DateField()
    wordle = WordlePuzzleSerializer()
    sudoku = SudokuPuzzleSerializer()
    ernigram = ErnigramPuzzleSerializer()


# ============================================
# PROGRESS SERIALIZERS
# ============================================
class UserProgressSerializer(serializers.ModelSerializer):
    """For loading/saving game progress"""
    class Meta:
        model = UserProgress
        fields = [
            'id', 'user_id', 'puzzle_id', 'puzzle_type',
            'progress_data', 'time_spent_ms', 'last_saved'
        ]
        read_only_fields = ['id', 'user_id', 'last_saved']


class SaveProgressSerializer(serializers.Serializer):
    """For the saveProgress API endpoint"""
    puzzle_id = serializers.IntegerField()
    puzzle_type = serializers.ChoiceField(choices=['wordle', 'sudoku', 'ernigram'])
    progress_data = serializers.JSONField()
    time_spent_ms = serializers.IntegerField(min_value=0)


# ============================================
# SUBMISSION SERIALIZERS
# ============================================
class SubmissionSerializer(serializers.ModelSerializer):
    """For submission records"""
    user = UserBasicSerializer(read_only=True)
    
    class Meta:
        model = Submission
        fields = [
            'id', 'user', 'puzzle_id', 'puzzle_type',
            'tries', 'time_taken_ms', 'points_awarded',
            'created_at'
        ]
        read_only_fields = ['id', 'user', 'points_awarded', 'created_at']


class SubmitPuzzleSerializer(serializers.Serializer):
    """For the submitPuzzle API endpoint"""
    puzzle_id = serializers.IntegerField()
    puzzle_type = serializers.ChoiceField(choices=['wordle', 'sudoku', 'ernigram'])
    time_taken_ms = serializers.IntegerField(min_value=0)
    tries = serializers.IntegerField(min_value=1)


class SubmitPuzzleResponseSerializer(serializers.Serializer):
    """Response after submitting a puzzle"""
    score = serializers.IntegerField()


# ============================================
# LEADERBOARD SERIALIZERS
# ============================================
class LeaderboardEntrySerializer(serializers.Serializer):
    """Individual leaderboard entry"""
    user = UserBasicSerializer()
    rank = serializers.IntegerField()
    score = serializers.IntegerField()
    previous_rank = serializers.IntegerField(allow_null=True)


# ============================================
# ACTIVITY FEED SERIALIZERS
# ============================================
class ActivityFeedSerializer(serializers.ModelSerializer):
    """Activity feed entries"""
    user = UserBasicSerializer(read_only=True)
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = ActivityFeed
        fields = [
            'id', 'user', 'event_type', 'puzzle_type',
            'points', 'tries', 'metadata', 'created_at', 'time_ago'
        ]
    
    def get_time_ago(self, obj):
        """Human-readable time ago (e.g., '5 mins ago')"""
        from django.utils.timesince import timesince
        return timesince(obj.created_at) + ' ago'


# ============================================
# DAILY COMPLETION STATUS SERIALIZER
# ============================================
class DailyCompletionStatusSerializer(serializers.ModelSerializer):
    """For tracking daily puzzle completion"""
    class Meta:
        model = DailyCompletionStatus
        fields = [
            'completion_date', 'wordle_completed', 'sudoku_completed',
            'ernigram_completed', 'puzzles_completed_count',
            'points_earned_today'
        ]


# ============================================
# HINTS SERIALIZER
# ============================================
class HintsSerializer(serializers.Serializer):
    """For puzzle hints"""
    hint_1 = serializers.CharField()
    hint_2 = serializers.CharField()
    hint_3 = serializers.CharField()