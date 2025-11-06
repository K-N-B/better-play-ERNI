# gameplay/challenge_urls.py
from django.urls import path
from .views import (
    SearchUsersView,
    PendingChallengesView,
    CompletedChallengesView,
    SendChallengeView,
    CompleteChallengeView,
)

urlpatterns = [
    # Search for users to challenge
    # GET /api/challenges/search-users/?q=<query>
    path('search-users/', SearchUsersView.as_view(), name='search_users'),
    # Get pending challenges (where current user is recipient)
    # GET /api/challenges/pending/
    path('pending/', PendingChallengesView.as_view(), name='pending_challenges'),
    # Get completed challenges (involving current user)
    # GET /api/challenges/completed/
    path('completed/', CompletedChallengesView.as_view(), name='completed_challenges'),
    # Send a new challenge
    # POST /api/challenges/send/
    path('send/', SendChallengeView.as_view(), name='send_challenge'),
    # Complete a challenge (as recipient)
    # POST /api/challenges/<challenge_id>/complete/
    path(
        '<int:challenge_id>/complete/', CompleteChallengeView.as_view(), name='complete_challenge'
    ),
]
