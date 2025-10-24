# puzzle_backend/games/serializers.py

from rest_framework import serializers
from .models import (
    WordlePuzzle,
    SudokuPuzzle,
    ErnigramPuzzle,
    DailyPuzzle,
    PuzzleAttempt
)
from django.contrib.contenttypes.models import ContentType

class WordlePuzzleSerializer(serializers.ModelSerializer):
    class Meta:
        model = WordlePuzzle
        fields = '__all__'

class SudokuPuzzleSerializer(serializers.ModelSerializer):
    class Meta:
        model = SudokuPuzzle
        fields = '__all__'

class ErnigramPuzzleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ErnigramPuzzle
        fields = '__all__'

class DailyPuzzleSerializer(serializers.ModelSerializer):
    # Use nested serializers for read operations for richer output
    wordle_easy = WordlePuzzleSerializer(read_only=True)
    wordle_hard = WordlePuzzleSerializer(read_only=True)
    sudoku = SudokuPuzzleSerializer(read_only=True)
    ernigram = ErnigramPuzzleSerializer(read_only=True)

    class Meta:
        model = DailyPuzzle
        fields = '__all__'

class PuzzleAttemptSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')
    
    # Allow specifying the puzzle type by its model name, e.g., "wordlepuzzle"
    content_type = serializers.SlugRelatedField(
        slug_field='model',
        queryset=ContentType.objects.filter(app_label='games')
    )

    class Meta:
        model = PuzzleAttempt
        fields = [
            'id', 'user', 'daily_puzzle', 'content_type', 'object_id',
            'progress_data', 'time_spent_ms', 'last_saved'
        ]