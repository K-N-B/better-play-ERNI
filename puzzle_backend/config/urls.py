# config/urls.py
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.urls import include, path, re_path
from django.views.generic import TemplateView

# ✅ CRITICAL: Import custom admin site (role-based permissions)
from users.admin import admin_site

# Import views
from games.views import cron_generate_puzzles_view
from users import views as user_views

# Import DRF documentation views
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi


def health_check(request):
    """Health check endpoint for monitoring/uptime services"""
    return JsonResponse({"status": "ok"})


# ========== API DOCUMENTATION SCHEMA ==========
schema_view = get_schema_view(
    openapi.Info(
        title="ERNI Puzzle Platform API",
        default_version='v1',
        description="""
# ERNI Puzzle Platform API Documentation

Welcome to the ERNI Puzzle Platform API. This API provides endpoints for managing daily puzzles, 
user gameplay, challenges, leaderboards, and reward redemption.

## Authentication
Most endpoints require authentication via Azure AD OAuth2. Session cookies are used for authentication.

## Base URL
```
https://your-domain.com/api
```

## Rate Limiting
API requests are rate-limited to prevent abuse. Contact support if you need higher limits.

## Response Format
All responses are returned in JSON format with the following structure:
```json
{
    "status": "success",
    "data": { ... },
    "message": "Operation completed successfully"
}
```

## Error Codes
- `200` - Success
- `400` - Bad Request (Invalid parameters)
- `401` - Unauthorized (Authentication required)
- `403` - Forbidden (Insufficient permissions)
- `404` - Not Found (Resource doesn't exist)
- `500` - Internal Server Error

## Puzzle Types
- **Wordle Easy**: 5-letter word puzzle (6 tries)
- **Wordle Hard**: 10-letter word puzzle (8 tries)
- **Sudoku**: 9x9 number puzzle with hint support
- **Ernigram**: Employee name anagram puzzle

## Timezone
All dates and times are in Asia/Manila timezone (UTC+8).
        """,
        terms_of_service="https://www.erni.com/terms/",
        contact=openapi.Contact(email="support@erni.com"),
        license=openapi.License(name="Proprietary"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)


urlpatterns = [
    # ========== API DOCUMENTATION (Swagger & ReDoc) ==========
    path('api/docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('api/redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    path('api/swagger.json', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('api/swagger.yaml', schema_view.without_ui(cache_timeout=0), name='schema-yaml'),
    
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
