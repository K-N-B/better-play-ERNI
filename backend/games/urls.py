from django.urls import path
from games import views

app_name = 'games'

urlpatterns = [
    path('puzzles/daily/<str:game_type>/', views.get_daily_puzzle, name='daily_puzzle'),
    path('puzzles/<int:puzzle_id>/start/', views.start_puzzle, name='start_puzzle'),
    path('puzzles/attempts/<int:attempt_id>/guess/', views.submit_guess, name='submit_guess'),
    path('puzzles/attempts/<int:attempt_id>/hint/', views.request_hint, name='request_hint'),
    path('leaderboards/<str:period>/', views.get_leaderboard, name='leaderboard'),
    path('leaderboards/<str:period>/top3/', views.get_top3, name='top3'),
    path('user/dashboard/', views.get_user_dashboard, name='user_dashboard'),
    path('user/stats/', views.get_user_stats, name='user_stats'),
]