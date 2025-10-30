# /games/models.py
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from .config import *


class WordlePuzzle(models.Model):
    """A single Wordle-style puzzle of varying length."""

    solution_word = models.CharField(
        max_length=15,
        help_text="The solution word (uppercase, 5 for easy, 6+ for hard)",
    )
    date_to_be_used = models.DateField(
        null=True,
        blank=True,
        help_text="Optional: Date this specific puzzle instance should appear",
    )

    DIFFICULTY_CHOICES = [
        ("EASY", "Easy"),
        ("HARD", "Hard"),
    ]
    difficulty = models.CharField(max_length=4, choices=DIFFICULTY_CHOICES, default="EASY")
    BASE_POINTS = {
        # Assuming imported values are 100 and 200
        "EASY": WORDLE_EASY_BASE_POINT,
        "HARD": WORDLE_HARD_BASE_POINT,
    }
    GUESS_LIMITS = {
        "EASY": WORDLE_EASY_TRY_LIMITS,
        "HARD": WORDLE_HARD_TRY_LIMITS,
    }
    TIME_LIMITS_MS = {
        "EASY": WORDLE_EASY_TIME_LIMIT,  # 5 minutes * 60 seconds/min * 1000 ms/second
        "HARD": WORDLE_HARD_TIME_LIMIT,  # 7 minutes * 60 seconds/min * 1000 ms/second
    }

    @property
    def word_length(self):
        return len(self.solution_word)

    class Meta:
        # ADD THIS NEW, SMARTER RULE:
        # The combination of date and difficulty must be unique.
        constraints = [
            models.UniqueConstraint(
                fields=["date_to_be_used", "difficulty"],
                name="unique_wordle_for_date_and_difficulty",
            )
        ]

    # --- UPDATED: validate_and_score method ---
    # NOTE: The difficulty argument is now required to look up the base score.
    def validate_and_score(self, progress_data, difficulty="EASY"):
        """
        Calculates the score and verifies the final Wordle puzzle against the solution.
        Requires: 'status' to be 'SOLVED' AND the last guess to be the solution.
        """
        guesses = progress_data.get("guesses", [])
        tries = len(guesses)
        difficulty_upper = difficulty.upper()

        # --- NEW: Check for the explicit API status sent by the client ---
        status = progress_data.get("status", "ACTIVE").upper()
        client_claims_solved = status == "SOLVED"

        # 1. Verification: Check if the last guess is the solution AND client submitted a SOLVED status
        is_correct_guess = tries > 0 and guesses[-1].upper() == self.solution_word.upper()

        # The submission is only valid if BOTH the client claims success AND the guess is correct
        if not is_correct_guess or not client_claims_solved:
            return 0, tries

        # 2. Scoring: Award full base points based on difficulty.
        points = self.BASE_POINTS.get(difficulty_upper, 0)

        # Returns (points_awarded, tries_taken)
        return points, tries

    def save(self, *args, **kwargs):
        self.solution_word = self.solution_word.upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Wordle ({self.word_length}-letter): {self.solution_word} ({self.id})"


class SudokuPuzzle(models.Model):
    """
    A single Sudoku puzzle with defined easy and hard starting grids
    derived from the same solution.
    """

    solution_string = models.CharField(
        max_length=81, help_text="81 chars (1-9), the complete solution grid."
    )
    puzzle_string_easy = models.CharField(
        max_length=81,
        help_text="81 chars (0-9), 0 for blank. Easy version (~50 givens).",
    )
    puzzle_string_hard = models.CharField(
        max_length=81,
        help_text="81 chars (0-9), 0 for blank. Hard version (~40 givens).",
    )
    date_to_be_used = models.DateField(unique=True)

    TIME_LIMITS_MS = {
        "EASY": SUDOKU_EASY_TIME_LIMIT,
        "HARD": SUDOKU_HARD_TIME_LIMIT,
    }

    # Base Points and Penalties
    BASE_POINTS = {
        "EASY": SUDOKU_EASY_BASE_POINT,
        "HARD": SUDOKU_HARD_BASE_POINT,
    }
    HINT_PENALTY_POINTS = SUDOKU_HINT_PENALTY  # 20 pts subtraction for each hint used
    HINT_LIMITS = {
        "EASY": SUDOKU_EASY_HINT_LIMIT,  # 5 hints max
        "HARD": SUDOKU_HARD_HINT_LIMIT,
    }

    def clean(self):
        # Basic validation for string lengths
        if len(self.solution_string) != 81:
            raise ValidationError({"solution_string": "Solution string must be 81 characters."})
        if len(self.puzzle_string_easy) != 81:
            raise ValidationError(
                {"puzzle_string_easy": "Easy puzzle string must be 81 characters."}
            )
        if len(self.puzzle_string_hard) != 81:
            raise ValidationError(
                {"puzzle_string_hard": "Hard puzzle string must be 81 characters."}
            )
        # Add more validation if needed (e.g., check characters are digits)

    def validate_and_score(self, progress_data, difficulty="EASY"):
        """
        Calculates the score and verifies the final Sudoku grid against the solution.
        Requires: 'status' to be 'SOLVED' and 'final_grid' to match the solution.
        """
        final_grid = progress_data.get("final_grid", "")
        hints_used = progress_data.get("hints_used", 0)
        difficulty = difficulty.upper()

        # --- NEW: Check for the explicit API status sent by the client ---
        status = progress_data.get("status", "ACTIVE").upper()
        client_claims_solved = status == "SOLVED"

        # 1. Verification: Grid must match the solution AND client must claim success
        is_correct_grid = final_grid == self.solution_string

        # The server confirms the grid is correct, but only proceeds if the client submitted a 'SOLVED' status.
        if not client_claims_solved or not is_correct_grid or len(final_grid) != 81:
            return 0, hints_used

        # 2. Scoring Calculation
        base_points = self.BASE_POINTS.get(difficulty, 0)
        penalty = hints_used * self.HINT_PENALTY_POINTS

        # Final Score: Ensures points do not drop below zero
        points = max(0, base_points - penalty)

        return points, hints_used

    def __str__(self):
        return f"Sudoku {self.id} (Easy/Hard)"


class ErnigramPuzzle(models.Model):
    """A single Hangman (ERNIgram) puzzle."""

    solution_phrase = models.CharField(
        max_length=255, help_text="The phrase to guess (uppercase recommended)"
    )
    clue = models.TextField()
    date_to_be_used = models.DateField(unique=True)

    employee_image = models.ImageField(
        upload_to="ernigram_employees/",  # Saves to /media/ernigram_employees/
        blank=True,
        null=True,
        help_text="Upload a picture of the employee. This will be blurred on the frontend.",
    )
    TIME_LIMITS_MS = {
        "EASY": ERNIGRAM_EASY_TIME_LIMIT,
        "HARD": ERNIGRAM_HARD_TIME_LIMIT,
    }

    # Mistake Limits (Used for the 'tries' field in Submission)
    MISTAKE_LIMITS = {
        "EASY": ERNIGRAM_EASY_MISTAKE_LIMITS,  # 6 mistake letters max
        "HARD": ERNIGRAM_HARD_MISTAKE_LIMITS,  # 4 mistake letters max
    }

    # Base Points (Fixed score if solved)
    BASE_POINTS = {
        "EASY": ERNIGRAM_EASY_BASE_POINT,
        "HARD": ERNIGRAM_HARD_BASE_POINT,
    }

    def validate_and_score(self, progress_data, difficulty="EASY"):
        # FIX: Ensure 'misses' has a default value if not present in progress_data
        misses = progress_data.get("misses", 0)
        difficulty = difficulty.upper()

        status = progress_data.get("status", "ACTIVE").upper()
        is_solved = status == "SOLVED"

        # 1. Verification: Must be explicitly marked as solved
        if not is_solved:
            # FIX: Return tries/misses count even if not solved (for stat tracking)
            return 0, misses

        points = self.BASE_POINTS.get(difficulty, 0)
        return points, misses

    def save(self, *args, **kwargs):
        self.solution_phrase = self.solution_phrase.upper()  # Ensure uppercase on save
        super().save(*args, **kwargs)

    def __str__(self):
        return f"ERNIgram: {self.solution_phrase[:20]}... ({self.id})"


class DailyPuzzle(models.Model):
    """Links a specific date to the puzzles active on that day."""

    date = models.DateField(unique=True, primary_key=True, default=timezone.now)
    wordle_easy = models.ForeignKey(
        WordlePuzzle,
        on_delete=models.PROTECT,  # Prevent deleting a Wordle puzzle if it's scheduled
        related_name="daily_wordle_easy",
        limit_choices_to={"solution_word__length": 5},
        help_text="The 5-letter Wordle puzzle for the day (Easy difficulty)",
    )
    wordle_hard = models.ForeignKey(
        WordlePuzzle,
        on_delete=models.PROTECT,
        related_name="daily_wordle_hard",
        limit_choices_to={"solution_word__length__gte": 6},
        help_text="The 6+ letter Wordle puzzle for the day (Hard difficulty)",
    )
    sudoku = models.ForeignKey(SudokuPuzzle, on_delete=models.PROTECT, related_name="daily_sudokus")
    ernigram = models.ForeignKey(
        ErnigramPuzzle, on_delete=models.PROTECT, related_name="daily_ernigrams"
    )

    class Meta:
        ordering = ["-date"]  # Show most recent dates first

    def __str__(self):
        return f"Puzzles for {self.date.strftime('%Y-%m-%d')}"
