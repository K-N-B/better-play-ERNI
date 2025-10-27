# games/serializers.py
from rest_framework import serializers
from .models import WordlePuzzle, SudokuPuzzle, ErnigramPuzzle, DailyPuzzle
from gameplay.models import PuzzleAttempt, Submission

class WordlePuzzleSerializer(serializers.ModelSerializer):
    """Serializer for Wordle puzzles (WITHOUT solution for security)"""
    class Meta:
        model = WordlePuzzle
        fields = ['id', 'date_to_be_used']
        # solution_word is NEVER sent to frontend until game is complete


class WordlePuzzleDetailSerializer(serializers.ModelSerializer):
    """Serializer with solution (only after submission)"""
    class Meta:
        model = WordlePuzzle
        fields = ['id', 'date_to_be_used', 'solution_word']


class SudokuPuzzleSerializer(serializers.ModelSerializer):
    class Meta:
        model = SudokuPuzzle
        fields = '__all__'


class ErnigramPuzzleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ErnigramPuzzle
        fields = '__all__'


class DailyPuzzleSerializer(serializers.ModelSerializer):
    wordle = WordlePuzzleSerializer()
    sudoku = SudokuPuzzleSerializer(required=False, allow_null=True)
    ernigram = ErnigramPuzzleSerializer(required=False, allow_null=True)

    class Meta:
        model = DailyPuzzle
        fields = '__all__'