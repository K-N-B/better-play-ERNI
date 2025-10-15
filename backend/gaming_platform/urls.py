from django.contrib import admin
from django.urls import path, include
from authentication import views as auth_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('auth/login/', auth_views.get_auth_url, name='get_auth_url'),
    path('auth/callback', auth_views.auth_callback, name='auth_callback'),
    path('auth/user/', auth_views.get_current_user, name='current_user'),
    path('auth/logout/', auth_views.logout_view, name='logout'),
    path('auth/check/', auth_views.check_auth, name='check_auth'),
]