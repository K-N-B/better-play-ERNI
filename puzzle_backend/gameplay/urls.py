from django.urls import path
from .views import SaveProgressView, SubmitPuzzleView, GetProgressView, GetHintView, CheckSubmissionView, GetTodaySubmissionsView

# gameplay/urls.py - ADD THIS ROUTE

urlpatterns = [
    path("save/<str:daily_puzzle_date>/<str:puzzle_model_name>/<int:puzzle_id>/",
        SaveProgressView.as_view(),
        name="save_progress",
    ),
    path("submit/<str:daily_puzzle_date>/<str:puzzle_model_name>/<int:puzzle_id>/",
        SubmitPuzzleView.as_view(),
        name="submit_puzzle",
    ),
    path("progress/<str:daily_puzzle_date>/<str:puzzle_model_name>/<int:puzzle_id>/",
        GetProgressView.as_view(),
        name="get_progress",
    ),
    path("hint/<str:daily_puzzle_date>/<str:puzzle_model_name>/<int:puzzle_id>/",
        GetHintView.as_view(),
        name="get_hint",
    ),
    path("check-submission/<str:daily_puzzle_date>/<str:puzzle_model_name>/<int:puzzle_id>/",
        CheckSubmissionView.as_view(),
        name="check_submission",
    ),
    # ✅ ADD THIS NEW ROUTE
    path("submissions/today/",
        GetTodaySubmissionsView.as_view(),
        name="get_today_submissions",
    ),
]
