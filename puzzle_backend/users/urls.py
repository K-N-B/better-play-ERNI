# /users/urls.py
from django.urls import path
from . import views

# Define URL patterns specific to the 'users' app
# These will likely be included under '/auth/' or '/api/' prefixes in config/urls.py
urlpatterns = [
    # --- Authentication Endpoints ---
    # GET /auth/login/ -> Returns Microsoft URL
    path('login/', views.get_auth_url, name='auth-login-url'),
    # GET /auth/callback/ -> Handles redirect back from Microsoft
    path('callback/', views.auth_callback, name='auth-callback'), # Must match AZURE_AD_REDIRECT_URI path
    # GET /auth/check/ -> Checks current session status
    path('check/', views.check_auth, name='auth-check'),
    # POST /auth/logout/ -> Logs user out
    path('logout/', views.logout_view, name='auth-logout'),

    # --- Profile API Endpoints ---
    # GET /api/departments/ -> Lists departments
    path('api/departments/', views.DepartmentListView.as_view(), name='department-list'),
    # POST /api/users/me/complete-profile/ -> Sets department for new user
    path('api/users/me/complete-profile/', views.CompleteProfileView.as_view(), name='complete-profile'),
]