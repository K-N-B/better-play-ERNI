# /gameplay/models.py
from django.db import models
from django.conf import settings  # Uses AUTH_USER_MODEL
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone


class PuzzleAttemptManager(models.Manager):
    def get_or_start_attempt(self, user, daily_puzzle, puzzle_instance):
        """
        Retrieves an existing PuzzleAttempt or creates a new one.
        'puzzle_instance' is the specific WordlePuzzle or SudokuPuzzle object.
        """
        # Get ContentType for the specific puzzle model
        puzzle_content_type = ContentType.objects.get_for_model(puzzle_instance)

        # Use the unique_together constraint fields to find the attempt
        attempt, created = self.get_or_create(
            user=user,
            daily_puzzle=daily_puzzle,
            content_type=puzzle_content_type,
            object_id=puzzle_instance.pk,
            defaults={
                "progress_data": {},  # Start with empty progress data
                "time_spent_ms": 0,
            },
        )
        return attempt, created


class PuzzleAttempt(models.Model):
    """Stores a user's in-progress game state for a specific day/puzzle."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="puzzle_attempts",
    )
    # Link to the specific set of daily puzzles being attempted
    daily_puzzle = models.ForeignKey(
        "games.DailyPuzzle", on_delete=models.CASCADE, related_name="attempts"
    )
    objects = PuzzleAttemptManager()

    # Generic Foreign Key to the specific puzzle model instance
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        help_text="Points to the model of the puzzle (WordlePuzzle, SudokuPuzzle, etc.)",
    )
    object_id = models.PositiveIntegerField(
        help_text="Primary key of the specific puzzle instance"
    )
    puzzle = GenericForeignKey("content_type", "object_id")

    # Game state and progress
    progress_data = models.JSONField(
        help_text="Stores game state (e.g., Sudoku grid, Wordle guesses)"
    )
    time_spent_ms = models.BigIntegerField(default=0)
    last_saved = models.DateTimeField(auto_now=True)  # Automatically updates on save

    class Meta:
        # Ensure a user only has one attempt saved per day/puzzle type/instance
        unique_together = ("user", "daily_puzzle", "content_type", "object_id")
        ordering = ["-last_saved"]

    def __str__(self):
        puzzle_repr = str(self.puzzle) if self.puzzle else f"Puzzle ID {self.object_id}"
        return f"Attempt by {self.user.username} on {puzzle_repr} ({self.daily_puzzle.date})"


class Submission(models.Model):
    """Logs every completed puzzle attempt. Source for leaderboards."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="submissions"
    )
    # --- Generic Foreign Key (Content Type) - KEEP ONLY ONE DEFINITION ---
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        help_text="Points to the model of the puzzle (WordlePuzzle, SudokuPuzzle, etc.)",
    )
    object_id = models.PositiveIntegerField(
        help_text="Primary key of the specific puzzle instance"
    )
    puzzle = GenericForeignKey("content_type", "object_id")
    # ------------------------------------------------------------------

    # Difficulty played
    difficulty = models.CharField(
        max_length=10,
        choices=[("easy", "Easy"), ("hard", "Hard")],
        default="easy",
        help_text="Difficulty level played",
    )

    # Submission results
    points_awarded = models.IntegerField()
    time_taken_ms = models.BigIntegerField(help_text="Time in milliseconds")
    tries = models.PositiveIntegerField(
        default=1, help_text="Number of guesses/attempts made"
    )
    created_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        # ... (rest of Meta remains the same)
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["created_at", "user"]),
            models.Index(fields=["created_at", "user", "points_awarded"]),
            models.Index(fields=["content_type", "object_id"]),
            models.Index(fields=["created_at", "difficulty"]),
        ]

    def __str__(self):
        puzzle_repr = (
            str(self.puzzle)
            if self.puzzle
            else f"{self.content_type.model} ID {self.object_id}"
        )
        return f"{self.user.username} - {puzzle_repr} ({self.difficulty}) - {self.points_awarded} pts"


class Challenge(models.Model):
    """Tracks an asynchronous challenge between two employees."""

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        COMPLETED = "COMPLETED", "Completed"
        EXPIRED = "EXPIRED", "Expired"  # Optional for future use

    challenger = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="challenges_sent",
        on_delete=models.CASCADE,
    )
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="challenges_received",
        on_delete=models.CASCADE,
    )
    # Link directly to the challenger's submission
    challenger_submission = models.OneToOneField(
        Submission,
        related_name="challenge_as_challenger",
        on_delete=models.CASCADE,
        help_text="The submission the challenger wants the recipient to beat",
    )
    # Link to the recipient's submission (once completed)
    recipient_submission = models.OneToOneField(
        Submission,
        related_name="challenge_as_recipient",
        on_delete=models.SET_NULL,  # Keep challenge record if submission deleted
        null=True,
        blank=True,
    )
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.PENDING
    )
    winner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="challenges_won",
        on_delete=models.SET_NULL,  # Keep challenge record if winner user deleted
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Challenge from {self.challenger.username} to {self.recipient.username} ({self.status})"


# ActivityEvent model is removed as per previous decision
