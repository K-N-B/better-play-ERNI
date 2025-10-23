from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom admin for User model"""
    
    list_display = [
        'username', 'email', 'display_name', 
        'total_points_alltime', 'current_streak_count',
        'is_staff', 'last_active'
    ]
    
    list_filter = [
        'is_staff', 'is_superuser', 'is_active',
        'current_streak_count', 'last_active'
    ]
    
    search_fields = ['username', 'email', 'display_name', 'azure_id']
    
    ordering = ['-total_points_alltime', '-last_active']
    
    readonly_fields = ['azure_id', 'last_active', 'created_at', 'updated_at']
    
    # Fieldsets for detail view
    fieldsets = (
        ('Authentication', {
            'fields': ('username', 'password', 'azure_id')
        }),
        ('Personal Info', {
            'fields': ('first_name', 'last_name', 'email', 'display_name', 'avatar_url')
        }),
        ('Gaming Stats', {
            'fields': (
                'total_points_daily', 'total_points_weekly',
                'total_points_monthly', 'total_points_alltime',
                'current_streak_count', 'max_streak_count'
            )
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('Important Dates', {
            'fields': ('last_login', 'last_active', 'date_joined', 'created_at', 'updated_at')
        }),
    )
    
    # Fieldsets for add user view
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'azure_id'),
        }),
    )