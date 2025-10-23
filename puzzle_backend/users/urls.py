# /users/urls.py
from django.urls import path
from . import views  # Import views from the current app (users)

# Define URL patterns specific to the 'users' app
urlpatterns = [
    # --- Authentication Endpoints ---
    # URL for frontend to get the Microsoft login redirect URL
    path('auth/login/', views.get_login_redirect_url, name='auth-login-url'),
    # URL for frontend to check if the user is already logged in via session
    path('auth/check/', views.check_auth, name='auth-check'),
    # URL for frontend to trigger logout
    path('auth/logout/', views.logout_user, name='auth-logout'),

    # --- Profile API Endpoints ---
    # URL for frontend to get the list of departments
    path('api/departments/', views.DepartmentListView.as_view(), name='department-list'),
    # URL for frontend to submit the chosen department for a new user
    path('api/users/me/complete-profile/', views.CompleteProfileView.as_view(), name='complete-profile'),
]