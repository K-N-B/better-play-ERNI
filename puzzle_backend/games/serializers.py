# games/serializers.py
from rest_framework import serializers
from .models import WordlePuzzle, SudokuPuzzle, ErnigramPuzzle, DailyPuzzle


class WordlePuzzleSerializer(serializers.ModelSerializer):
    class Meta:
        model = WordlePuzzle
        fields = ["id", "solution_word", "word_length", "date_to_be_used"]
        # 'solution_word' might be removed for public API responses, or only exposed if authorized


class SudokuPuzzleSerializer(serializers.ModelSerializer):
    class Meta:
        model = SudokuPuzzle
        fields = [
            "id",
            "date_to_be_used",
            "solution_string",
            "puzzle_string_easy",
            "puzzle_string_hard",
        ]
        # Similar considerations for puzzle_string_easy/hard if you only want to send one based on user choice


class ErnigramPuzzleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ErnigramPuzzle
        fields = ['id', 'solution_phrase', 'clue', 'employee_source', 'date_to_be_used']
        # 'solution_phrase' might be removed for public API responses


class DailyPuzzleSerializer(serializers.ModelSerializer):
    # Nested serializers to include the full puzzle data
    wordle_easy = WordlePuzzleSerializer(read_only=True)
    wordle_hard = WordlePuzzleSerializer(read_only=True)
    sudoku = SudokuPuzzleSerializer(read_only=True)
    ernigram = ErnigramPuzzleSerializer(read_only=True)

    class Meta:
        model = DailyPuzzle
        fields = ["date", "wordle_easy", "wordle_hard", "sudoku", "ernigram"]
