# /games/models.py
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError


class WordlePuzzle(models.Model):
    """ A single Wordle-style puzzle of varying length. """
    solution_word = models.CharField(
        max_length=15,
        help_text="The solution word (uppercase, 5 for easy, 6+ for hard)"
    )
    date_to_be_used = models.DateField(
        null=True, blank=True,
        help_text="Optional: Date this specific puzzle instance should appear"
    )

    DIFFICULTY_CHOICES = [
        ('EASY', 'Easy'),
        ('HARD', 'Hard'),
    ]
    difficulty = models.CharField(
        max_length=4,
        choices=DIFFICULTY_CHOICES,
        default='EASY'
    )

    @property
    def word_length(self):
        return len(self.solution_word)

    class Meta:
        # ADD THIS NEW, SMARTER RULE:
        # The combination of date and difficulty must be unique.
        constraints = [
            models.UniqueConstraint(
                fields=['date_to_be_used', 'difficulty'],
                name='unique_wordle_for_date_and_difficulty'
            )
        ]

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
        max_length=81,
        help_text="81 chars (1-9), the complete solution grid."
    )
    puzzle_string_easy = models.CharField(
        max_length=81,
        help_text="81 chars (0-9), 0 for blank. Easy version (~50 givens)."
    )
    puzzle_string_hard = models.CharField(
        max_length=81,
        help_text="81 chars (0-9), 0 for blank. Hard version (~40 givens)."
    )
    date_to_be_used = models.DateField(unique=True)

    def clean(self):
        # Basic validation for string lengths
        if len(self.solution_string) != 81:
            raise ValidationError(
                {'solution_string': "Solution string must be 81 characters."})
        if len(self.puzzle_string_easy) != 81:
            raise ValidationError(
                {'puzzle_string_easy': "Easy puzzle string must be 81 characters."})
        if len(self.puzzle_string_hard) != 81:
            raise ValidationError(
                {'puzzle_string_hard': "Hard puzzle string must be 81 characters."})
        # Add more validation if needed (e.g., check characters are digits)

    def __str__(self):
        return f"Sudoku {self.id} (Easy/Hard)"


class ErnigramPuzzle(models.Model):
    """ A single Hangman (ERNIgram) puzzle. """
    solution_phrase = models.CharField(
        max_length=255,
        help_text="The phrase to guess (uppercase recommended)"
    )
    clue = models.TextField()
    date_to_be_used = models.DateField(unique=True)

    employee_image = models.ImageField(
        upload_to='ernigram_employees/', # Saves to /media/ernigram_employees/
        blank=True,
        null=True,
        help_text="Upload a picture of the employee. This will be blurred on the frontend."
    )
    
    def save(self, *args, **kwargs):
        self.solution_phrase = self.solution_phrase.upper()  # Ensure uppercase on save
        super().save(*args, **kwargs)

    def __str__(self):
        return f"ERNIgram: {self.solution_phrase[:20]}... ({self.id})"


class DailyPuzzle(models.Model):
    """ Links a specific date to the puzzles active on that day. """
    date = models.DateField(
        unique=True, primary_key=True, default=timezone.now)
    wordle_easy = models.ForeignKey(
        WordlePuzzle,
        on_delete=models.PROTECT,  # Prevent deleting a Wordle puzzle if it's scheduled
        related_name='daily_puzzles_easy',
        limit_choices_to={'solution_word__length': 5},
        help_text="The 5-letter Wordle puzzle for the day (Easy difficulty)"
    )
    wordle_hard = models.ForeignKey(
        WordlePuzzle,
        on_delete=models.PROTECT,
        related_name='daily_puzzles_hard',
        limit_choices_to={'solution_word__length__gte': 6},
        help_text="The 6+ letter Wordle puzzle for the day (Hard difficulty)"
    )
    sudoku = models.ForeignKey(
        SudokuPuzzle,
        on_delete=models.PROTECT,
        related_name='daily_puzzles'
    )
    ernigram = models.ForeignKey(
        ErnigramPuzzle,
        on_delete=models.PROTECT,
        related_name='daily_puzzles'
    )

    class Meta:
        ordering = ['-date']  # Show most recent dates first

    def __str__(self):
        return f"Puzzles for {self.date.strftime('%Y-%m-%d')}"
