from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

# ✅ Register the custom User model to appear in the Django admin site
@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """
    Custom admin configuration for the User model.
    Extends Django's built-in UserAdmin to include our additional fields
    such as 'email', 'display_name', 'avatar_url', and 'total_points'.
    """

    # 👀 What columns to show in the user list page (admin > Users)
    list_display = ['username', 'email', 'display_name', 'total_points', 'is_staff']

    # 🔍 Enables sidebar filtering options in the user list view
    list_filter = ['is_staff', 'is_superuser', 'is_active']

    # 🔎 Enables searching by username, email, or display_name
    search_fields = ['username', 'email', 'display_name']

    # 🧩 Fieldsets define how fields are grouped in the "Edit User" page
    fieldsets = UserAdmin.fieldsets + (
        ('Azure Info', {  # This section name appears as a header in the admin form
            'fields': ('azure_id', 'display_name', 'avatar_url', 'total_points'),
        }),
    )

    # 🆕 Add_fieldsets define what fields appear when adding a new user
    add_fieldsets = (
        (None, {
            'classes': ('wide',),  # Makes the form wider
            'fields': ('username', 'email', 'display_name', 'password1', 'password2'),
        }),
    )

    # 🧠 Optional: ordering determines how users are sorted in the list view
    ordering = ['-total_points']
