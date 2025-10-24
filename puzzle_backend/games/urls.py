from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    WordlePuzzleViewSet,
    SudokuPuzzleViewSet,
    ErnigramPuzzleViewSet,
    DailyPuzzleViewSet,
    PuzzleAttemptViewSet
)

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'wordle-puzzles', WordlePuzzleViewSet)
router.register(r'sudoku-puzzles', SudokuPuzzleViewSet)
router.register(r'ernigram-puzzles', ErnigramPuzzleViewSet)
router.register(r'daily-puzzles', DailyPuzzleViewSet)
router.register(r'puzzle-attempts', PuzzleAttemptViewSet, basename='puzzleattempt')

# The API URLs are now determined automatically by the router.
urlpatterns = [
    path('', include(router.urls)),
]