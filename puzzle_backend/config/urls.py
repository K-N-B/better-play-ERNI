# config/urls.py
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from games.views import WordleGameViewSet

router = DefaultRouter()
router.register(r'wordle', WordleGameViewSet, basename='wordle')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('auth/', include('users.urls')),
    path('api/', include(router.urls)),
    path('api/', include('leaderboards.urls')),  # This includes the leaderboard endpoint
    path('api/', include('activity.urls')),
    path('api/wordle/', include('games.urls')),
]