from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'username', 'is_admin_user', 'total_points', 'puzzles_completed', 'current_streak')
    list_filter = ('is_admin_user', 'is_staff', 'is_active')
    fieldsets = UserAdmin.fieldsets + (
        ('Puzzle Stats', {'fields': ('is_admin_user', 'total_points', 'puzzles_completed', 'current_streak', 'longest_streak')}),
    )
    search_fields = ('email', 'username')
    ordering = ('-total_points',)