from rest_framework import serializers
from .models import WordlePuzzle, SudokuPuzzle, ErnigramPuzzle, DailyPuzzle

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
    wordle = WordlePuzzleSerializer()
    sudoku = SudokuPuzzleSerializer()
    ernigram = ErnigramPuzzleSerializer()

    class Meta:
        model = DailyPuzzle
        fields = '__all__'
