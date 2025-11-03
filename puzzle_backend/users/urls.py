# users/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # --- Authentication Endpoints ---
    path('login/', views.get_auth_url, name='auth-login-url'),
    path('callback/', views.auth_callback, name='auth-callback'),
    path('check/', views.check_auth, name='auth-check'),
    path('logout/', views.logout_view, name='auth-logout'),

    # --- Profile API Endpoints ---
    path('api/departments/', views.DepartmentListView.as_view(), name='department-list'),
    path('me/complete-profile/', views.CompleteProfileView.as_view(), name='complete-profile'),

]