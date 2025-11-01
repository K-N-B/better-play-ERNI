# config/urls.py
"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from users import views as user_views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Auth endpoints (no api/ prefix)
    path('auth/login/', user_views.get_auth_url, name='auth-login-url'),
    path('auth/callback/', user_views.auth_callback, name='auth-callback'),
    path('auth/check/', user_views.check_auth, name='auth-check'),
    path('auth/logout/', user_views.logout_view, name='auth-logout'),
    
    # API endpoints (all under /api/)
    path('api/departments/', user_views.DepartmentListView.as_view(), name='department-list'),
    path('api/users/me/complete-profile/', user_views.CompleteProfileView.as_view(), name='complete-profile'),
    path('api/games/', include('games.urls')),
    path('api/wordle/', include('games.urls')),
    path('api/', include('leaderboards.urls')),
    path('api/', include('activity.urls')),
    path('', include('shop.urls')),

    # Add this line to include URLs from your 'users' app (views we'll create soon)
    path("", include("users.urls")),
    path("auth/", include("users.urls")),
    path("api/gameplay/", include("gameplay.urls")),


]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
