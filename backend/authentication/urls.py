from django.urls import path
from authentication import views as auth_views

app_name = 'authentication'

urlpatterns = [
    path('login/', auth_views.get_auth_url, name='get_auth_url'),
    path('callback', auth_views.auth_callback, name='auth_callback'),
    path('user/', auth_views.get_current_user, name='current_user'),
    path('logout/', auth_views.logout_view, name='logout'),
    path('check/', auth_views.check_auth, name='check_auth'),
]