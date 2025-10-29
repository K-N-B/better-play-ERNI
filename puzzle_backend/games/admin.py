from django.contrib import admin
from .models import WordlePuzzle, SudokuPuzzle, ErnigramPuzzle, DailyPuzzle
from rest_framework.authtoken.models import Token


@admin.register(WordlePuzzle)
class WordlePuzzleAdmin(admin.ModelAdmin):
    list_display = ("id", "solution_word", "word_length",
                    "date_to_be_used")  # 👈 Columns shown
    search_fields = ("solution_word",)
    list_filter = ("date_to_be_used",)


@admin.register(SudokuPuzzle)
class SudokuPuzzleAdmin(admin.ModelAdmin):
    list_display = ("id", "solution_string",
                    "puzzle_string_easy", "puzzle_string_hard", "date_to_be_used")


@admin.register(ErnigramPuzzle)
class ErnigramPuzzleAdmin(admin.ModelAdmin):
    list_display = ("id", "solution_phrase", "clue", "employee_image", "date_to_be_used")


@admin.register(DailyPuzzle)
class DailyPuzzleAdmin(admin.ModelAdmin):
    list_display = ("date", "wordle_easy", "wordle_hard", "sudoku", "ernigram")


admin.site.register(Token)
