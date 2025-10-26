# games/services.py
import datetime
from datetime import timedelta
from django.utils import timezone
from .models import WordlePuzzle, SudokuPuzzle, ErnigramPuzzle, DailyPuzzle
from .ai_service import WordleGeneratorAI


def _generate_unique_wordle_data(ai_generator, difficulty, existing_words):
    max_retries = 3
    for attempt in range(max_retries):
        print(
            f"Generating '{difficulty}' Wordle puzzle using AI (Attempt {attempt + 1}/{max_retries})...")
        puzzle_data = ai_generator.generate_wordle_puzzle_data(
            difficulty=difficulty,
            existing_words=existing_words
        )
        if puzzle_data:
            print(f"✓ AI generation successful for '{difficulty}' puzzle.")
            return {
                "solution_word": puzzle_data['word'],
                "difficulty": difficulty
            }
        print(f"⚠ AI generation failed on attempt {attempt + 1}. Retrying...")
    raise Exception(
        f"AI failed to generate a valid puzzle for difficulty '{difficulty}' after {max_retries} attempts.")


def _generate_unique_sudoku_data(date_to_be_used):
    if date_to_be_used.day % 3 == 0:
        puzzle_string = "003020600900305001001806400008102900700000008006708200002609500800203009005010300"
    elif date_to_be_used.day % 3 == 1:
        puzzle_string = "000000010400000000020000000000050400000000000000000000000000000000000000000000000"
    else:
        puzzle_string = "900000000080000000007000000000600000000050000000040000000003000000002000000000010"
    return {"puzzle_string_easy": puzzle_string, "puzzle_string_hard": puzzle_string, "date_to_be_used": date_to_be_used}


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
def generate_daily_puzzles(target_date: datetime.date = None) -> DailyPuzzle:
    """
    Generates a full set of daily puzzles using AI for Wordle.
    """
    if target_date is None:
        target_date = timezone.now().date()
    print(f"Generating daily puzzles for date: {target_date}")

    # 1. Initialize the AI service
    ai_generator = WordleGeneratorAI()

    # 2. Fetch recent words to avoid repetition
    thirty_days_ago = target_date - timedelta(days=30)
    existing_words = list(
        WordlePuzzle.objects.filter(
            date_to_be_used__gte=thirty_days_ago
        ).values_list('solution_word', flat=True)
    )
    existing_words = [word.upper() for word in existing_words if word]

    # 3. Generate individual puzzle data
    wordle_easy_data = _generate_unique_wordle_data(
        ai_generator, 'EASY', existing_words)
    if wordle_easy_data.get('solution_word'):
        existing_words.append(wordle_easy_data['solution_word'])
    wordle_hard_data = _generate_unique_wordle_data(
        ai_generator, 'HARD', existing_words)

    sudoku_data = _generate_unique_sudoku_data(target_date)
    # --- FIX IS HERE ---
    # The call to generate Ernigram data now correctly provides TWO arguments.
    ernigram_data = _generate_unique_ernigram_data(target_date)

    # 4. Create the puzzle objects in the database
    wordle_easy = WordlePuzzle.objects.create(
        date_to_be_used=target_date, **wordle_easy_data)
    wordle_hard = WordlePuzzle.objects.create(
        date_to_be_used=target_date, **wordle_hard_data)
    # Make sure the date field isn't duplicated
    sudoku_data.pop("date_to_be_used", None)
    sudoku = SudokuPuzzle.objects.create(
        date_to_be_used=target_date, **sudoku_data)
    ernigram_data.pop("date_to_be_used", None)
    ernigram = ErnigramPuzzle.objects.create(
        date_to_be_used=target_date, **ernigram_data)

    # 5. Link them all in the DailyPuzzle object
    daily_puzzle_set = DailyPuzzle.objects.create(
        date=target_date,
        wordle_easy=wordle_easy,
        wordle_hard=wordle_hard,
        sudoku=sudoku,
        ernigram=ernigram
    )
    return daily_puzzle_set
