# activity/models.py
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class UserActivity(models.Model):
    """
    Tracks user online status via heartbeat mechanism.
    Updated every time user sends a heartbeat (every 30s from frontend).
    """
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        primary_key=True,
        related_name='activity_status'
    )
    last_active = models.DateTimeField(auto_now=True, db_index=True)
    
    class Meta:
        verbose_name = "User Activity"
        verbose_name_plural = "User Activities"
        indexes = [
            models.Index(fields=['last_active']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - Last active: {self.last_active}"