# gameplay/models.py
from django.db import models
from django.contrib.auth import get_user_model
from games.models import WordlePuzzle, SudokuPuzzle, ErnigramPuzzle

User = get_user_model()

class PuzzleAttempt(models.Model):
    """Tracks in-progress games (save/resume functionality)"""
    PUZZLE_TYPES = [
        ('wordle', 'Wordle'),
        ('sudoku', 'Sudoku'),
        ('ernigram', 'Ernigram'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='puzzle_attempts')
    puzzle_type = models.CharField(max_length=20, choices=PUZZLE_TYPES)
    puzzle_id = models.PositiveIntegerField()  # ID of specific puzzle
    
    progress_data = models.JSONField(default=dict)  # Store game state
    time_spent_ms = models.BigIntegerField(default=0)
    completed = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        # One active attempt per user per puzzle
        unique_together = ('user', 'puzzle_type', 'puzzle_id')
        indexes = [
            models.Index(fields=['user', 'puzzle_type', 'completed']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.puzzle_type} (#{self.puzzle_id})"


class Submission(models.Model):
    """Records completed puzzle submissions for scoring/leaderboards"""
    PUZZLE_TYPES = [
        ('wordle', 'Wordle'),
        ('sudoku', 'Sudoku'),
        ('ernigram', 'Ernigram'),
    ]
    
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('hard', 'Hard'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='submissions')
    puzzle_type = models.CharField(max_length=20, choices=PUZZLE_TYPES, db_index=True)
    puzzle_id = models.PositiveIntegerField()
    puzzle_date = models.DateField(db_index=True)  # Date of the puzzle (for daily tracking)
    
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES)
    points_awarded = models.IntegerField(default=0, db_index=True)
    time_taken_ms = models.BigIntegerField()  # Total time in milliseconds
    tries = models.IntegerField()  # Number of guesses/attempts
    
    # Optional: Store final game state for review
    final_state = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        # One submission per user per puzzle per day
        unique_together = ('user', 'puzzle_type', 'puzzle_date')
        indexes = [
            models.Index(fields=['puzzle_date', 'puzzle_type']),
            models.Index(fields=['user', 'puzzle_date']),
            models.Index(fields=['points_awarded', 'puzzle_date']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.puzzle_type} ({self.puzzle_date}) - {self.points_awarded}pts"