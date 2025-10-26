# games/services.py
import datetime
from datetime import timedelta
from django.utils import timezone
from .models import WordlePuzzle, SudokuPuzzle, ErnigramPuzzle, DailyPuzzle
from .ai_service import WordleGeneratorAI
from .api_client import generate_sudoku_puzzle_data
from .api_client import generate_ernigram_puzzle_data


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


# --- Main generator ---
def generate_daily_puzzles(target_date: datetime.date = None) -> DailyPuzzle:
    """
    Generates a full set of daily puzzles for the target date.
    Uses get_or_create for idempotency to prevent database errors.
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

    # Sudoku logic is now delegated to api_client.py
    sudoku_data = generate_sudoku_puzzle_data(target_date)
    ernigram_data = generate_ernigram_puzzle_data(target_date)

    # 4. Create/Get the puzzle objects in the database (using get_or_create)
    print("Wordle EASY data:", wordle_easy_data)
    print("Wordle HARD data:", wordle_hard_data)

    # Wordle Easy
    wordle_easy, _ = WordlePuzzle.objects.update_or_create(
        date_to_be_used=target_date,
        # Query on date AND difficulty
        difficulty=wordle_easy_data['difficulty'],
        defaults=wordle_easy_data
    )
    print(f"Wordle Easy saved: {wordle_easy.solution_word}")

    # Wordle Hard - Using update_or_create to ensure the word is always the latest AI-generated one
    # Wordle Hard - Using update_or_create to ensure the word is always the latest AI-generated one
    wordle_hard, _ = WordlePuzzle.objects.update_or_create(  # Use get_or_create or update_or_create
        date_to_be_used=target_date,
        # Query on date AND difficulty
        difficulty=wordle_hard_data['difficulty'],
        defaults=wordle_hard_data
    )

    # Sudoku
    sudoku_data.pop("date_to_be_used", None)
    sudoku, created = SudokuPuzzle.objects.get_or_create(
        date_to_be_used=target_date, defaults=sudoku_data)

    if created:
        print(f"✅ Successfully created new Sudoku puzzle for {target_date}.")
    else:
        print(
            f"⚠️ Sudoku puzzle for {target_date} already exists. Using existing record.")

    # Ernigram
    ernigram_data.pop("date_to_be_used", None)
    ernigram, _ = ErnigramPuzzle.objects.get_or_create(
        date_to_be_used=target_date, defaults=ernigram_data)

    # 5. Link them all in the DailyPuzzle object
    daily_puzzle_set, created = DailyPuzzle.objects.get_or_create(
        date=target_date,
        defaults={
            "wordle_easy": wordle_easy,
            "wordle_hard": wordle_hard,
            "sudoku": sudoku,
            "ernigram": ernigram
        }
    )

    if created:
        print(f"🎉 Successfully completed Daily Puzzle Set for {target_date}!")
    else:
        print(f"⚠️ Daily Puzzle Set for {target_date} was already complete.")

    return daily_puzzle_set
