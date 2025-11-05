# activity/urls.py
from django.urls import path

from . import views

urlpatterns = [
    path('activity-hub/', views.ActivityHubView.as_view(), name='activity-hub'),
    path('heartbeat/', views.HeartbeatView.as_view(), name='heartbeat'),
]
