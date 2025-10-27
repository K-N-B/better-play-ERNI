# leaderboards/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('leaderboard/', views.GetLeaderboardView.as_view(), name='get-leaderboard'),
]