# gameplay/serializers.py
from rest_framework import serializers

from .models import PuzzleAttempt, Submission


class PuzzleAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = PuzzleAttempt
        fields = [
            'id',
            'user',
            'puzzle_type',
            'puzzle_id',
            'progress_data',
            'time_spent_ms',
            'completed',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']


class SubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Submission
        fields = [
            'id',
            'user',
            'puzzle_type',
            'puzzle_id',
            'puzzle_date',
            'difficulty',
            'points_awarded',
            'time_taken_ms',
            'tries',
            'final_state',
            'created_at',
        ]
        read_only_fields = ['user', 'points_awarded', 'created_at']


class SubmissionCreateSerializer(serializers.Serializer):
    """Serializer for submitting completed puzzle"""

    puzzle_id = serializers.IntegerField()
    puzzle_type = serializers.ChoiceField(choices=['wordle', 'sudoku', 'ernigram'])
    difficulty = serializers.ChoiceField(choices=['easy', 'hard'])
    time_taken_ms = serializers.IntegerField(min_value=0)
    tries = serializers.IntegerField(min_value=1)
    final_state = serializers.JSONField(required=False, default=dict)
