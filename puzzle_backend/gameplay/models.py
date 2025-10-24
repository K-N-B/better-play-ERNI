from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from games.models import DailyPuzzle

User = get_user_model()

class PuzzleAttempt(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    daily_puzzle = models.ForeignKey(DailyPuzzle, on_delete=models.CASCADE)

    # Generic foreign key so one model can reference any puzzle type
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    puzzle = GenericForeignKey('content_type', 'object_id')

    progress_data = models.JSONField(default=dict)  # store guesses, board state, etc.
    time_spent_ms = models.BigIntegerField(default=0)
    completed = models.BooleanField(default=False)  # useful for scoring later
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user} - {self.puzzle} ({self.daily_puzzle.date})"
