# gameplay/urls.py - FIXED URL PATTERNS

from django.urls import path

from .views import (
    CheckSubmissionView,
    GetHintView,
    GetProgressView,
    GetTodayCompletedPuzzlesView,
    GetTodaySubmissionsView,
    SaveProgressView,
    SubmitPuzzleView,
    get_user_streak_data,
)


urlpatterns = [
    # Save progress for a specific puzzle attempt
    # Example: POST /api/gameplay/save/2025-11-03/wordlepuzzle/42/
    path(
        "save/<str:daily_puzzle_date>/<str:puzzle_model_name>/<int:puzzle_id>/",
        SaveProgressView.as_view(),
        name="save_progress",
    ),
    # Submit completed puzzle attempt
    # Example: POST /api/gameplay/submit/2025-11-03/wordlepuzzle/42/
    path(
        "submit/<str:daily_puzzle_date>/<str:puzzle_model_name>/<int:puzzle_id>/",
        SubmitPuzzleView.as_view(),
        name="submit_puzzle",
    ),
    # Retrieve saved progress
    # Example: GET /api/gameplay/progress/2025-11-03/wordlepuzzle/42/
    path(
        "progress/<str:daily_puzzle_date>/<str:puzzle_model_name>/<int:puzzle_id>/",
        GetProgressView.as_view(),
        name="get_progress",
    ),
    # Get a Sudoku hint
    # Example: POST /api/gameplay/hint/2025-11-03/sudokupuzzle/42/
    path(
        "hint/<str:daily_puzzle_date>/<str:puzzle_model_name>/<int:puzzle_id>/",
        GetHintView.as_view(),
        name="get_hint",
    ),
    # Check if the current user has already submitted a specific puzzle
    # Example: GET /api/gameplay/check-submission/2025-11-03/wordlepuzzle/42/
    path(
        "check-submission/<str:daily_puzzle_date>/<str:puzzle_model_name>/<int:puzzle_id>/",
        CheckSubmissionView.as_view(),
        name="check_submission",
    ),
    path(
        "completed/today/",
        GetTodayCompletedPuzzlesView.as_view(),
        name="today_completed",
    ),
    # Get all submissions by the current user for today's date (Asia/Manila)
    # Example: GET /api/gameplay/submissions/today/
    path(
        "submissions/today/",
        GetTodaySubmissionsView.as_view(),
        name="today_submissions",
    ),
    path('streak/', get_user_streak_data, name='user_streak_data'),
]
