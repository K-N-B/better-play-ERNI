from django.urls import path
from . import views

app_name = 'games'

urlpatterns = [
    # Puzzle endpoints
    path('puzzles/daily/', views.get_daily_puzzles, name='daily-puzzles'),
    path('puzzles/<int:puzzle_id>/hints/', views.get_puzzle_hints, name='puzzle-hints'),
    
    # Progress endpoints
    path('progress/<str:puzzle_type>/', views.get_saved_progress, name='get-progress'),
    path('progress/save/', views.save_progress, name='save-progress'),
    
    # Submission endpoints
    path('submissions/submit/', views.submit_puzzle, name='submit-puzzle'),
    path('submissions/today/', views.get_today_submissions, name='today-submissions'),
    
    # Leaderboard endpoints
    path('leaderboards/<str:period>/<str:leaderboard_type>/', views.get_leaderboard, name='leaderboard'),
    
    # Activity feed
    path('activity-feed/', views.get_activity_feed, name='activity-feed'),
    
    # User stats
    path('users/stats/', views.get_user_stats, name='user-stats'),
    path('users/online/', views.get_whos_online, name='whos-online'),
]