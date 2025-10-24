# /leaderboards/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Single endpoint handles all leaderboard types/periods via query params
    path('api/leaderboard/', views.GetLeaderboardView.as_view(), name='get-leaderboard'),
]