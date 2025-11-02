from django.urls import path
from .views import SaveProgressView, SubmitPuzzleView, GetProgressView, GetHintView
from django.urls import path
from .views import SaveProgressView, SubmitPuzzleView, GetProgressView, GetHintView, UserStatsView

urlpatterns = [
    # URL for saving intermediate game state
    # Example: POST /api/gameplay/save/1/wordlepuzzle/42/ 
    # --- NEW URL FOR STREAK STATUS ---
    path(
        'stats/user/', 
        UserStatsView.as_view(), 
        name='user_stats'
    ),

    path(
        "save/<str:daily_puzzle_id>/<str:puzzle_model_name>/<int:puzzle_id>/",
        SaveProgressView.as_view(),
        name="save_progress",
    ),
    # URL for final submission
    # Example: POST /api/gameplay/submit/1/wordlepuzzle/42/
    path(
        "submit/<str:daily_puzzle_id>/<str:puzzle_model_name>/<int:puzzle_id>/",
        SubmitPuzzleView.as_view(),
        name="submit_puzzle",  # The name used in your reverse() calls
    ),
    path(
        "progress/<str:daily_puzzle_id>/<str:puzzle_model_name>/<int:puzzle_id>/",
        GetProgressView.as_view(),
        name="get_progress",  # <-- NEW URL NAME
    ),
    path(
        "hint/<str:daily_puzzle_id>/<str:puzzle_model_name>/<int:puzzle_id>/",
        GetHintView.as_view(),
        name="get_hint",
    ),
]
