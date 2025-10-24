from django.contrib import admin
from .models import (
    WordlePuzzle,
    SudokuPuzzle,
    ErnigramPuzzle,
    DailyPuzzle,
    PuzzleAttempt
)

@admin.register(WordlePuzzle)
class WordlePuzzleAdmin(admin.ModelAdmin):
    list_display = ('solution_word', 'date_to_be_used')
    ordering = ('-date_to_be_used',)

@admin.register(SudokuPuzzle)
class SudokuPuzzleAdmin(admin.ModelAdmin):
    list_display = ('id', 'date_to_be_used')
    ordering = ('-date_to_be_used',)

@admin.register(ErnigramPuzzle)
class ErnigramPuzzleAdmin(admin.ModelAdmin):
    list_display = ('solution_phrase', 'clue', 'date_to_be_used')
    ordering = ('-date_to_be_used',)

@admin.register(DailyPuzzle)
class DailyPuzzleAdmin(admin.ModelAdmin):
    list_display = ('date', 'wordle_easy', 'wordle_hard', 'sudoku', 'ernigram')
    ordering = ('-date',)

@admin.register(PuzzleAttempt)
class PuzzleAttemptAdmin(admin.ModelAdmin):
    list_display = ('user', 'daily_puzzle', 'last_saved', 'time_spent_ms')
    list_filter = ('daily_puzzle__date', 'user')
    ordering = ('-last_saved',)