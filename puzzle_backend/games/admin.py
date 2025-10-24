from django.contrib import admin
from .models import WordlePuzzle, SudokuPuzzle, ErnigramPuzzle, DailyPuzzle

admin.site.register(WordlePuzzle)
admin.site.register(SudokuPuzzle)
admin.site.register(ErnigramPuzzle)
admin.site.register(DailyPuzzle)