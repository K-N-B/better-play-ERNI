# games/admin.py
from django.contrib import admin
from .models import WordlePuzzle, SudokuPuzzle, ErnigramPuzzle, DailyPuzzle


@admin.register(WordlePuzzle)
class WordlePuzzleAdmin(admin.ModelAdmin):
    list_display = ('date_to_be_used', 'solution_word', 'id')
    list_filter = ('date_to_be_used',)
    search_fields = ('solution_word',)
    ordering = ('-date_to_be_used',)
    date_hierarchy = 'date_to_be_used'


@admin.register(SudokuPuzzle)
class SudokuPuzzleAdmin(admin.ModelAdmin):
    list_display = ('date_to_be_used', 'difficulty', 'id')
    list_filter = ('difficulty', 'date_to_be_used')
    ordering = ('-date_to_be_used',)
    date_hierarchy = 'date_to_be_used'


@admin.register(ErnigramPuzzle)
class ErnigramPuzzleAdmin(admin.ModelAdmin):
    list_display = ('date_to_be_used', 'solution_phrase', 'id')
    list_filter = ('date_to_be_used',)
    search_fields = ('solution_phrase', 'clue')
    ordering = ('-date_to_be_used',)
    date_hierarchy = 'date_to_be_used'


@admin.register(DailyPuzzle)
class DailyPuzzleAdmin(admin.ModelAdmin):
    list_display = ('date', 'wordle', 'sudoku', 'ernigram')
    list_filter = ('date',)
    ordering = ('-date',)
    date_hierarchy = 'date'
    
    # Remove any custom form or filter_horizontal if present
    # Just use simple configuration