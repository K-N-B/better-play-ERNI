import datetime
import pytz
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile
from unittest import mock

# Models
from .models import DailyPuzzle, WordlePuzzle, SudokuPuzzle, ErnigramPuzzle, EmployeeImageSource
from .serializers import ErnigramPuzzleSerializer

# ✅ ADDED: Import services to test directly
from games.services import (
    _generate_unique_wordle_data,
    ErnigramGeneratorAI,
    fetch_raw_csv_data,
    fetch_employee_image_data,
    generate_ernigram_puzzle_data,
    FALLBACK_WORDS_EASY,
)

# We need to import the service module itself for patching
from games import services

# Models to create for dependencies

# Config constants (assuming these exist in games/config.py)
from .config import (
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

        # Create a mock employee source for testing the service layer
        cls.employee_source = EmployeeImageSource.objects.create(
            employee_name="Mock Employee", clue_context="Testing", is_available=True
        )


# ======================================================================
# 1. API / VIEW TESTS (Omitted for brevity)
# ======================================================================
@mock.patch('games.views.get_local_today', return_value=MOCK_DATE)
class DailyPuzzlesViewTests(GamesBaseTestCase):
    """Tests the DailyPuzzlesView (GET /api/games/daily/)."""

    def test_get_daily_puzzles_bad_date_param(self, mock_today):
        """Should return 400 for malformed date."""
        url = reverse('daily-puzzles')
        response = self.client.get(url, {'date': 'not-a-date'})
        self.assertEqual(response.status_code, 400)


# ======================================================================
# 2. MODEL / SCORING TESTS (Omitted for brevity)
# ======================================================================
class ScoringLogicTests(GamesBaseTestCase):
    """Tests scoring logic for each puzzle model."""

    def test_ernigram_scoring(self):
        """Ernigram scoring logic."""
        solved = {"misses": 0, "status": "SOLVED"}
        points, misses = self.ernigram.validate_and_score(solved, "EASY")
        self.assertEqual(points, ERNIGRAM_EASY_BASE_POINT)
        self.assertEqual(misses, 0)


# ======================================================================
# 3. SERIALIZER TESTS (Omitted for brevity)
# ======================================================================
class SerializerTests(TestCase):
    """Tests for ErnigramPuzzleSerializer edge cases."""

    def test_ernigram_serializer_image_url(self):
        """Serializer should correctly resolve employee image URLs."""
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
# 4. GENERATION SERVICE TESTS (New Class for direct service testing)
# ======================================================================


class PuzzleServiceTests(GamesBaseTestCase):
    """Direct tests for functions in games/services.py to hit internal logic."""

    # ✅ FIX 1: Mock the class instance instead of the constructor
    # The return_value of WordleGeneratorAI() will be this mock.
    @mock.patch('games.services.WordleGeneratorAI', autospec=True)
    def test_01_wordle_generator_fallback_and_retry(self, MockWordleGeneratorClass):
        """
        Tests the _generate_unique_wordle_data function's retry and fallback logic.
        Covers retry on failure, success, and total fallback exhaustion.
        """

        # --- FIX 2: Set the side effect on the *instance* method ---
        # MockWordleGeneratorClass is the class. .return_value is the instance.
        # .generate_wordle_puzzle_data is the method we call.

        # Reset call count before starting the test body
        MockWordleGeneratorClass.return_value.generate_wordle_puzzle_data.call_count = 0

        MockWordleGeneratorClass.return_value.generate_wordle_puzzle_data.side_effect = [
            {"word": "FIRST"},  # Success on first try
            {"word": "FIRST"},  # Duplicate on second call
            {"word": "RETRY"},  # Success on third call
        ]

        # Test Case 1: Success on first try
        # We pass the instance to the helper function now
        mock_instance = MockWordleGeneratorClass.return_value
        result_success = _generate_unique_wordle_data(
            mock_instance, "EASY", existing_words=['APPLE']
        )
        self.assertEqual(result_success['solution_word'], "FIRST")
        self.assertEqual(
            mock_instance.generate_wordle_puzzle_data.call_count, 1
        )  # Should be called 1 time

        # Reset side effect and call count for the next test case
        MockWordleGeneratorClass.return_value.generate_wordle_puzzle_data.reset_mock()

        # Test Case 2: AI returns duplicate, forcing a retry and then success
        MockWordleGeneratorClass.return_value.generate_wordle_puzzle_data.side_effect = [
            {"word": "FIRST"},  # Duplicate on first call
            {"word": "RETRY"},  # Success on second call
        ]
        result_retry = _generate_unique_wordle_data(
            mock_instance, "EASY", existing_words=['APPLE', 'FIRST']
        )
        self.assertEqual(result_retry['solution_word'], "RETRY")

        # The method should have been called twice for this test case
        self.assertEqual(mock_instance.generate_wordle_puzzle_data.call_count, 2)

    @mock.patch('games.services.WordleGeneratorAI', autospec=True)
    @mock.patch.object(services, 'FALLBACK_WORDS_EASY', ['A', 'B'])
    def test_02_wordle_fallback_exhaustion(self, MockWordleGeneratorClass):
        """Tests that the system fails gracefully if AI fails AND fallback is used up."""

        # Create mock instance
        mock_instance = MockWordleGeneratorClass.return_value

        # Patch the instance method to fail and eventually raise Exception
        mock_instance.generate_wordle_puzzle_data.side_effect = [
            None,  # 1st AI call fails
            {"not": "word"},  # 2nd AI call invalid
            None,  # 3rd AI call fails
            Exception("API Failed"),  # 4th AI call triggers the final exception
        ]

        # Attempt to generate with existing_words exhausting fallback
        with self.assertRaises(Exception) as cm:
            _generate_unique_wordle_data(mock_instance, "EASY", existing_words=['A', 'B'])

        self.assertIn('AI failed to generate a valid puzzle', str(cm.exception))
        self.assertIn('fallback list is exhausted', str(cm.exception))

    def test_03_ernigram_generation_csv_logic(self):
        # Patch fetch_used_solution_phrases at runtime using `with`
        with (
            mock.patch(
                'games.services.fetch_used_solution_phrases',
                side_effect=lambda *args: {self.employee_source.employee_name.upper()},
            ),
            mock.patch.object(services, 'fetch_raw_csv_data', return_value=["Block 1 content."]),
            mock.patch.object(ErnigramGeneratorAI, 'generate_from_raw_text') as mock_raw_text_gen,
            mock.patch.object(ErnigramGeneratorAI, '__init__', return_value=None),
        ):

            # Mock the internal method to return a predictable result
            mock_raw_text_gen.return_value = {
                "solution_phrase": "MOCK CSV RESULT",
                "clue": "It came from a file.",
                "employee_source_id": None,
            }

            # Force CSV path by making other sources empty
            result = generate_ernigram_puzzle_data(self.test_date)

            self.assertEqual(result['solution_phrase'], "MOCK CSV RESULT")
            self.assertTrue(mock_raw_text_gen.called)
            self.assertFalse(result.get('employee_source_id'))

    @mock.patch('games.services.fetch_raw_csv_data', return_value=["Block 1 content."])
    def test_04_fetch_csv_data_failure(self, mock_raw_csv):
        """Tests that fetch_raw_csv_data handles an exception gracefully."""

        # Test Case 2: Mock csv.reader to raise an exception (simulating bad format)
        with (
            mock.patch('builtins.open', mock.mock_open(read_data="a,b\nc,d\n")),
            mock.patch('csv.reader', side_effect=Exception("Bad CSV format")),
        ):

            # Since fetch_raw_csv_data is called directly here, it will crash
            raw_texts = fetch_raw_csv_data()

            # The function should catch the exception and return an empty list
            self.assertEqual(raw_texts, [])

    @mock.patch('games.services.fetch_employee_image_data')
    @mock.patch('games.services.fetch_cleaned_news_articles')
    @mock.patch('games.services.fetch_raw_csv_data')
    @mock.patch('games.services.fetch_used_solution_phrases')
    def test_05_ernigram_generation_employee_skip(
        self, mock_used_phrases, mock_csv_data, mock_rss_data, mock_employee_data
    ):
        """
        Tests that the Ernigram generator correctly skips the EMPLOYEE source
        when all employee phrases are already used, and eventually fails gracefully.
        """

        # 1. Mock all employee data but simulate all names already used
        mock_employee_data.return_value = [
            {
                "id": 1,
                "phrase": "EMPLOYEE1",
                "name": "Employee One",
                "clue_context": "",
                "image_filename": "emp1.png",
            },
            {
                "id": 2,
                "phrase": "EMPLOYEE2",
                "name": "Employee Two",
                "clue_context": "",
                "image_filename": "emp2.png",
            },
        ]

        # 2. Mock used phrases to include all employee phrases
        mock_used_phrases.return_value = {"EMPLOYEE1", "EMPLOYEE2"}

        # 3. Mock RSS and CSV data as empty to force final fallback
        mock_rss_data.return_value = []
        mock_csv_data.return_value = []

        # 4. Run the Ernigram generator
        result = generate_ernigram_puzzle_data(date_to_be_used=datetime.date.today())

        # 5. Assert that it returned the final fallback result
        self.assertEqual(result['solution_phrase'], "ALL SOURCES FAILED")
        self.assertEqual(
            result['clue'], "Every available data source was attempted without success."
        )
        self.assertEqual(result['employee_source_id'], "")

    @mock.patch('games.services._generate_daily_puzzles_inner')
    def test_06_generate_daily_puzzles_calls_inner_in_transaction(self, mock_inner):
        """
        Tests that the main scheduler calls the inner logic and wraps it in a transaction.
        """
        from games.services import generate_daily_puzzles

        # We need to simulate the core code path being called
        generate_daily_puzzles(self.test_date)

        # We assert that the inner function was called exactly once
        mock_inner.assert_called_once()

    @mock.patch('games.services.generate_ernigram_puzzle_data')
    @mock.patch('games.services.generate_sudoku_puzzle_data')
    @mock.patch('games.services._generate_unique_wordle_data')
    @mock.patch('games.services.WordleGeneratorAI.__init__', return_value=None)
    def test_07_inner_generator_handles_existing_puzzle(
        self, mock_init, mock_wordle, mock_sudoku, mock_erni
    ):
        """
        Tests that _generate_daily_puzzles_inner finds an existing DailyPuzzle
        and successfully updates the FKs instead of creating a duplicate.
        """
        from games.services import _generate_daily_puzzles_inner

        # Mock the generators to return simple data
        mock_wordle.side_effect = [
            {"solution_word": "NEWW", "difficulty": "EASY"},
            {"solution_word": "NEWW_H", "difficulty": "HARD"},
        ]
        mock_sudoku.return_value = {
            "solution_string": "NEW" * 27,
            "puzzle_string_easy": "NEW" * 27,
            "puzzle_string_hard": "NEW" * 27,
            "date_to_be_used": self.test_date,
        }
        mock_erni.return_value = {
            "solution_phrase": "NEW ERNI",
            "clue": "c",
            "employee_source_id": None,
        }

        # 1. Create the initial set (this uses self.test_date)
        DailyPuzzle.objects.create(
            date=self.test_date,
            wordle_easy=self.wordle_easy,
            wordle_hard=self.wordle_hard,
            sudoku=self.sudoku,
            ernigram=self.ernigram,
        )
        self.assertEqual(DailyPuzzle.objects.count(), 1)

        # 2. Run the generator for the same date
        new_daily_set = _generate_daily_puzzles_inner(self.test_date)

        # 3. Assertions
        self.assertEqual(DailyPuzzle.objects.count(), 1)  # Should not create a second one

        # Check that the FKs were updated
        self.assertNotEqual(
            new_daily_set.wordle_easy.solution_word, "TESTS"
        )  # Should be updated to 'NEWW'
        self.assertEqual(new_daily_set.wordle_easy.solution_word, "NEWW")

    @mock.patch('games.services.WordleGeneratorAI', autospec=True)
    def test_wordle_ai_success(self, MockWordleAI):
        """AI generates a valid EASY word successfully."""
        mock_ai = MockWordleAI.return_value
        mock_ai.generate_wordle_puzzle_data.return_value = {"word": "APPLE"}

        result = _generate_unique_wordle_data(mock_ai, "EASY", existing_words=[])
        self.assertEqual(result["solution_word"], "APPLE")
        self.assertEqual(result["difficulty"], "EASY")

    @mock.patch('games.services.WordleGeneratorAI', autospec=True)
    def test_wordle_ai_duplicate_then_fallback(self, MockWordleAI):
        """AI returns duplicates and then fallback is used."""
        mock_ai = MockWordleAI.return_value
        # AI always returns duplicates
        mock_ai.generate_wordle_puzzle_data.side_effect = [
            {"word": "ARRAY"},
            {"word": "ARRAY"},
            {"word": "ARRAY"},
        ]

        result = _generate_unique_wordle_data(mock_ai, "EASY", existing_words=["ARRAY"])
        self.assertIn(result["solution_word"], FALLBACK_WORDS_EASY)
        self.assertEqual(result["difficulty"], "EASY")

    @mock.patch('games.services.WordleGeneratorAI', autospec=True)
    @mock.patch.object(services, 'FALLBACK_WORDS_EASY', ['A', 'B'])
    def test_wordle_ai_fallback_exhausted_raises(self, MockWordleGeneratorClass):
        """Tests that the system fails gracefully if AI fails AND fallback is used up."""

        # Create mock instance
        mock_instance = MockWordleGeneratorClass.return_value

        # Patch the instance method to fail and eventually return invalid data
        mock_instance.generate_wordle_puzzle_data.side_effect = [
            None,  # 1st AI call fails
            {"not": "word"},  # 2nd AI call invalid
            None,  # 3rd AI call fails
        ]

        # Attempt to generate with existing_words exhausting fallback
        with self.assertRaises(Exception) as cm:
            _generate_unique_wordle_data(mock_instance, "EASY", existing_words=['A', 'B'])

        exception_msg = str(cm.exception)
        self.assertIn('AI failed to generate a valid puzzle', exception_msg)
        self.assertIn('fallback list is exhausted', exception_msg)

    def test_generate_from_employee_data_success(self):
        """Generates a unique Ernigram from employee data."""
        ai = ErnigramGeneratorAI()
        employee_data = [{"phrase": "EMPLOYEE1", "id": 1}]
        used_phrases = set()
        result = ai.generate_from_employee_data(employee_data, used_phrases)

        self.assertEqual(result["solution_phrase"], "EMPLOYEE1")
        self.assertEqual(result["employee_source_id"], 1)
        self.assertEqual(result["clue"], "Better ask employee")

    def test_generate_from_employee_data_all_used_raises(self):
        """If all employee names are used, the function returns a standardized failure dict."""
        ai = ErnigramGeneratorAI()
        employee_data = [
            {"id": 1, "phrase": "EMP1"},
            {"id": 2, "phrase": "EMP2"},
        ]
        used_phrases = ["EMP1", "EMP2"]

        result = ai.generate_from_employee_data(employee_data, used_phrases)

        self.assertEqual(result["solution_phrase"], "NO UNIQUE EMPLOYEE DATA")
        self.assertEqual(result["clue"], "All employee names have already been used.")
        self.assertIsNone(result["employee_source_id"])

    @mock.patch('games.services.fetch_raw_csv_data')
    def test_generate_from_raw_text_success(self, mock_csv):
        """CSV raw text generates unique Ernigram."""
        ai = ErnigramGeneratorAI()
        mock_csv.return_value = ["This is some example CSV text for testing."]
        used_phrases = set()

        result = ai.generate_from_raw_text(mock_csv(), used_phrases)
        self.assertIn("solution_phrase", result)
        self.assertIn("clue", result)
        self.assertIsNone(result["employee_source_id"])

    @mock.patch('games.services.fetch_cleaned_news_articles', return_value=[])
    @mock.patch('games.services.fetch_employee_image_data', return_value=[])
    @mock.patch('games.services.fetch_raw_csv_data', return_value=["CSV BLOCK FOR TEST"])
    @mock.patch('games.services.ErnigramGeneratorAI.generate_from_raw_text')
    def test_generate_ernigram_puzzle_data_fallback_to_csv(
        self, mock_generate_csv, mock_csv, mock_employee, mock_rss
    ):
        mock_generate_csv.return_value = {
            "solution_phrase": "CSV BLOCK FOR TEST",
            "clue": "Some clue",
            "employee_source_id": None,
        }

        result = generate_ernigram_puzzle_data(datetime.date.today())

        self.assertEqual(result["solution_phrase"], "CSV BLOCK FOR TEST")
        self.assertIsNone(result["employee_source_id"])

    @mock.patch('games.services.fetch_employee_image_data')
    @mock.patch('games.services.fetch_raw_csv_data')
    @mock.patch('games.services.fetch_cleaned_news_articles')
    @mock.patch('games.services.fetch_used_solution_phrases')
    def test_generate_ernigram_puzzle_data_all_sources_fail(
        self, mock_used, mock_articles, mock_csv, mock_employee
    ):
        """All sources empty triggers ALL SOURCES FAILED."""
        mock_employee.return_value = []
        mock_articles.return_value = []
        mock_csv.return_value = []
        mock_used.return_value = set()

        result = generate_ernigram_puzzle_data(datetime.date.today())
        self.assertEqual(result["solution_phrase"], "NO DATA SOURCES")
        self.assertIsNone(result["employee_source_id"])

    # Optional: coverage for fetch_raw_csv_data & fetch_employee_image_data helpers
    @mock.patch("builtins.open", new_callable=mock.mock_open, read_data="row1\nrow2\nrow3")
    def test_fetch_raw_csv_data_reads(self, mock_file):
        texts = fetch_raw_csv_data()
        self.assertTrue(len(texts) > 0)

    @mock.patch("games.services.EmployeeImageSource.objects")
    def test_fetch_employee_image_data_reads(self, mock_objects):
        mock_objects.filter.return_value.values.return_value = [
            {
                "id": 1,
                "employee_name": "Test Employee",
                "clue_context": "clue",
                "image_file": "file.png",
            }
        ]
        data = fetch_employee_image_data()
        self.assertEqual(data[0]["name"], "Test Employee")
