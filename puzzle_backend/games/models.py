from django.db import models

class WordlePuzzle(models.Model):
    solution_word = models.CharField(max_length=50)
    date_to_be_used = models.DateField(unique=True)

    def __str__(self):
        return f"WordlePuzzle {self.date_to_be_used} - {self.solution_word}"

class SudokuPuzzle(models.Model):
    puzzle_string = models.TextField()
    solution_string = models.TextField()
    difficulty = models.CharField(max_length=20)
    date_to_be_used = models.DateField(unique=True)

    def __str__(self):
        return f"Sudoku {self.date_to_be_used} - {self.difficulty}"

class ErnigramPuzzle(models.Model):
    solution_phrase = models.CharField(max_length=200)
    clue = models.TextField()
    date_to_be_used = models.DateField(unique=True)

    def __str__(self):
        return f"Ernigram {self.date_to_be_used}"

class DailyPuzzle(models.Model):
    date = models.DateField(primary_key=True)
    wordle = models.ForeignKey(WordlePuzzle, on_delete=models.CASCADE)
    sudoku = models.ForeignKey(SudokuPuzzle, on_delete=models.CASCADE)
    ernigram = models.ForeignKey(ErnigramPuzzle, on_delete=models.CASCADE)

    def __str__(self):
        return f"DailyPuzzle {self.date}"
