# games/models.py - COMPLETE FILE WITH FIXED SUDOKU
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from .config import (
    ERNIGRAM_EASY_BASE_POINT,
    ERNIGRAM_EASY_MISTAKE_LIMITS,
    ERNIGRAM_EASY_TIME_LIMIT,
    ERNIGRAM_HARD_BASE_POINT,
    ERNIGRAM_HARD_MISTAKE_LIMITS,
    ERNIGRAM_HARD_TIME_LIMIT,
    SUDOKU_EASY_BASE_POINT,
    SUDOKU_EASY_HINT_LIMIT,
    SUDOKU_EASY_TIME_LIMIT,
    SUDOKU_HARD_BASE_POINT,
    SUDOKU_HARD_HINT_LIMIT,
    SUDOKU_HARD_TIME_LIMIT,
    SUDOKU_HINT_PENALTY,
    WORDLE_EASY_BASE_POINT,
    WORDLE_EASY_TIME_LIMIT,
    WORDLE_EASY_TRY_LIMITS,
    WORDLE_HARD_BASE_POINT,
    WORDLE_HARD_TIME_LIMIT,
    WORDLE_HARD_TRY_LIMITS,
)


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
        "EASY": WORDLE_EASY_BASE_POINT,
        "HARD": WORDLE_HARD_BASE_POINT,
    }
    GUESS_LIMITS = {
        "EASY": WORDLE_EASY_TRY_LIMITS,
        "HARD": WORDLE_HARD_TRY_LIMITS,
    }
    TIME_LIMITS_MS = {
        "EASY": WORDLE_EASY_TIME_LIMIT,
        "HARD": WORDLE_HARD_TIME_LIMIT,
    }

    @property
    def word_length(self):
        return len(self.solution_word)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["date_to_be_used", "difficulty"],
                name="unique_wordle_for_date_and_difficulty",
            )
        ]

    def validate_and_score(self, progress_data, difficulty="EASY"):
        """
        Calculates the score for Wordle puzzle.
        - Returns full points if status='SOLVED' and last guess is correct
        - Returns 0 points if status='LOST' (allows submission for completion tracking)
        """
        guesses = progress_data.get("guesses", [])
        tries = len(guesses)
        difficulty_upper = difficulty.upper()

        print(f"[WordlePuzzle.validate_and_score] Called")
        print(f"  Difficulty: {difficulty_upper}")
        print(f"  Guesses: {guesses}")
        print(f"  Tries: {tries}")
        
        status = progress_data.get("status", "ACTIVE").upper()
        print(f"  Status: {status}")
        
        # ✅ Allow LOST games to submit with 0 points
        if status == "LOST":
            print(f"[WordlePuzzle.validate_and_score] ✅ LOST game - Awarding 0 points")
            return 0, tries
        
        # For SOLVED games, verify the solution
        client_claims_solved = status == "SOLVED"
        is_correct_guess = tries > 0 and guesses[-1].upper() == self.solution_word.upper()
        
        if tries > 0:
            print(f"  Last guess: '{guesses[-1]}' vs Solution: '{self.solution_word}'")
            print(f"  Match: {is_correct_guess}")

        if not is_correct_guess or not client_claims_solved:
            print(f"[WordlePuzzle.validate_and_score] ❌ VALIDATION FAILED")
            return 0, tries

        # Award full points for won games
        points = self.BASE_POINTS.get(difficulty_upper, 0)
        print(f"[WordlePuzzle.validate_and_score] ✅ SUCCESS - Awarding {points} points")

        return points, tries

    def save(self, *args, **kwargs):
        self.solution_word = self.solution_word.upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Wordle ({self.word_length}-letter): {self.solution_word} ({self.id})"


class SudokuPuzzle(models.Model):
    """A single Sudoku puzzle with defined easy and hard starting grids"""

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

    BASE_POINTS = {
        "EASY": SUDOKU_EASY_BASE_POINT,
        "HARD": SUDOKU_HARD_BASE_POINT,
    }
    HINT_PENALTY_POINTS = SUDOKU_HINT_PENALTY
    HINT_LIMITS = {
        "EASY": SUDOKU_EASY_HINT_LIMIT,
        "HARD": SUDOKU_HARD_HINT_LIMIT,
    }

    def clean(self):
        if len(self.solution_string) != 81:
            raise ValidationError({"solution_string": "Solution string must be 81 characters."})
        if len(self.puzzle_string_easy) != 81:
            raise ValidationError({"puzzle_string_easy": "Easy puzzle string must be 81 characters."})
        if len(self.puzzle_string_hard) != 81:
            raise ValidationError({"puzzle_string_hard": "Hard puzzle string must be 81 characters."})

    def validate_and_score(self, progress_data, difficulty="EASY"):
        """
        Calculates the score and verifies the final Sudoku grid against the solution.
        Handles multiple input formats:
        - Grid array (list of lists with cell objects)
        - Dict with 'grid' key (grid array)
        - Dict with 'final_grid' key (81-char string)
        - String (direct 81-char grid)
        """
        difficulty = difficulty.upper()
        
        print(f"[SudokuPuzzle.validate_and_score] Called")
        print(f"  Difficulty: {difficulty}")
        print(f"  Progress data type: {type(progress_data)}")
        
        # ✅ Extract final_grid string and hints_used from various formats
        final_grid = None
        hints_used = 0
        
        if isinstance(progress_data, dict):
            print(f"  Progress data keys: {progress_data.keys()}")
            
            # Get hints_used if available
            hints_used = progress_data.get("hints_used", 0)
            
            # Priority 1: Check for 'final_grid' (string format)
            if "final_grid" in progress_data:
                final_grid = progress_data["final_grid"]
                print(f"  ✅ Using 'final_grid' string: {final_grid[:20]}...")
            
            # Priority 2: Check for 'grid' (array format) and convert
            elif "grid" in progress_data:
                grid_array = progress_data["grid"]
                final_grid = self._grid_to_string(grid_array)
                print(f"  ✅ Converted 'grid' array to string: {final_grid[:20]}...")
            
            else:
                print(f"  ❌ ERROR: Dict missing both 'final_grid' and 'grid' keys")
                return 0, hints_used
        
        elif isinstance(progress_data, list):
            # Direct grid array
            final_grid = self._grid_to_string(progress_data)
            print(f"  ✅ Converted list array to string: {final_grid[:20]}...")
        
        elif isinstance(progress_data, str):
            # Already a string
            final_grid = progress_data
            print(f"  ✅ Using string directly: {final_grid[:20]}...")
        
        else:
            print(f"  ❌ ERROR: Invalid progress_data type: {type(progress_data)}")
            return 0, hints_used
        
        # ✅ Validate final_grid
        if not final_grid or len(final_grid) != 81:
            print(f"  ❌ ERROR: Invalid final_grid length: {len(final_grid) if final_grid else 0}")
            return 0, hints_used
        
        # ✅ Check status (if provided)
        status = "ACTIVE"
        if isinstance(progress_data, dict):
            status = progress_data.get("status", "ACTIVE").upper()
        
        client_claims_solved = status == "SOLVED"
        print(f"  Status: {status} (claims solved: {client_claims_solved})")
        
        # ✅ Verify solution matches
        is_correct_grid = final_grid == self.solution_string
        
        print(f"  User solution:     {final_grid}")
        print(f"  Expected solution: {self.solution_string}")
        print(f"  Match: {is_correct_grid}")
        
        if not is_correct_grid:
            # Find first difference for debugging
            for i, (user_char, solution_char) in enumerate(zip(final_grid, self.solution_string)):
                if user_char != solution_char:
                    row, col = divmod(i, 9)
                    print(f"  ❌ First difference at position {i} (row {row}, col {col}): got '{user_char}', expected '{solution_char}'")
                    break
            print(f"[SudokuPuzzle.validate_and_score] ❌ VALIDATION FAILED - Grid doesn't match")
            return 0, hints_used
        
        # ✅ Optional: Also check client status flag (for extra validation)
        # Uncomment if you want to enforce status='SOLVED' in progress_data
        # if not client_claims_solved:
        #     print(f"[SudokuPuzzle.validate_and_score] ❌ VALIDATION FAILED - Status not SOLVED")
        #     return 0, hints_used
        
        # ✅ Calculate score
        base_points = self.BASE_POINTS.get(difficulty, 0)
        penalty = hints_used * self.HINT_PENALTY_POINTS
        points = max(0, base_points - penalty)
        
        print(f"  Base points: {base_points}")
        print(f"  Hints used: {hints_used}")
        print(f"  Penalty: {penalty}")
        print(f"  Final points: {points}")
        print(f"[SudokuPuzzle.validate_and_score] ✅ SUCCESS - Awarding {points} points")
        
        return points, hints_used

    def _grid_to_string(self, grid_array):
        """
        Convert a 9x9 grid array to an 81-character string.
        Handles grid cells that are either:
        - Dicts with 'value' key: {value: 5, isGiven: true, ...}
        - Direct integers: 5
        - None/null values: converted to 0
        """
        if not isinstance(grid_array, list) or len(grid_array) != 9:
            print(f"  ❌ Invalid grid_array: not a 9-length list")
            return ""
        
        result = ""
        for row_idx, row in enumerate(grid_array):
            if not isinstance(row, list) or len(row) != 9:
                print(f"  ❌ Invalid row {row_idx}: not a 9-length list")
                return ""
            
            for col_idx, cell in enumerate(row):
                if isinstance(cell, dict):
                    # Cell is {value: X, isGiven: bool, isError: bool, notes: []}
                    value = cell.get('value')
                    if value is None or value == 0:
                        result += '0'
                    else:
                        result += str(value)
                elif isinstance(cell, (int, float)):
                    # Cell is just a number
                    if cell == 0 or cell is None:
                        result += '0'
                    else:
                        result += str(int(cell))
                elif cell is None:
                    result += '0'
                else:
                    print(f"  ❌ Invalid cell at ({row_idx},{col_idx}): {type(cell)}")
                    result += '0'
        
        print(f"  Converted grid to string: length={len(result)}")
        return result

    def __str__(self):
        return f"Sudoku {self.id} (Easy/Hard)"


class EmployeeImageSource(models.Model):
    """Stores the source image file and metadata for the 'Guess the Employee' puzzle."""
    
    employee_name = models.CharField(
        max_length=100, 
        unique=True,
        help_text="Full name of the employee (The solution phrase)."
    )
    
    clue_context = models.CharField(
        max_length=255, 
        blank=True, 
        help_text="Role or project context for the AI clue."
    )
    
    image_file = models.ImageField(
        upload_to='ernigram_employees/',
        help_text="Upload a picture of the employee."
    )
    
    is_available = models.BooleanField(default=True)
    
    def __str__(self):
        return self.employee_name

    class Meta:
        verbose_name = "Employee Image Source"
        verbose_name_plural = "Employee Image Sources"


class ErnigramPuzzle(models.Model):
    """A single Hangman (ERNIgram) puzzle."""

    solution_phrase = models.CharField(
        max_length=255, help_text="The phrase to guess (uppercase recommended)"
    )
    clue = models.TextField()
    date_to_be_used = models.DateField(unique=True)

    employee_source = models.ForeignKey(
        EmployeeImageSource,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        help_text="A link to the employee source if this is an employee puzzle."
    )
    
    TIME_LIMITS_MS = {
        "EASY": ERNIGRAM_EASY_TIME_LIMIT,
        "HARD": ERNIGRAM_HARD_TIME_LIMIT,
    }

    MISTAKE_LIMITS = {
        "EASY": ERNIGRAM_EASY_MISTAKE_LIMITS,
        "HARD": ERNIGRAM_HARD_MISTAKE_LIMITS,
    }

    BASE_POINTS = {
        "EASY": ERNIGRAM_EASY_BASE_POINT,
        "HARD": ERNIGRAM_HARD_BASE_POINT,
    }

    def validate_and_score(self, progress_data, difficulty="EASY"):
        misses = progress_data.get("misses", 0)
        difficulty = difficulty.upper()

        status = progress_data.get("status", "ACTIVE").upper()
        is_solved = status == "SOLVED"

        if not is_solved:
            return 0, misses

        points = self.BASE_POINTS.get(difficulty, 0)
        return points, misses

    def save(self, *args, **kwargs):
        self.solution_phrase = self.solution_phrase.upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"ERNIgram: {self.solution_phrase[:20]}... ({self.id})"


class DailyPuzzle(models.Model):
    """Links a specific date to the puzzles active on that day."""

    date = models.DateField(unique=True, primary_key=True, default=timezone.now)

    wordle_easy = models.ForeignKey(
        WordlePuzzle,
        on_delete=models.PROTECT,
        related_name="daily_wordle_easy",
        limit_choices_to={"difficulty": "EASY"},
        help_text="The 5-letter Wordle puzzle for the day (Easy difficulty)",
    )
    wordle_hard = models.ForeignKey(
        WordlePuzzle,
        on_delete=models.PROTECT,
        related_name="daily_wordle_hard",
        limit_choices_to={"difficulty": "HARD"},
        help_text="The 6+ letter Wordle puzzle for the day (Hard difficulty)",
    )

    sudoku = models.ForeignKey(
        SudokuPuzzle,
        on_delete=models.PROTECT,
        related_name="daily_sudokus",
    )

    ernigram = models.ForeignKey(
        ErnigramPuzzle,
        on_delete=models.PROTECT,
        related_name="daily_ernigrams",
    )

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return f"Puzzles for {self.date.strftime('%Y-%m-%d')}"