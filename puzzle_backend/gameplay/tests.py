import json
import pytz
from datetime import date
from datetime import datetime as real_datetime
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
from unittest import mock

# Import all the models we need to create
from games.models import DailyPuzzle, WordlePuzzle, SudokuPuzzle, ErnigramPuzzle
from .models import PuzzleAttempt, Submission

# Get the custom User model
User = get_user_model()

MOCK_DATETIME = timezone.datetime(2025, 10, 25, 14, 0, 0, tzinfo=pytz.timezone("Asia/Manila"))


# ✅ 3. DEFINE THE MOCK CLASS
class MockDateTime(real_datetime):
    """
    A mock datetime class that inherits from the real datetime,
    but overrides .now() to return our fixed MOCK_DATETIME.
    This allows other datetime methods like .combine() and .min to work.
    """

    @classmethod
    def now(cls, tz=None):
        return MOCK_DATETIME


class BaseGameDataTestCase(TestCase):
    """
    A base test case that sets up a complete environment for game testing.
    It creates:
    - 1 User
    - 1 of each Puzzle Type (Wordle Easy/Hard, Sudoku, Ernigram)
    - 1 DailyPuzzle linking them all to a specific date
    """

    @classmethod
    def setUpTestData(cls):
        # We use setUpTestData for data that doesn't change per-test
        cls.test_date = date(2025, 10, 25)
        cls.base_time = timezone.datetime(2025, 10, 25, 10, 0, 0, tzinfo=pytz.utc)

        cls.user = User.objects.create_user(
            username='gametester',
            email='gamer@example.com',
            password='password123',
            profile_complete=True,
        )

        # Create Puzzles
        cls.wordle_easy = WordlePuzzle.objects.create(
            solution_word="TESTS", date_to_be_used=cls.test_date, difficulty="EASY"
        )
        cls.wordle_hard = WordlePuzzle.objects.create(
            solution_word="PYTHON", date_to_be_used=cls.test_date, difficulty="HARD"
        )
        cls.sudoku = SudokuPuzzle.objects.create(
            solution_string="534678912672195348198342567859761423426853791713924856961537284287419635345286179",
            puzzle_string_easy="530070000600195000098000060800060000400803000700020000060000280000419005000080079",
            puzzle_string_hard="500000000600195000098000060800060000400803000700020000060000280000419005000080079",
            date_to_be_used=cls.test_date,
        )
        cls.ernigram = ErnigramPuzzle.objects.create(
            solution_phrase="TEST PHRASE", clue="A clue for testing.", date_to_be_used=cls.test_date
        )

        # Link them all in a DailyPuzzle entry
        cls.daily_puzzle = DailyPuzzle.objects.create(
            date=cls.test_date,
            wordle_easy=cls.wordle_easy,
            wordle_hard=cls.wordle_hard,
            sudoku=cls.sudoku,
            ernigram=cls.ernigram,
        )

    def setUp(self):
        """
        Runs before *every* test.
        We log in the user here so each test starts fresh and authenticated.
        """
        self.client.login(username='gametester', password='password123')

        # --- Common URL kwargs ---
        self.url_kwargs_wordle = {
            'daily_puzzle_date': self.test_date.isoformat(),
            'puzzle_model_name': 'wordlepuzzle',
            'puzzle_id': self.wordle_easy.id,
        }
        self.url_kwargs_sudoku = {
            'daily_puzzle_date': self.test_date.isoformat(),
            'puzzle_model_name': 'sudokupuzzle',
            'puzzle_id': self.sudoku.id,
        }
        self.url_kwargs_ernigram = {
            'daily_puzzle_date': self.test_date.isoformat(),
            'puzzle_model_name': 'ernigrampuzzle',
            'puzzle_id': self.ernigram.id,
        }

        # --- Common Payloads ---
        self.progress_data_wordle_ongoing = {
            "progress_data": {"guesses": ["WRONG"], "currentRow": 1, "status": "ACTIVE"},
            "time_spent_ms": 15000,
            "difficulty": "EASY",
        }
        self.progress_data_wordle_solved = {
            "progress_data": {
                "guesses": ["WRONG", "TESTS"],
                "currentRow": 2,
                "status": "SOLVED",  # This is critical
            },
            "time_spent_ms": 30000,
            "difficulty": "EASY",
        }
        self.progress_data_wordle_failed = {
            "progress_data": {
                "guesses": ["WRONG", "GUESS", "FAILS", "AGAIN", "LATER", "SIXTH"],
                "currentRow": 6,
                "status": "LOST",  # This is critical
                "isGameOver": True,  #
            },
            "time_spent_ms": 60000,
            "difficulty": "EASY",
        }
        self.submit_payload = {"difficulty": "EASY"}


class ModelTests(BaseGameDataTestCase):
    """
    Tests the custom logic in gameplay/models.py
    """

    def test_get_or_start_attempt_creates_new(self):
        """GATE: Does the custom manager create a new attempt correctly?"""
        self.assertEqual(PuzzleAttempt.objects.count(), 0)

        attempt, created = PuzzleAttempt.objects.get_or_start_attempt(
            user=self.user, daily_puzzle=self.daily_puzzle, puzzle_instance=self.wordle_easy
        )

        self.assertEqual(PuzzleAttempt.objects.count(), 1)
        self.assertTrue(created)
        self.assertEqual(attempt.user, self.user)
        self.assertEqual(attempt.puzzle, self.wordle_easy)
        self.assertEqual(attempt.time_spent_ms, 0)

    def test_get_or_start_attempt_retrieves_existing(self):
        """GATE: Does the custom manager find an existing attempt?"""
        # 1. Create the first attempt
        attempt1, created1 = PuzzleAttempt.objects.get_or_start_attempt(
            user=self.user, daily_puzzle=self.daily_puzzle, puzzle_instance=self.wordle_easy
        )
        self.assertTrue(created1)
        self.assertEqual(PuzzleAttempt.objects.count(), 1)

        # 2. Call it again
        attempt2, created2 = PuzzleAttempt.objects.get_or_start_attempt(
            user=self.user, daily_puzzle=self.daily_puzzle, puzzle_instance=self.wordle_easy
        )

        self.assertFalse(created2)
        self.assertEqual(PuzzleAttempt.objects.count(), 1)
        self.assertEqual(attempt1, attempt2)


class SaveProgressViewTests(BaseGameDataTestCase):
    """
    Tests the SaveProgressView (POST /api/gameplay/save/...)
    """

    def test_save_progress_unauthenticated_fails(self):
        """GATE: Is the save endpoint protected?"""
        self.client.logout()  # Log out the user
        url = reverse('save_progress', kwargs=self.url_kwargs_wordle)
        response = self.client.post(
            url, data=json.dumps(self.progress_data_wordle_ongoing), content_type='application/json'
        )
        # ✅ FIX: @login_required decorator returns 302 (redirect) not 401/403
        self.assertEqual(response.status_code, 302)

    def test_save_progress_creates_new_attempt(self):
        """GATE: Does the first save create a PuzzleAttempt object?"""
        self.assertEqual(PuzzleAttempt.objects.count(), 0)
        url = reverse('save_progress', kwargs=self.url_kwargs_wordle)
        response = self.client.post(
            url, data=json.dumps(self.progress_data_wordle_ongoing), content_type='application/json'
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(PuzzleAttempt.objects.count(), 1)

        attempt = PuzzleAttempt.objects.first()
        self.assertEqual(attempt.user, self.user)
        self.assertEqual(attempt.puzzle, self.wordle_easy)
        self.assertEqual(attempt.time_spent_ms, 15000)
        self.assertEqual(attempt.progress_data['guesses'][0], 'WRONG')

    def test_save_progress_updates_existing_attempt(self):
        """GATE: Does a subsequent save update the existing attempt?"""
        # 1. First save
        url = reverse('save_progress', kwargs=self.url_kwargs_wordle)
        self.client.post(
            url, data=json.dumps(self.progress_data_wordle_ongoing), content_type='application/json'
        )

        self.assertEqual(PuzzleAttempt.objects.count(), 1)
        attempt = PuzzleAttempt.objects.first()
        self.assertEqual(attempt.time_spent_ms, 15000)

        # 2. Second save with updated data
        updated_data = self.progress_data_wordle_ongoing.copy()
        updated_data['time_spent_ms'] = 45000
        response = self.client.post(
            url, data=json.dumps(updated_data), content_type='application/json'
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(PuzzleAttempt.objects.count(), 1)  # Still 1

        attempt.refresh_from_db()
        self.assertEqual(attempt.time_spent_ms, 45000)  # Time is updated

    def test_save_progress_time_limit_exceeded(self):
        """GATE: Does the view block saves that exceed the time limit?"""
        # Wordle Easy limit is 1,800,000 ms (30 min)
        data = self.progress_data_wordle_ongoing.copy()
        data['time_spent_ms'] = 2000000  # > 1,800,000

        url = reverse('save_progress', kwargs=self.url_kwargs_wordle)
        response = self.client.post(url, data=json.dumps(data), content_type='application/json')

        self.assertEqual(response.status_code, 403)
        self.assertIn("Time limit", response.json()['error'])

    def test_save_progress_mistake_limit_exceeded(self):
        """GATE: Does the view block saves that exceed mistake limits?"""
        # ERNIgram Easy limit is 6 mistakes
        data = {"progress_data": {"misses": 7}, "time_spent_ms": 15000, "difficulty": "EASY"}
        url = reverse('save_progress', kwargs=self.url_kwargs_ernigram)
        response = self.client.post(url, data=json.dumps(data), content_type='application/json')

        self.assertEqual(response.status_code, 403)
        self.assertIn("Maximum of 6 mistakes", response.json()['error'])


class GetProgressViewTests(BaseGameDataTestCase):
    """
    Tests the GetProgressView (GET /api/gameplay/progress/...)
    """

    def test_get_progress_unauthenticated_fails(self):
        """GATE: Is the get_progress endpoint protected?"""
        self.client.logout()
        url = reverse('get_progress', kwargs=self.url_kwargs_wordle)
        response = self.client.get(url)
        # ✅ FIX: @login_required decorator returns 302 (redirect)
        self.assertEqual(response.status_code, 302)

    def test_get_progress_404_if_no_attempt_exists(self):
        """GATE: Does it return 404 if no save exists?"""
        url = reverse('get_progress', kwargs=self.url_kwargs_wordle)
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()['exists'], False)

    def test_get_progress_success(self):
        """GATE: Does it successfully return a saved attempt?"""
        # 1. Save a game
        save_url = reverse('save_progress', kwargs=self.url_kwargs_wordle)
        self.client.post(
            save_url,
            data=json.dumps(self.progress_data_wordle_ongoing),
            content_type='application/json',
        )

        # 2. Get the saved game
        get_url = reverse('get_progress', kwargs=self.url_kwargs_wordle)
        response = self.client.get(get_url)

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['exists'], True)
        self.assertEqual(data['time_spent_ms'], 15000)
        self.assertEqual(data['progress_data']['guesses'][0], 'WRONG')
        self.assertEqual(data['puzzle_type'], 'wordle')


class CheckSubmissionViewTests(BaseGameDataTestCase):
    """
    Tests the CheckSubmissionView (GET /api/gameplay/check-submission/...)
    """

    def test_check_submission_unauthenticated_fails(self):
        """GATE: Is the check_submission endpoint protected?"""
        self.client.logout()
        url = reverse('check_submission', kwargs=self.url_kwargs_wordle)
        response = self.client.get(url)
        # ✅ FIX: @login_required decorator returns 302 (redirect)
        self.assertEqual(response.status_code, 302)

    def test_check_submission_returns_false_when_no_submission(self):
        """GATE: Does it return hasSubmitted: false correctly?"""
        url = reverse('check_submission', kwargs=self.url_kwargs_wordle)
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['hasSubmitted'], False)

    def test_check_submission_returns_true_when_submission_exists(self):
        """GATE: Does it return hasSubmitted: true correctly?"""
        # 1. Create a submission manually
        Submission.objects.create(
            user=self.user,
            puzzle=self.wordle_easy,
            content_type=ContentType.objects.get_for_model(self.wordle_easy),
            object_id=self.wordle_easy.id,
            difficulty='easy',
            points_awarded=100,
            time_taken_ms=10000,
            tries=3,
            puzzle_date=self.test_date,
        )

        # 2. Check the endpoint
        url = reverse('check_submission', kwargs=self.url_kwargs_wordle)
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['hasSubmitted'], True)
        self.assertEqual(data['score'], 100)


class SubmitPuzzleViewTests(BaseGameDataTestCase):
    """
    Tests the SubmitPuzzleView (POST /api/gameplay/submit/...)
    """

    def test_submit_unauthenticated_fails(self):
        """GATE: Is the submit endpoint protected?"""
        self.client.logout()
        url = reverse('submit_puzzle', kwargs=self.url_kwargs_wordle)
        response = self.client.post(
            url, data=json.dumps(self.submit_payload), content_type='application/json'
        )
        # ✅ FIX: @login_required decorator returns 302 (redirect)
        self.assertEqual(response.status_code, 302)

    def test_submit_fails_if_no_attempt_saved(self):
        """GATE: Does submit fail if no progress was ever saved?"""
        self.assertEqual(PuzzleAttempt.objects.count(), 0)  # No attempt

        url = reverse('submit_puzzle', kwargs=self.url_kwargs_wordle)
        response = self.client.post(
            url, data=json.dumps(self.submit_payload), content_type='application/json'
        )

        self.assertEqual(response.status_code, 404)
        self.assertIn("No active attempt", response.json()['error'])

    def test_submit_wordle_success(self):
        """GATE: Does a correct submission create a Submission and return 201?"""
        # 1. Save a *solved* state
        save_url = reverse('save_progress', kwargs=self.url_kwargs_wordle)
        self.client.post(
            save_url,
            data=json.dumps(self.progress_data_wordle_solved),
            content_type='application/json',
        )

        self.assertEqual(PuzzleAttempt.objects.count(), 1)
        self.assertEqual(Submission.objects.count(), 0)

        # 2. Submit the puzzle
        submit_url = reverse('submit_puzzle', kwargs=self.url_kwargs_wordle)
        response = self.client.post(
            submit_url, data=json.dumps(self.submit_payload), content_type='application/json'
        )

        # 3. Check results
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Submission.objects.count(), 1)  # Submission created
        self.assertEqual(PuzzleAttempt.objects.count(), 0)  # Attempt deleted

        sub = Submission.objects.first()
        self.assertEqual(sub.user, self.user)
        self.assertEqual(sub.puzzle, self.wordle_easy)
        self.assertEqual(sub.points_awarded, WordlePuzzle.BASE_POINTS['EASY'])
        self.assertEqual(sub.tries, 2)

        self.user.refresh_from_db()
        self.assertEqual(self.user.current_points, WordlePuzzle.BASE_POINTS['EASY'])

    def test_submit_wordle_loss(self):
        """GATE: Does a submission for a lost game work and give 0 points?"""
        # 1. Save a *lost* state
        save_url = reverse('save_progress', kwargs=self.url_kwargs_wordle)
        self.client.post(
            save_url,
            data=json.dumps(self.progress_data_wordle_failed),
            content_type='application/json',
        )

        self.assertEqual(PuzzleAttempt.objects.count(), 1)
        self.assertEqual(Submission.objects.count(), 0)

        # 2. Submit the puzzle
        submit_url = reverse('submit_puzzle', kwargs=self.url_kwargs_wordle)
        response = self.client.post(
            submit_url, data=json.dumps(self.submit_payload), content_type='application/json'
        )

        # 3. Check results (This test *expects* 0-point submissions to be allowed)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Submission.objects.count(), 1)
        self.assertEqual(PuzzleAttempt.objects.count(), 0)

        sub = Submission.objects.first()
        self.assertEqual(sub.points_awarded, 0)  # 0 points
        self.assertEqual(sub.tries, 6)

        self.user.refresh_from_db()
        self.assertEqual(self.user.current_points, 0)  # No points awarded

    def test_submit_fails_if_validation_fails(self):
        """GATE: Does submit fail if the saved data is not a 'SOLVED' state?"""
        # 1. Save an *ongoing* state
        save_url = reverse('save_progress', kwargs=self.url_kwargs_wordle)
        self.client.post(
            save_url,
            data=json.dumps(self.progress_data_wordle_ongoing),
            content_type='application/json',
        )

        # 2. Try to submit
        submit_url = reverse('submit_puzzle', kwargs=self.url_kwargs_wordle)
        response = self.client.post(
            submit_url, data=json.dumps(self.submit_payload), content_type='application/json'
        )

        self.assertEqual(response.status_code, 400)  # Bad Request
        # ✅ FIX: Check for the new, correct error message from the "ACTIVE" check
        self.assertIn("Puzzle is not yet complete", response.json()['error'])
        self.assertEqual(Submission.objects.count(), 0)  # No submission created
        self.assertEqual(PuzzleAttempt.objects.count(), 1)  # Attempt is NOT deleted


# class GetHintViewTests(BaseGameDataTestCase):
#     """
#     Tests the GetHintView (POST /api/gameplay/hint/...)
#     """

#     def setUp(self):
#         super().setUp()
#         # Set up for Sudoku, which is the only one that uses hints

#         # Save a blank attempt
#         self.save_url = reverse('save_progress', kwargs=self.url_kwargs_sudoku)
#         self.client.post(
#             self.save_url,
#             data=json.dumps(
#                 {
#                     "progress_data": {
#                         "grid": [([{"value": 0}] * 9) for _ in range(9)],
#                         "hints_used": 0,
#                     },
#                     "time_spent_ms": 1000,
#                     "difficulty": "EASY",
#                 }
#             ),
#             content_type='application/json',
#         )
#         self.hint_url = reverse('get_hint', kwargs=self.url_kwargs_sudoku)

#     def test_get_hint_unauthenticated_fails(self):
#         """GATE: Is the hint endpoint protected?"""
#         self.client.logout()
#         response = self.client.post(
#             self.hint_url, data=json.dumps({"difficulty": "EASY"}), content_type='application/json'
#         )
#         # ✅ FIX: @login_required decorator returns 302 (redirect)
#         self.assertEqual(response.status_code, 302)

#     def test_get_hint_success(self):
#         """GATE: Does requesting a hint work correctly?"""
#         response = self.client.post(
#             self.hint_url, data=json.dumps({"difficulty": "EASY"}), content_type='application/json'
#         )

#         self.assertEqual(response.status_code, 200)
#         data = response.json()
#         self.assertIn("hint_index", data)
#         self.assertIn("hint_value", data)
#         self.assertEqual(data['hints_used_new'], 1)

#         # Check that the hint value is correct
#         solution_val = self.sudoku.solution_string[data['hint_index']]
#         self.assertEqual(str(data['hint_value']), solution_val)

#     def test_get_hint_fails_on_limit(self):
#         """GATE: Does it block requests after the hint limit is reached?"""
#         # 1. Use up all the hints (EASY limit is 3)
#         for i in range(SudokuPuzzle.HINT_LIMITS['EASY']):
#             response = self.client.post(
#                 self.hint_url,
#                 data=json.dumps({"difficulty": "EASY"}),
#                 content_type='application/json',
#             )
#             self.assertEqual(response.status_code, 200)

#             # We must *save* the new hint count for the view to see it
#             attempt = PuzzleAttempt.objects.first()
#             attempt.progress_data['hints_used'] = response.json()['hints_used_new']
#             attempt.save()

#         # 4. Try to get one more hint
#         response = self.client.post(
#             self.hint_url, data=json.dumps({"difficulty": "EASY"}), content_type='application/json'
#         )

#         self.assertEqual(response.status_code, 403)
#         self.assertIn(
#             f"Maximum of {SudokuPuzzle.HINT_LIMITS['EASY']} hints exceeded",
#             response.json()['error'],
#         )

#     def test_get_hint_fails_for_wrong_game_type(self):
#         """GATE: Does it fail if we ask for a Wordle hint?"""
#         url = reverse('get_hint', kwargs=self.url_kwargs_wordle)  # Use Wordle URL
#         response = self.client.post(
#             url, data=json.dumps({"difficulty": "EASY"}), content_type='application/json'
#         )
#         self.assertEqual(response.status_code, 400)
#         self.assertIn("Hint request not supported", response.json()['error'])


class TodayViewsTests(BaseGameDataTestCase):
    """
    Tests the GetTodaySubmissionsView and GetTodayCompletedPuzzlesView
    """

    def test_get_today_submissions_unauthenticated_fails(self):
        """GATE: Is the submissions/today/ endpoint protected?"""
        self.client.logout()
        url = reverse('today_submissions')
        response = self.client.get(url)
        # ✅ FIX: @login_required decorator returns 302 (redirect)
        self.assertEqual(response.status_code, 302)

    def test_get_today_submissions_empty(self):
        """GATE: Does it return an empty list when no submissions exist?"""
        url = reverse('today_submissions')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    @mock.patch('gameplay.views.datetime', MockDateTime)
    def test_get_today_submissions_success(self):
        """GATE: Does it return submissions created today?"""
        # 1. Create a submission
        Submission.objects.create(
            user=self.user,
            puzzle=self.wordle_easy,
            content_type=ContentType.objects.get_for_model(self.wordle_easy),
            object_id=self.wordle_easy.id,
            difficulty='easy',
            points_awarded=100,
            time_taken_ms=10000,
            tries=3,
            puzzle_date=self.test_date,
            created_at=self.base_time,  # Today (in PHT for the view's logic)
        )

        # 2. Get submissions
        url = reverse('today_submissions')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['points_awarded'], 100)

    def test_get_today_completed_puzzles_unauthenticated_fails(self):
        """GATE: Is the completed/today/ endpoint protected?"""
        self.client.logout()
        url = reverse('today_completed')
        response = self.client.get(url)
        # ✅ FIX: @login_required decorator returns 302 (redirect)
        self.assertEqual(response.status_code, 302)

    def test_get_today_completed_puzzles_empty(self):
        """GATE: Does it return an empty list when no games are completed?"""
        url = reverse('today_completed')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['completed'], [])

    @mock.patch('gameplay.views.datetime', MockDateTime)
    def test_get_today_completed_puzzles_with_submission(self):
        """GATE: Does it return 'wordle' after a submission?"""
        # 1. Create a submission
        Submission.objects.create(
            user=self.user,
            puzzle=self.wordle_easy,
            content_type=ContentType.objects.get_for_model(self.wordle_easy),
            object_id=self.wordle_easy.id,
            difficulty='easy',
            points_awarded=100,
            time_taken_ms=10000,
            tries=3,
            puzzle_date=self.test_date,
            created_at=self.base_time,
        )

        # 2. Get completed list
        url = reverse('today_completed')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['completed'], ['wordle'])

    @mock.patch('gameplay.views.datetime', MockDateTime)
    def test_get_today_completed_puzzles_with_lost_attempt(self):
        """GATE: Does it return 'wordle' after a lost game?"""
        # 1. Save a *lost* state
        PuzzleAttempt.objects.create(
            user=self.user,
            daily_puzzle=self.daily_puzzle,
            content_type=ContentType.objects.get_for_model(self.wordle_easy),
            object_id=self.wordle_easy.id,
            progress_data={"status": "LOST", "isGameOver": True},
            time_spent_ms=60000,
        )

        # 2. Get completed list
        url = reverse('today_completed')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['completed'], ['wordle'])
