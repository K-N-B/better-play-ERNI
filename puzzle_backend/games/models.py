from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models

class WordlePuzzle(models.Model):
    """Model to store the solution for a daily Wordle puzzle."""
    solution_word = models.CharField(max_length=15)
    date_to_be_used = models.DateField(unique=True)

    def __str__(self):
        return f"Wordle for {self.date_to_be_used}: {self.solution_word}"

class SudokuPuzzle(models.Model):
    """Model to store solution and puzzle strings for a daily Sudoku."""
    solution_string = models.CharField(max_length=81)
    puzzle_string_easy = models.CharField(max_length=81)
    puzzle_string_hard = models.CharField(max_length=81)
    date_to_be_used = models.DateField(unique=True)

    def __str__(self):
        return f"Sudoku for {self.date_to_be_used}"

class ErnigramPuzzle(models.Model):
    """Model to store an Ernigram puzzle (a phrase-guessing game)."""
    solution_phrase = models.CharField(max_length=255)
    clue = models.TextField()
    date_to_be_used = models.DateField(unique=True)

    def __str__(self):
        return f"Ernigram for {self.date_to_be_used}"

class DailyPuzzle(models.Model):
    """Links all individual puzzles together for a specific day."""
    date = models.DateField(primary_key=True)
    wordle_easy = models.ForeignKey(
        WordlePuzzle,
        on_delete=models.CASCADE,
        related_name='daily_easy'
    )
    wordle_hard = models.ForeignKey(
        WordlePuzzle,
        on_delete=models.CASCADE,
        related_name='daily_hard'
    )
    sudoku = models.ForeignKey(SudokuPuzzle, on_delete=models.CASCADE)
    ernigram = models.ForeignKey(ErnigramPuzzle, on_delete=models.CASCADE)

    def __str__(self):
        return f"Puzzles for {self.date}"

class PuzzleAttempt(models.Model):
    """
    Tracks a user's attempt on a specific puzzle for a given day.
    Uses a GenericForeignKey to link to any of the puzzle models.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    daily_puzzle = models.ForeignKey(DailyPuzzle, on_delete=models.CASCADE, to_field='date')

    # Generic ForeignKey to link to Wordle, Sudoku, or Ernigram puzzle models
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    puzzle_object = GenericForeignKey('content_type', 'object_id')

    # Gameplay tracking fields
    progress_data = models.JSONField(blank=True, null=True)
    time_spent_ms = models.BigIntegerField(default=0)
    last_saved = models.DateTimeField(auto_now=True)

    class Meta:
        # Ensures a user can only have one attempt record per daily puzzle
        unique_together = ('user', 'daily_puzzle')
        # Index for faster lookups on the generic foreign key
        index_together = (('content_type', 'object_id'),)

    def __str__(self):
        return f"{self.user}'s attempt on {self.daily_puzzle.date}"