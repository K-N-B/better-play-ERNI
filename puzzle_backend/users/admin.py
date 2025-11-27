from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.db.models import Q

from .models import Department, User
from .admin_mixins import AuthenticatedPermissionMixin


# ========== CUSTOM ADMIN SITE ==========
class RoleBasedAdminSite(admin.AdminSite):
    """Custom admin site with role-based access control"""
    
    site_header = "ERNI Puzzle Admin"
    site_title = "ERNI Puzzle Admin Portal"
    index_title = "Welcome to ERNI Puzzle Administration"
    
    # Add these attributes to fix logout/profile issues
    enable_nav_sidebar = True
    
    def has_permission(self, request):
        """
        Only allow users with admin roles to access /admin/
        """
        if not request.user.is_authenticated:
            return False
        
        return request.user.is_active and request.user.has_admin_access()
    
    def get_urls(self):
        """Ensure all default URLs including logout are properly registered"""
        from django.urls import path
        urls = super().get_urls()
        return urls


# Replace default admin site with our custom one
admin_site = RoleBasedAdminSite(name='admin')


# ========== DEPARTMENT ADMIN ==========
@admin.register(Department, site=admin_site)
class DepartmentAdmin(AuthenticatedPermissionMixin, admin.ModelAdmin):
    """Admin configuration for Department model"""
    
    list_display = ("name", "total_points_alltime", "member_count")
    search_fields = ("name",)
    ordering = ("name",)
    
    def member_count(self, obj):
        """Display number of members in department"""
        return obj.members.count()
    member_count.short_description = "Members"
    
    def has_add_permission(self, request):
        """Only Super Admins and Moderators can add departments"""
        if not request.user.is_authenticated:
            return False
        return request.user.is_superuser or request.user.is_moderator()
    
    def has_change_permission(self, request, obj=None):
        """Only Super Admins and Moderators can edit departments"""
        if not request.user.is_authenticated:
            return False
        return request.user.is_superuser or request.user.is_moderator()
    
    def has_delete_permission(self, request, obj=None):
        """Only Super Admins can delete departments"""
        if not request.user.is_authenticated:
            return False
        return request.user.is_superuser
    
    def has_module_permission(self, request):
        """Only Super Admins and Moderators see the Department section"""
        if not request.user.is_authenticated:
            return False
        return request.user.is_superuser or request.user.is_moderator()


# ========== USER ADMIN ==========
@admin.register(User, site=admin_site)
class UserAdmin(AuthenticatedPermissionMixin, BaseUserAdmin):
    """Custom User admin with role-based permissions"""
    change_form_template = 'admin/users/user/change_form.html'
    # ========== LIST VIEW ==========
    list_display = (
        "username",
        "email",
        "display_role",
        "department",
        "total_points_alltime",
        "current_points",
        "profile_complete",
        "is_active",
    )
    
    list_filter = (
        "role",
        "is_active",
        "is_superuser",
        "profile_complete",
        "department",
    )
    
    search_fields = ("username", "first_name", "last_name", "email", "azure_id")
    ordering = ("username",)
    
    # ========== DETAIL VIEW FIELDSETS ==========
    fieldsets = (
    (None, {
        "fields": ("username", "email", "first_name", "last_name", "password")
    }),
    ("Role & Permissions", {
        "fields": ("role", "is_active", "is_superuser", "groups", "user_permissions"),
        "description": "⚠️ IMPORTANT: Use 'role' field to assign admin permissions."
    }),
    ("Profile Information", {
        "fields": ("azure_id", "department", "profile_picture_url", "profile_complete")
    }),
    ("Statistics", {
        "fields": ("total_points_alltime", "current_points", "current_streak_count", "max_streak_count", "challenges_made_count")
    }),
    ("Activity Tracking", {
        "fields": ("last_active", "last_login", "date_joined")
    }),
)

    
    # ========== ADD USER FORM ==========
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("username", "email", "password1", "password2", "role", "department"),
        }),
    )
    
    # ========== READ-ONLY FIELDS ==========
    readonly_fields = (
        "last_login",
        "date_joined",
        "last_active",
        "azure_id",
        "total_points_alltime",
        "current_points",
        "current_streak_count",
        "max_streak_count",
        "challenges_made_count",
    )
    
    # ========== CUSTOM DISPLAY METHODS ==========
    
    def display_role(self, obj):
        """Display role with colored badge"""
        role_colors = {
            User.Role.SUPER_ADMIN: "#dc3545",  # Red
            User.Role.CONTENT_ADMIN: "#007bff",  # Blue
            User.Role.MODERATOR: "#28a745",  # Green
            User.Role.SHOP_MANAGER: "#ffc107",  # Yellow
            User.Role.USER: "#6c757d",  # Gray
        }
        color = role_colors.get(obj.role, "#6c757d")
        
        if obj.is_superuser:
            return format_html(
                '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px; font-weight: bold;">👑 SUPERUSER</span>',
                "#dc3545"
            )
        
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px;">{}</span>',
            color,
            obj.get_role_display_with_icon()
        )
    display_role.short_description = "Role"
    
    # ========== PERMISSION CONTROL ==========
    
    def get_queryset(self, request):
        """
        Moderators can only see users in their own department.
        Super Admins see everyone.
        """
        qs = super().get_queryset(request)
        
        if not request.user.is_authenticated:
            return qs.none()
        
        if request.user.is_superuser:
            return qs
        
        if request.user.is_moderator():
            # Moderators see only their department
            if request.user.department:
                return qs.filter(
                    Q(department=request.user.department) | Q(id=request.user.id)
                )
            else:
                # If moderator has no department, only see themselves
                return qs.filter(id=request.user.id)
        
        # Shouldn't reach here, but return empty queryset as fallback
        return qs.none()
    
    def has_add_permission(self, request):
        """Only Super Admins can add users (users are created via Azure AD)"""
        if not request.user.is_authenticated:
            return False
        return request.user.is_superuser
    
    def has_change_permission(self, request, obj=None):
        """Super Admins and Moderators can edit users"""
        if not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser:
            return True
        
        if request.user.is_moderator():
            # Moderators can edit users but not other admins
            if obj and obj.has_admin_access() and not obj.id == request.user.id:
                return False
            return True
        
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Only Super Admins can delete users"""
        if not request.user.is_authenticated:
            return False
        return request.user.is_superuser
    
    def has_module_permission(self, request):
        """Only Super Admins and Moderators see the Users section"""
        if not request.user.is_authenticated:
            return False
        return request.user.is_superuser or request.user.is_moderator()
    
    def get_readonly_fields(self, request, obj=None):
        """
        Moderators cannot change role or superuser status
        """
        readonly = list(self.readonly_fields)
        
        if not request.user.is_superuser:
            readonly.extend(["role", "is_superuser", "groups", "user_permissions"])
        
        return readonly