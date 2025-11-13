# users/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone  # Import timezone


class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)
    total_points_alltime = models.BigIntegerField(default=0)

    def __str__(self):
        return self.name


class User(AbstractUser):
    # Fields inherited from AbstractUser:
    # username (varchar 150, unique, not null)
    # email (varchar 254, unique, not null) - Note: AbstractUser allows blank=True by default
    # password (varchar 128, not null) - Handled by Django
    # first_name (varchar 150)
    # last_name (varchar 150)
    # is_staff (bool, default false)
    # is_active (bool, default true)
    # is_superuser (bool, default false)
    # date_joined (datetime, not null) - Handled by Django
    # last_login (datetime) - Handled by Django

    # --- Custom Fields from DBML ---
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,  # Sets department to NULL if Department is deleted
        null=True,  # Allows NULL in the database
        blank=True,  # Allows the field to be blank in forms/admin
    )
    profile_complete = models.BooleanField(default=False)
    is_admin = models.BooleanField(
        default=False,
        help_text="Designates whether the user can access custom website admin features.",
    )
    # Use auto_now=True to automatically update on every save
    last_active = models.DateTimeField(default=timezone.now, null=True)
    # New field for Azure AD specific ID (optional but can be useful)
    azure_id = models.CharField(
        max_length=255,
        unique=True,
        null=True,
        blank=True,
        help_text="Azure Active Directory Object ID",
    )

    # --- NEW FIELD FOR PROFILE PICTURE URL (FROM AZURE/GRAPH) ---
    profile_picture_url = models.URLField(
        max_length=500,  # Max length for a long URL
        null=True,
        blank=True,
        help_text="URL of the profile picture retrieved from Azure AD/Microsoft Graph.",
    )

    # --- Stats Fields from DBML ---
    total_points_alltime = models.BigIntegerField(default=0)
    current_points = models.BigIntegerField(
        default=0, help_text="Current spendable points balance."
    )
    current_streak_count = models.IntegerField(default=0)
    max_streak_count = models.IntegerField(default=0)
    challenges_made_count = models.IntegerField(default=0)

    # --- Timestamps ---
    # Note: 'date_joined' from AbstractUser acts like created_at for the user record itself.
    # If you need a separate updated_at timestamp specifically for your custom fields:
    updated_at = models.DateTimeField(auto_now=True)  # Automatically updates on save()

    # If you want email to be strictly required (like in DBML), override AbstractUser's default
    email = models.EmailField(blank=False, unique=True)  # Make email required and unique

    def __str__(self):
        return self.username
