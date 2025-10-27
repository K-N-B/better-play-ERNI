# games/models.py
from django.db import models

class WordlePuzzle(models.Model):
    solution_word = models.CharField(max_length=50)
    date_to_be_used = models.DateField(unique=True, db_index=True)

    class Meta:
        ordering = ['-date_to_be_used']
        verbose_name = "Wordle Puzzle"
        verbose_name_plural = "Wordle Puzzles"

    def __str__(self):
        return f"Wordle {self.date_to_be_used} - {self.solution_word}"


class SudokuPuzzle(models.Model):
    puzzle_string = models.TextField()
    solution_string = models.TextField()
    difficulty = models.CharField(max_length=20)
    date_to_be_used = models.DateField(unique=True, db_index=True)

    class Meta:
        ordering = ['-date_to_be_used']
        verbose_name = "Sudoku Puzzle"
        verbose_name_plural = "Sudoku Puzzles"

    def __str__(self):
        return f"Sudoku {self.date_to_be_used} - {self.difficulty}"


class ErnigramPuzzle(models.Model):
    solution_phrase = models.CharField(max_length=200)
    clue = models.TextField()
    date_to_be_used = models.DateField(unique=True, db_index=True)

    class Meta:
        ordering = ['-date_to_be_used']
        verbose_name = "Ernigram Puzzle"
        verbose_name_plural = "Ernigram Puzzles"

    def __str__(self):
        return f"Ernigram {self.date_to_be_used}"


class DailyPuzzle(models.Model):
    date = models.DateField(primary_key=True, db_index=True)
    wordle = models.ForeignKey(
        WordlePuzzle, 
        on_delete=models.CASCADE,
        related_name='daily_puzzle'
    )
    sudoku = models.ForeignKey(
        SudokuPuzzle, 
        on_delete=models.CASCADE,
        related_name='daily_puzzle',
        null=True,  # Make optional for now
        blank=True
    )
    ernigram = models.ForeignKey(
        ErnigramPuzzle, 
        on_delete=models.CASCADE,
        related_name='daily_puzzle',
        null=True,  # Make optional for now
        blank=True
    )

    class Meta:
        ordering = ['-date']
        verbose_name = "Daily Puzzle"
        verbose_name_plural = "Daily Puzzles"

    def __str__(self):
        return f"Daily Puzzle {self.date}"