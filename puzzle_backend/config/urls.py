# config/urls.py
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.urls import include, path

# ✅ CRITICAL: Import custom admin site (role-based permissions)
from users.admin import admin_site

# Import views
from games.views import cron_generate_puzzles_view
from users import views as user_views


def health_check(request):
    """Health check endpoint for monitoring/uptime services"""
    return JsonResponse({"status": "ok"})


urlpatterns = [
    # ========== ADMIN (Role-Based Access Control) ==========
    path("admin/", admin_site.urls),  # ✅ Using custom admin site with role permissions
    
    # ========== AUTHENTICATION (Azure AD) ==========
    path('auth/login/', user_views.get_auth_url, name='auth-login-url'),
    path('auth/callback/', user_views.auth_callback, name='auth-callback'),
    path('auth/check/', user_views.check_auth, name='auth-check'),
    path('auth/logout/', user_views.logout_view, name='auth-logout'),
    path('auth/', include('social_django.urls', namespace='social')),
    
    # ========== USER API ENDPOINTS ==========
    path('api/departments/', user_views.DepartmentListView.as_view(), name='department-list'),
    path(
        'api/users/me/complete-profile/',
        user_views.CompleteProfileView.as_view(),
        name='complete-profile',
    ),
    path("api/users/", include("users.urls")),  # ✅ Consolidated user endpoints
    
    # ========== GAMES API ENDPOINTS ==========
    path('api/games/', include('games.urls')),  # Includes /api/games/daily/
    
    # ========== GAMEPLAY API ENDPOINTS ==========
    path("api/gameplay/", include("gameplay.urls")),  # Puzzle submissions, progress, hints
    path('api/challenges/', include('gameplay.challenge_urls')),  # Challenge system
    
    # ========== LEADERBOARDS API ENDPOINTS ==========
    path('api/', include('leaderboards.urls')),  # Leaderboard endpoints
    
    # ========== ACTIVITY API ENDPOINTS ==========
    path('api/', include('activity.urls')),  # Activity tracking
    
    # ========== SHOP API ENDPOINTS ==========
    path('', include('shop.urls')),  # Shop uses api/shop/ prefix in its own urls.py
    
    # ========== CRON/BACKGROUND TASKS ==========
    path('api/v1/cron/generate-puzzles/', cron_generate_puzzles_view, name='cron_task'),
    
    # ========== HEALTH CHECK ==========
    path('healthz/', health_check, name='health-check'),  # For monitoring services
]

# ========== MEDIA FILES (Development Only) ==========
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)