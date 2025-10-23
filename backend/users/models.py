from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    """
    Custom user model with Azure SSO integration (Sprint 1)
    + Gaming platform fields (Sprint 2)
    """
    
    # ============================================
    # SPRINT 1 FIELDS (Azure SSO)
    # ============================================
    azure_id = models.CharField(max_length=255, unique=True)
    email = models.EmailField(unique=True)
    display_name = models.CharField(max_length=255)
    avatar_url = models.URLField(blank=True, null=True)
    
    # ============================================
    # SPRINT 2 FIELDS (Gaming Platform)
    # ============================================
    
    # Points tracking (denormalized for performance)
    total_points_daily = models.IntegerField(default=0)
    total_points_weekly = models.IntegerField(default=0)
    total_points_monthly = models.IntegerField(default=0)
    total_points_alltime = models.IntegerField(default=0)
    
    # Streak tracking (denormalized from Streak model)
    current_streak_count = models.IntegerField(default=0)
    max_streak_count = models.IntegerField(default=0)
    
    # Activity tracking
    last_active = models.DateTimeField(default=timezone.now)
    
    # ============================================
    # METADATA
    # ============================================
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # ============================================
    # FIX FOR REVERSE ACCESSOR CLASHES
    # ============================================
    # Override groups and user_permissions with related_name to avoid clashes
    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to.',
        related_name='custom_user_set',  # Changed from default 'user_set'
        related_query_name='custom_user',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name='custom_user_set',  # Changed from default 'user_set'
        related_query_name='custom_user',
    )
    
    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['azure_id']),
            models.Index(fields=['-total_points_alltime']),
            models.Index(fields=['-last_active']),
        ]
    
    def __str__(self):
        return self.username