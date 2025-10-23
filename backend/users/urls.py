from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    # Azure AD OAuth endpoints
    path('login/', views.login_view, name='login'),
    path('callback', views.callback_view, name='callback'),
    path('logout/', views.logout_view, name='logout'),
    path('check/', views.check_auth, name='check'),
    path('user/', views.get_user, name='user'),
]