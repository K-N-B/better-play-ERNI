from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'display_name', 'total_points', 'is_staff']
    fieldsets = UserAdmin.fieldsets + (
        ('Azure Info', {'fields': ('azure_id', 'display_name', 'avatar_url', 'total_points')}),
    )