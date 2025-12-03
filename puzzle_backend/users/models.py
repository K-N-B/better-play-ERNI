from django.contrib.auth.models import AbstractUser
from django.db import models
import pytz
from django.utils import timezone


class Department(models.Model):
    """Represents a department within the organization."""

    name = models.CharField(max_length=100, unique=True)
    total_points_alltime = models.BigIntegerField(default=0, db_index=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ["name"]


class User(AbstractUser):
    """
    Custom User model with Azure AD integration and role-based permissions.
    """

    # ========== ROLE SYSTEM (NEW) ==========
    class Role(models.TextChoices):
        """Define all available roles in the system"""
        SUPER_ADMIN = 'SUPER_ADMIN', 'Super Admin'
        CONTENT_ADMIN = 'CONTENT_ADMIN', 'Content Admin'
        MODERATOR = 'MODERATOR', 'Moderator'
        SHOP_MANAGER = 'SHOP_MANAGER', 'Shop Manager'
        USER = 'USER', 'Regular User'

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.USER,
        help_text="Assigns specific admin permissions to this user"
    )

    # ========== AZURE AD INTEGRATION ==========
    azure_id = models.CharField(
        max_length=255,
        unique=True,
        help_text="Azure AD Object ID (immutable identifier)",
    )

    # ========== TIMEZONE (PRESERVED - ORIGINAL FIELD) ==========
    timezone = models.CharField(
        max_length=50,
        default='Asia/Manila',
        choices=[(tz, tz) for tz in pytz.common_timezones],
        help_text="User's preferred timezone for date/time display"
    )

    # ========== PROFILE INFORMATION ==========
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="members",
    )
    profile_picture_url = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        help_text="URL to the user's profile picture (from Azure AD or cloud storage)",
    )
    profile_complete = models.BooleanField(
        default=False,
        help_text="Whether the user has completed their profile setup",
    )

    # ========== ADMIN FLAGS ==========
    is_admin = models.BooleanField(
        default=False,
        help_text="Legacy admin flag (deprecated - use role field instead)",
    )

    # ========== POINTS & GAMIFICATION ==========
    total_points_alltime = models.BigIntegerField(
        default=0,
        db_index=True,
        help_text="Total points earned across all time (read-only)",
    )
    current_points = models.BigIntegerField(
        default=0,
        db_index=True,
        help_text="Spendable points (can be used in shop)",
    )

    # ========== STREAK TRACKING ==========
    current_streak_count = models.PositiveIntegerField(
        default=0,
        help_text="Number of consecutive days with activity",
    )
    max_streak_count = models.PositiveIntegerField(
        default=0,
        help_text="Longest streak ever achieved",
    )
    last_active = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Last date user completed a puzzle (for streak tracking)",
    )

    # ========== CHALLENGE STATS ==========
    challenges_made_count = models.PositiveIntegerField(
        default=0,
        help_text="Total number of challenges sent to others",
    )

    class Meta:
        ordering = ["username"]
        indexes = [
            models.Index(fields=["azure_id"]),
            models.Index(fields=["department"]),
            models.Index(fields=["-total_points_alltime"]),
            models.Index(fields=["-current_points"]),
        ]

    def __str__(self):
        return self.username

    # ========== ROLE PERMISSION HELPERS ==========
    
    def is_super_admin(self):
        """Check if user is a super admin (Django superuser)"""
        return self.is_superuser
    
    def is_content_admin(self):
        """Check if user can manage game content (puzzles)"""
        return self.role == self.Role.CONTENT_ADMIN or self.is_superuser
    
    def is_moderator(self):
        """Check if user can moderate users and view gameplay data"""
        return self.role == self.Role.MODERATOR or self.is_superuser
    
    def is_shop_manager(self):
        """Check if user can manage shop rewards and claims"""
        return self.role == self.Role.SHOP_MANAGER or self.is_superuser
    
    def has_admin_access(self):
        """Check if user has any admin role OR is superuser"""
        if self.is_superuser:
            return True
        return self.role in [
            self.Role.CONTENT_ADMIN,
            self.Role.MODERATOR,
            self.Role.SHOP_MANAGER,
        ]
    
    def get_role_display_with_icon(self):
        """Get role display name with emoji for admin interface"""
        role_icons = {
            self.Role.CONTENT_ADMIN: '🎮',
            self.Role.MODERATOR: '🛡️',
            self.Role.SHOP_MANAGER: '🏪',
            self.Role.USER: '👤',
        }
        icon = role_icons.get(self.role, '👤')
        return f"{icon} {self.get_role_display()}"
    
    # ========== ADMIN STAFF OVERRIDE ==========
    
    @property
    def is_staff(self):
        """
        Override is_staff to grant admin access based on role.
        This allows Content Admins, Moderators, and Shop Managers to login to /admin/
        """
        return self.has_admin_access()
    
    @is_staff.setter
    def is_staff(self, value):
        """
        Allow is_staff to be set (needed for Django admin compatibility)
        """
        # Store in a private field if you need to preserve the original value
        # For now, we'll just pass since role determines staff status
        pass