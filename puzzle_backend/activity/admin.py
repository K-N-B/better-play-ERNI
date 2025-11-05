# activity/admin.py
from django.contrib import admin
from django.utils.html import format_html  # Add this import at the top

from .models import UserActivity


@admin.register(UserActivity)
class UserActivityAdmin(admin.ModelAdmin):
    list_display = ('user', 'last_active', 'is_online')
    list_filter = ('last_active',)
    search_fields = ('user__username', 'user__email')
    ordering = ('-last_active',)
    readonly_fields = ('user', 'last_active')

    def is_online(self, obj):
        """Show if user is currently online (green/red indicator)"""
        from datetime import timedelta

        from django.utils import timezone

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
