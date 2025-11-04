import pytz
from datetime import date, timedelta
from django.test import TestCase, TransactionTestCase
from django.urls import reverse
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile
from unittest import mock

# Models
from .models import DailyPuzzle, WordlePuzzle, SudokuPuzzle, ErnigramPuzzle, EmployeeImageSource
from .serializers import ErnigramPuzzleSerializer
from games.services import generate_daily_puzzles

# Models to create for dependencies
from users.models import User

# Config constants
from .config import (
    SUDOKU_EASY_BASE_POINT,
    SUDOKU_HINT_PENALTY,
    WORDLE_EASY_BASE_POINT,
    ERNIGRAM_EASY_BASE_POINT,
)

# --- Mocking Setup ---
MOCK_DATETIME = timezone.datetime(2025, 10, 25, 14, 0, 0, tzinfo=pytz.timezone("Asia/Manila"))
MOCK_DATE = MOCK_DATETIME.date()


# ======================================================================
# Base setup for puzzle data
# ======================================================================
class GamesBaseTestCase(TestCase):
    """Sets up a base environment with puzzles for a specific date."""

    @classmethod
    def setUpTestData(cls):
        cls.test_date = MOCK_DATE
        cls.wordle_easy = WordlePuzzle.objects.create(
            solution_word="TESTS", date_to_be_used=cls.test_date, difficulty="EASY"
        )
        cls.wordle_hard = WordlePuzzle.objects.create(
            solution_word="PYTHON", date_to_be_used=cls.test_date, difficulty="HARD"
        )
        cls.sudoku = SudokuPuzzle.objects.create(
            solution_string="534678912672195348198342567859761423426853791713924856961537284287419635345286179",
            puzzle_string_easy="530070000600195000098000060800060000400803000700020000060000280000419005000080079",
            puzzle_string_hard="000000000000000000000000000000000000000000000000000000000000000000000000000000000",
            date_to_be_used=cls.test_date,
        )
        cls.ernigram = ErnigramPuzzle.objects.create(
            solution_phrase="TEST PHRASE", clue="A clue for testing.", date_to_be_used=cls.test_date
        )


# ======================================================================
# 1. API / VIEW TESTS
# ======================================================================
@mock.patch('games.views.get_local_today', return_value=MOCK_DATE)
class DailyPuzzlesViewTests(GamesBaseTestCase):
    """Tests the DailyPuzzlesView (GET /api/games/daily/)."""

    def test_get_daily_puzzles_404_if_not_set(self, mock_today):
        """Should return 404 if no DailyPuzzle link exists for today."""
        self.assertEqual(DailyPuzzle.objects.count(), 0)
        url = reverse('daily-puzzles')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)
        self.assertIn("not found", response.json()['detail'])

    def test_get_daily_puzzles_success_for_today(self, mock_today):
        """Should return 200 and correct data for today."""
        DailyPuzzle.objects.create(
            date=self.test_date,
            wordle_easy=self.wordle_easy,
            wordle_hard=self.wordle_hard,
            sudoku=self.sudoku,
            ernigram=self.ernigram,
        )
        url = reverse('daily-puzzles')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['date'], self.test_date.isoformat())
        self.assertEqual(data['wordle_easy']['solution_word'], "TESTS")
        self.assertEqual(data['sudoku']['id'], self.sudoku.id)
        self.assertEqual(data['ernigram']['solution_phrase'], "TEST PHRASE")

    def test_get_daily_puzzles_by_date_param(self, mock_today):
        """Should return correct data for ?date= param."""
        other_date = self.test_date - timedelta(days=1)
        wordle_other = WordlePuzzle.objects.create(
            solution_word="OTHER", date_to_be_used=other_date, difficulty="EASY"
        )
        sudoku_other = SudokuPuzzle.objects.create(
            solution_string="1" * 81,
            puzzle_string_easy="1" * 81,
            puzzle_string_hard="1" * 81,
            date_to_be_used=other_date,
        )
        erni_other = ErnigramPuzzle.objects.create(
            solution_phrase="OTHER PHRASE", clue="c", date_to_be_used=other_date
        )

        DailyPuzzle.objects.create(
            date=other_date,
            wordle_easy=wordle_other,
            wordle_hard=wordle_other,
            sudoku=sudoku_other,
            ernigram=erni_other,
        )

        url = reverse('daily-puzzles')
        response = self.client.get(url, {'date': other_date.isoformat()})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['date'], other_date.isoformat())
        self.assertEqual(data['wordle_easy']['solution_word'], "OTHER")

    def test_get_daily_puzzles_bad_date_param(self, mock_today):
        """Should return 400 for malformed date."""
        url = reverse('daily-puzzles')
        response = self.client.get(url, {'date': 'not-a-date'})
        self.assertEqual(response.status_code, 400)


# ======================================================================
# 2. MODEL / SCORING TESTS
# ======================================================================
class ScoringLogicTests(GamesBaseTestCase):
    """Tests scoring logic for each puzzle model."""

    def test_wordle_scoring(self):
        """Wordle scoring logic works correctly."""
        progress_solved = {"guesses": ["TESTS"], "status": "SOLVED"}
        points, tries = self.wordle_easy.validate_and_score(progress_solved, "EASY")
        self.assertEqual(points, WORDLE_EASY_BASE_POINT)
        self.assertEqual(tries, 1)

        progress_lost = {"guesses": ["A", "B", "C", "D", "E", "F"], "status": "LOST"}
        points, tries = self.wordle_easy.validate_and_score(progress_lost, "EASY")
        self.assertEqual(points, 0)
        self.assertEqual(tries, 6)

        progress_active = {"guesses": ["A", "B"], "status": "ACTIVE"}
        points, tries = self.wordle_easy.validate_and_score(progress_active, "EASY")
        self.assertEqual(points, 0)
        self.assertEqual(tries, 2)

        progress_cheat = {"guesses": ["WRONG"], "status": "SOLVED"}
        points, tries = self.wordle_easy.validate_and_score(progress_cheat, "EASY")
        self.assertEqual(points, 0)
        self.assertEqual(tries, 1)

    def test_sudoku_scoring(self):
        """Sudoku scoring and penalty logic."""
        solution = (
            "534678912672195348198342567859761423426853791713924856961537284287419635345286179"
        )
        wrong = "1" * 81

        progress_solved = {"final_grid": solution, "hints_used": 0, "status": "SOLVED"}
        points, hints = self.sudoku.validate_and_score(progress_solved, "EASY")
        self.assertEqual(points, SUDOKU_EASY_BASE_POINT)
        self.assertEqual(hints, 0)

        progress_hints = {"final_grid": solution, "hints_used": 2, "status": "SOLVED"}
        points, hints = self.sudoku.validate_and_score(progress_hints, "EASY")
        expected = SUDOKU_EASY_BASE_POINT - (2 * SUDOKU_HINT_PENALTY)
        self.assertEqual(points, expected)

        progress_max = {"final_grid": solution, "hints_used": 100, "status": "SOLVED"}
        points, _ = self.sudoku.validate_and_score(progress_max, "EASY")
        self.assertEqual(points, 0)

        progress_wrong = {"final_grid": wrong, "hints_used": 0, "status": "SOLVED"}
        points, _ = self.sudoku.validate_and_score(progress_wrong, "EASY")
        self.assertEqual(points, 0)

    def test_ernigram_scoring(self):
        """Ernigram scoring logic."""
        solved = {"misses": 0, "status": "SOLVED"}
        points, misses = self.ernigram.validate_and_score(solved, "EASY")
        self.assertEqual(points, ERNIGRAM_EASY_BASE_POINT)
        self.assertEqual(misses, 0)

        solved_misses = {"misses": 3, "status": "SOLVED"}
        points, _ = self.ernigram.validate_and_score(solved_misses, "EASY")
        self.assertEqual(points, ERNIGRAM_EASY_BASE_POINT)

        lost = {"misses": 6, "status": "LOST"}
        points, _ = self.ernigram.validate_and_score(lost, "EASY")
        self.assertEqual(points, 0)


# ======================================================================
# 3. SERIALIZER TESTS
# ======================================================================
class SerializerTests(TestCase):
    """Tests for ErnigramPuzzleSerializer edge cases."""

    def test_ernigram_serializer_image_url(self):
        """Serializer should correctly resolve employee image URLs."""
        erni_no_source = ErnigramPuzzle.objects.create(
            solution_phrase="A", clue="B", date_to_be_used="2025-01-01"
        )
        serializer = ErnigramPuzzleSerializer(erni_no_source)
        self.assertEqual(serializer.data['employee_image_url'], "None")

        source_no_image = EmployeeImageSource.objects.create(
            employee_name="Test User", clue_context="Dev"
        )
        erni_with_source = ErnigramPuzzle.objects.create(
            solution_phrase="B",
            clue="C",
            date_to_be_used="2025-01-02",
            employee_source=source_no_image,
        )
        serializer2 = ErnigramPuzzleSerializer(erni_with_source)
        self.assertEqual(serializer2.data['employee_image_url'], "None")

        mock_file = SimpleUploadedFile("test_image.jpg", b"file_content", content_type="image/jpeg")
        source_with_image = EmployeeImageSource.objects.create(
            employee_name="Image User", clue_context="Dev", image_file=mock_file
        )
        erni_with_image = ErnigramPuzzle.objects.create(
            solution_phrase="C",
            clue="D",
            date_to_be_used="2025-01-03",
            employee_source=source_with_image,
        )
        serializer3 = ErnigramPuzzleSerializer(erni_with_image)
        self.assertIn("test_image", serializer3.data['employee_image_url'])


# ======================================================================
# 4. GENERATION SERVICE TESTS
# ======================================================================
@mock.patch('games.services.WordleGeneratorAI.__init__', return_value=None)
@mock.patch(
    'games.services.WordleGeneratorAI.generate_wordle_puzzle_data',
    side_effect=[{"word": "FIRST"}, {"word": "SECOND"}],
)
@mock.patch(
    'games.services.generate_ernigram_puzzle_data',
    return_value={
        "solution_phrase": "MOCK ERNIGRAM",
        "clue": "Mock Clue",
        "employee_source_id": None,
    },
)
@mock.patch(
    'games.services.generate_sudoku_puzzle_data',
    return_value={
        "solution_string": "1" * 81,
        "puzzle_string_easy": "1" * 81,
        "puzzle_string_hard": "1" * 81,
    },
)
class PuzzleGenerationTests(TestCase):
    """Direct tests for generate_daily_puzzles orchestration."""

    def test_generate_daily_puzzles_creates_full_set(
        self, mock_sudoku, mock_erni, mock_wordle, mock_init
    ):
        from games.services import generate_daily_puzzles
        from games.models import DailyPuzzle

        test_date = date(2030, 1, 1)
        daily = generate_daily_puzzles(test_date)

        self.assertTrue(DailyPuzzle.objects.filter(date=test_date).exists())
        self.assertIsNotNone(daily.wordle_easy)
        self.assertIsNotNone(daily.wordle_hard)
        self.assertIsNotNone(daily.sudoku)
        self.assertIsNotNone(daily.ernigram)

    @mock.patch(
        'games.services.WordleGeneratorAI.generate_wordle_puzzle_data',
        return_value={"word": "MOCK"},
    )
    @mock.patch(
        'games.services.generate_ernigram_puzzle_data',
        return_value={"solution_phrase": "MOCK", "clue": "Mock clue", "employee_source_id": None},
    )
    @mock.patch(
        'games.services.generate_sudoku_puzzle_data',
        return_value={
            "solution_string": "1" * 81,
            "puzzle_string_easy": "1" * 81,
            "puzzle_string_hard": "1" * 81,
        },
    )
    def test_generate_daily_puzzles_creates_daily_set(
        self, mock_sudoku, mock_ernigram, mock_wordle, *args
    ):
        target_date = timezone.now().date()
        daily = generate_daily_puzzles(target_date)

        # Check database record exists
        assert DailyPuzzle.objects.filter(date=target_date).exists()

        # Optionally, check that the foreign keys are assigned correctly
        assert daily.ernigram_id is not None
        assert daily.sudoku_id is not None
        assert daily.wordle_easy_id is not None
        assert daily.wordle_hard_id is not None
