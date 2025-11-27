from django.contrib import admin
from django.utils.html import format_html
from datetime import timedelta
from django.utils import timezone

from .models import UserActivity

# Import custom admin site
from users.admin import admin_site


@admin.register(UserActivity, site=admin_site)
class UserActivityAdmin(admin.ModelAdmin):
    list_display = ('user', 'last_active', 'is_online')
    list_filter = ('last_active',)
    search_fields = ('user__username', 'user__email')
    ordering = ('-last_active',)
    readonly_fields = ('user', 'last_active')

    def is_online(self, obj):
        """Show if user is currently online (green/red indicator)"""
        threshold = timezone.now() - timedelta(minutes=5)
        is_online = obj.last_active >= threshold

        color = 'green' if is_online else 'red'
        return format_html(
            '<span style="color: {};">●</span> {}', color, 'Online' if is_online else 'Offline'
        )
    is_online.short_description = 'Status'

    def has_add_permission(self, request):
        """Disable manual creation - only created via heartbeat"""
        return False
    
    def has_module_permission(self, request):
        """All admin roles can see Activity section"""
        if not request.user.is_authenticated:
            return False
        return request.user.has_admin_access()
    
    def has_change_permission(self, request, obj=None):
        """Only Super Admins can edit"""
        if not request.user.is_authenticated:
            return False
        return request.user.is_superuser
    
    def has_delete_permission(self, request, obj=None):
        """Only Super Admins can delete"""
        if not request.user.is_authenticated:
            return False
        return request.user.is_superuser