from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.exceptions import ValidationError

def validate_erni_email(value):
    if not value.endswith('@betterask.erni'):
        raise ValidationError('Only @betterask.erni email addresses are allowed.')

class User(AbstractUser):
    email = models.EmailField(unique=True, validators=[validate_erni_email])
    is_admin_user = models.BooleanField(default=False)
    total_points = models.IntegerField(default=0)
    puzzles_completed = models.IntegerField(default=0)
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email

    class Meta:
        ordering = ['-total_points']