from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone # Import timezone

class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)
    total_points_alltime = models.BigIntegerField(default=0)

    def __str__(self):
        return self.name

class User(AbstractUser):
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    profile_complete = models.BooleanField(default=False)
    is_admin = models.BooleanField(
        default=False,
        help_text='Designates whether the user can access website admin features.'
    )
    total_points_alltime = models.BigIntegerField(default=0)
    current_streak_count = models.IntegerField(default=0)
    max_streak_count = models.IntegerField(default=0)
    challenges_made_count = models.IntegerField(default=0)
    last_active = models.DateTimeField(default=timezone.now) # Use default=timezone.now

    # You might want to remove email from REQUIRED_FIELDS if using SSO mainly
    # REQUIRED_FIELDS = []