# config/urls.py
from django.contrib import admin
from django.urls import path, include
from users import views as user_views
from django.conf import settings
from django.conf.urls.static import static


from django.http import JsonResponse
from games.views import cron_generate_puzzles_view


def health_check(request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Auth endpoints (no api/ prefix)
    path('auth/login/', user_views.get_auth_url, name='auth-login-url'),
    path('auth/callback/', user_views.auth_callback, name='auth-callback'),
    path('auth/check/', user_views.check_auth, name='auth-check'),
    path('auth/logout/', user_views.logout_view, name='auth-logout'),
    
    # ✅ FIX: Make sure games URLs are included under /api/games/
    path('api/games/', include('games.urls')),  # This makes /api/games/daily/ work
    
    # Other API endpoints
    path('api/departments/', user_views.DepartmentListView.as_view(), name='department-list'),
    path('api/users/me/complete-profile/', user_views.CompleteProfileView.as_view(), name='complete-profile'),
    path('api/', include('leaderboards.urls')),
    path('api/', include('activity.urls')),
    path('', include('shop.urls')),
    path("", include("users.urls")),
    path("auth/", include("users.urls")),
    path("api/gameplay/", include("gameplay.urls")),

    path('api/v1/cron/generate-puzzles/', cron_generate_puzzles_view, name='cron_task'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)