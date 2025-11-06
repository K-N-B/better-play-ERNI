# games/urls.py
from django.urls import path
from .views import DailyPuzzlesView, MockDailyPuzzlesGenerateView, GetSudokuHintLimitsView
from . import views

urlpatterns = [
    # Endpoint to get daily puzzles for a specific date (or today if none specified)
    # GET /api/games/daily/                  -> Today's puzzles
    # GET /api/games/daily/?date=2025-10-19 -> Puzzles for 2025-10-19
    path("daily/", DailyPuzzlesView.as_view(), name="daily-puzzles"),
    path("daily/", views.DailyPuzzlesView.as_view(), name="daily-puzzles"),
    # Endpoint to mock generate daily puzzles (FOR DEVELOPMENT ONLY)
    # POST /api/games/mock-generate/ with {"date": "YYYY-MM-DD"}
    path(
        "mock-generate/",
        MockDailyPuzzlesGenerateView.as_view(),
        name="mock-generate-daily-puzzles",
    ),
    path("hint-limits/sudoku/", GetSudokuHintLimitsView.as_view(), name="get_sudoku_hint_limits"),
]
