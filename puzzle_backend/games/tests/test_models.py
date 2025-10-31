import pytest

# from django.core.exceptions import ValidationError
from datetime import date
from games.models import WordlePuzzle, SudokuPuzzle, ErnigramPuzzle, DailyPuzzle


@pytest.mark.django_db
def test_wordle_puzzle_creation_and_scoring():
    wordle = WordlePuzzle.objects.create(solution_word="APPLE", difficulty="EASY")

    # Ensure solution is uppercased on save
    assert wordle.solution_word == "APPLE"
    assert wordle.word_length == 5

    # Should return full points if solved correctly
    progress = {"guesses": ["APPLY", "APPLE"], "status": "SOLVED"}
    points, tries = wordle.validate_and_score(progress, difficulty="EASY")
    assert points == wordle.BASE_POINTS["EASY"]
    assert tries == 2

    # Should return 0 points if incorrect or not marked solved
    progress = {"guesses": ["APPLY"], "status": "ACTIVE"}
    points, tries = wordle.validate_and_score(progress)
    assert points == 0
    assert tries == 1


@pytest.mark.django_db
def test_sudoku_puzzle_validation_and_scoring():
    # Create 81-char strings
    full_solution = "1" * 81
    easy_puzzle = "0" * 81
    hard_puzzle = "0" * 81

    sudoku = SudokuPuzzle.objects.create(
        solution_string=full_solution,
        puzzle_string_easy=easy_puzzle,
        puzzle_string_hard=hard_puzzle,
        date_to_be_used=date.today(),
    )

    # Check validation passes for correct length
    sudoku.clean()

    # Solved correctly, no hints
    progress = {"final_grid": full_solution, "hints_used": 0, "status": "SOLVED"}
    points, hints = sudoku.validate_and_score(progress, difficulty="EASY")
    assert points == sudoku.BASE_POINTS["EASY"]
    assert hints == 0

    # Incorrect final grid or unsolved status
    progress = {"final_grid": "0" * 81, "hints_used": 1, "status": "ACTIVE"}
    points, hints = sudoku.validate_and_score(progress)
    assert points == 0
    assert hints == 1

    # With hints used, verify penalty
    progress = {"final_grid": full_solution, "hints_used": 3, "status": "SOLVED"}
    points, _ = sudoku.validate_and_score(progress)
    expected_points = max(0, sudoku.BASE_POINTS["EASY"] - 3 * sudoku.HINT_PENALTY_POINTS)
    assert points == expected_points


@pytest.mark.django_db
def test_ernigram_puzzle_creation_and_scoring():
    ernigram = ErnigramPuzzle.objects.create(
        solution_phrase="HELLO WORLD",
        clue="A common phrase",
        date_to_be_used=date.today(),
    )

    # Ensure uppercase on save
    assert ernigram.solution_phrase == "HELLO WORLD"

    # Not solved → 0 points
    progress = {"status": "ACTIVE", "misses": 2}
    points, misses = ernigram.validate_and_score(progress)
    assert points == 0
    assert misses == 2

    # Solved correctly → full base points
    progress = {"status": "SOLVED", "misses": 1}
    points, misses = ernigram.validate_and_score(progress, difficulty="EASY")
    assert points == ernigram.BASE_POINTS["EASY"]
    assert misses == 1


@pytest.mark.django_db
def test_daily_puzzle_creation_with_foreign_keys():
    # Create puzzle instances
    wordle_easy = WordlePuzzle.objects.create(solution_word="APPLE", difficulty="EASY")
    wordle_hard = WordlePuzzle.objects.create(solution_word="BANANAS", difficulty="HARD")
    sudoku = SudokuPuzzle.objects.create(
        solution_string="1" * 81,
        puzzle_string_easy="0" * 81,
        puzzle_string_hard="0" * 81,
        date_to_be_used=date.today(),
    )
    ernigram = ErnigramPuzzle.objects.create(
        solution_phrase="HELLO WORLD", clue="A phrase", date_to_be_used=date.today()
    )

    # Create DailyPuzzle linking all
    daily = DailyPuzzle.objects.create(
        wordle_easy=wordle_easy,
        wordle_hard=wordle_hard,
        sudoku=sudoku,
        ernigram=ernigram,
        date=date.today(),
    )

    # Verify relationships
    assert daily.wordle_easy.solution_word == "APPLE"
    assert daily.wordle_hard.solution_word == "BANANAS"
    assert daily.sudoku.solution_string == "1" * 81
    assert daily.ernigram.solution_phrase == "HELLO WORLD"
    assert "Puzzles for" in str(daily)
