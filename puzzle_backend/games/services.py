# games/services.py
import datetime
from .models import WordlePuzzle, SudokuPuzzle, ErnigramPuzzle, DailyPuzzle
from games.utils.timezone_helpers import get_local_today


def _generate_unique_wordle_data(difficulty, date_to_be_used):
    if difficulty == "EASY":
        solution = "APPLE" if date_to_be_used.day % 2 == 0 else "GRAPE"
    else:
        solution = "CHALLENGE" if date_to_be_used.day % 2 == 0 else "PUZZLER"
    return {"solution_word": solution.upper(), "difficulty": difficulty}


def _generate_unique_sudoku_data(date_to_be_used):
    if date_to_be_used.day % 3 == 0:
        puzzle_string = "003020600900305001001806400008102900700000008006708200002609500800203009005010300"
    elif date_to_be_used.day % 3 == 1:
        puzzle_string = "000000010400000000020000000000050400000000000000000000000000000000000000000000000"
    else:
        puzzle_string = "900000000080000000007000000000600000000050000000040000000003000000002000000000010"
    return {"puzzle_string_easy": puzzle_string, "puzzle_string_hard": puzzle_string}


def _generate_unique_ernigram_data(date_to_be_used):
    if date_to_be_used.day % 2 == 0:
        return {
            "solution_phrase": "DJANGO REST FRAMEWORK",
            "clue": "Popular Python API framework"
        }
    else:
        return {
            "solution_phrase": "PYTHON PROGRAMMING",
            "clue": "General purpose language"
        }


# --- Main generator ---
def generate_daily_puzzles(target_date: datetime.date | None = None) -> DailyPuzzle:
    """
    Generates and saves a full set of daily puzzles for the given date.
    If no date is provided, defaults to today.
    """
    if target_date is None:
        target_date = get_local_today()

    # Avoid duplicate creation
    existing = DailyPuzzle.objects.filter(date=target_date).first()
    if existing:
        return existing

    # --- Generate data ---
    wordle_easy_data = _generate_unique_wordle_data("EASY", target_date)
    wordle_hard_data = _generate_unique_wordle_data("HARD", target_date)
    sudoku_data = _generate_unique_sudoku_data(target_date)
    ernigram_data = _generate_unique_ernigram_data(target_date)

    # --- Create puzzles ---
    wordle_easy = WordlePuzzle.objects.create(
        date_to_be_used=target_date, **wordle_easy_data)
    wordle_hard = WordlePuzzle.objects.create(
        date_to_be_used=target_date, **wordle_hard_data)
    sudoku = SudokuPuzzle.objects.create(
        date_to_be_used=target_date, **sudoku_data)
    ernigram = ErnigramPuzzle.objects.create(
        date_to_be_used=target_date, **ernigram_data)

    # --- Create daily puzzle set ---
    daily_puzzle_set = DailyPuzzle.objects.create(
        date=target_date,
        wordle_easy=wordle_easy,
        wordle_hard=wordle_hard,
        sudoku=sudoku,
        ernigram=ernigram,
    )

    return daily_puzzle_set
