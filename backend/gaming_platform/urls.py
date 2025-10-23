from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Sprint 1: Authentication
    path('auth/', include('users.urls')),  # Your existing auth URLs
    
    # Sprint 2: Games API (NEW)
    path('api/', include('games.urls')),
]