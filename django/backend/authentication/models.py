from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.exceptions import ValidationError
from .validators import validate_erni_email, validate_email_comprehensive

class User(AbstractUser):
    email = models.EmailField(
        unique=True, 
        validators=[validate_erni_email],
        help_text="Must be a valid @betterask.erni email address"
    )
    is_admin_user = models.BooleanField(default=False)
    total_points = models.IntegerField(default=0)
    puzzles_completed = models.IntegerField(default=0)
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    email_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def clean(self):
        super().clean()
        # Comprehensive email validation
        is_valid, error_msg = validate_email_comprehensive(self.email)
        if not is_valid:
            raise ValidationError({'email': error_msg})

    def __str__(self):
        return self.email

    class Meta:
        ordering = ['-total_points']