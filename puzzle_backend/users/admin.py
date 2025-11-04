# /users/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin  # Import base User admin

from .models import Department, User  # Import your models


# Customize the User display in the admin
class UserAdmin(BaseUserAdmin):
    # Add custom fields to the list display, list filter, and fieldsets
    list_display = (
        "username",
        "email",
        "first_name",
        "last_name",
        "department",
        "profile_complete",
        "is_admin",
        "is_staff",
    )
    list_filter = (
        "is_staff",
        "is_superuser",
        "is_active",
        "groups",
        "department",
        "profile_complete",
        "is_admin",
    )
    search_fields = ("username", "first_name", "last_name", "email")
    ordering = ("username",)
    # Add your custom fields to the fieldsets displayed on the edit page
    # This adds new sections for "Puzzle Profile" and "Stats"
    fieldsets = BaseUserAdmin.fieldsets + (
        ("Puzzle Profile", {"fields": ("department", "profile_complete", "is_admin")}),
        (
            "Stats",
            {
                "fields": (
                    "total_points_alltime",
                    "current_points",
                    "current_streak_count",
                    "max_streak_count",
                    "challenges_made_count",
                )
            },
        ),
        ("Activity", {"fields": ("last_active",)}),  # Display last_active
    )
    # Make last_active read-only in the admin if desired
    readonly_fields = ("last_login", "date_joined", "last_active")


# Register your custom User model with the customized admin class
admin.site.register(User, UserAdmin)


# Register your Department model
@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ("name", "total_points_alltime")  # Fields to show in the list view
    search_fields = ("name",)  # Allow searching by name
