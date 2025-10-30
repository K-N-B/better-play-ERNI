from django.contrib import admin
from .models import WordlePuzzle, SudokuPuzzle, ErnigramPuzzle, DailyPuzzle, EmployeeImageSource
from django.utils.html import format_html


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
    list_display = ('id', 'solution_phrase', 'clue', 'employee_source', 'date_to_be_used')
    search_fields = ('solution_phrase', 'clue')
    list_filter = ('date_to_be_used',)


@admin.register(DailyPuzzle)
class DailyPuzzleAdmin(admin.ModelAdmin):
    list_display = ("date", "wordle_easy", "wordle_hard", "sudoku", "ernigram")


@admin.register(EmployeeImageSource)
class EmployeeImageSourceAdmin(admin.ModelAdmin):
    def display_image(self, obj):
        if obj.image_file:
            return format_html('<img src="{}" width="100" />', obj.image_file.url)
        return "No Image"
    display_image.short_description = 'Image Preview'

    list_display = ('id', 'employee_name', 'display_image', 'is_available')
    list_filter = ('is_available',)
    search_fields = ('employee_name',)