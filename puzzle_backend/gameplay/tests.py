import json
from datetime import date
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.utils import timezone 
from datetime import timedelta, datetime
from unittest.mock import patch
from django.urls import reverse

# Import ALL relevant models from games and gameplay apps
from games.models import DailyPuzzle, WordlePuzzle, SudokuPuzzle, ErnigramPuzzle 
from gameplay.models import PuzzleAttempt, Submission
from django.contrib.contenttypes.models import ContentType
from .streak_utils import update_daily_activity_streak
import pytz

User = get_user_model()
# class SaveProgressViewTests(TestCase):
#     def setUp(self):
#         # 1. Setup Client and User
#         self.client = Client()
#         self.user = User.objects.create_user(username='testuser', password='password123')
#         self.client.login(username='testuser', password='password123') 
        
#         # Define a consistent date for setup
#         self.test_date_easy = date(2025, 10, 27)
#         self.test_date_hard = date(2025, 10, 28)

#         # --- 2. Create Placeholder Puzzles (Honoring NOT NULL constraints) ---
        
#         # Wordle Puzzles (Solution length must match the limit_choices_to in DailyPuzzle)
#         self.wordle_easy = WordlePuzzle.objects.create(
#             solution_word="HOUSE", # 5 letters (for easy)
#             difficulty='EASY',
#             date_to_be_used=self.test_date_easy
#         )
#         self.wordle_hard = WordlePuzzle.objects.create(
#             solution_word="TRAVEL", # 6 letters (for hard)
#             difficulty='HARD',
#             date_to_be_used=self.test_date_hard
#         )
        
#         # Sudoku Puzzle (Requires date_to_be_used and 81-char strings)
#         self.placeholder_sudoku = SudokuPuzzle.objects.create(
#             solution_string='123456789' * 9,
#             puzzle_string_easy='100000000' * 9,
#             puzzle_string_hard='100000000' * 9,
#             date_to_be_used=self.test_date_easy
#         )
        
#         # Ernigram Puzzle (Requires date_to_be_used and other CharFields)
#         self.placeholder_ernigram = ErnigramPuzzle.objects.create(
#             solution_phrase="TEST PHRASE", 
#             clue="A simple clue",
#             date_to_be_used=self.test_date_easy # Must be provided!
#         )

#         # --- 3. Create DailyPuzzle instances (Fixes the TypeError) ---
        
#         # Daily Puzzle for EASY Wordle testing (2025-10-27)
#         # NOTE: Using the CORRECT field names: wordle_easy, sudoku, ernigram
#         self.daily_puzzle_easy = DailyPuzzle.objects.create(
#             date=self.test_date_easy,
#             wordle_easy=self.wordle_easy, 
#             wordle_hard=self.wordle_hard, # Must also be linked if NOT NULL
#             sudoku=self.placeholder_sudoku, 
#             ernigram=self.placeholder_ernigram,
#         )

#         # Define the base URL pattern
#         self.save_url_name = 'save_progress' 

#     def _get_save_url(self, daily_puzzle_obj, puzzle_instance):
#         """ Helper to construct the full URL using reverse(). """
#         return reverse(
#             self.save_url_name, 
#             kwargs={
#                 'daily_puzzle_id': daily_puzzle_obj.pk,
#                 'puzzle_model_name': puzzle_instance.__class__.__name__.lower(),
#                 'puzzle_id': puzzle_instance.pk
#             }
#         )

#     # --------------------------------------------------------------------------
#     # Test Cases for Wordle (Focus: Dynamic Limit Enforcement)
#     # --------------------------------------------------------------------------

#     def test_progress_saved_successfully_within_limit(self):
#         """ Test that a valid attempt (e.g., 4 guesses on HARD) is saved/updated. """
#         url = self._get_save_url(self.daily_puzzle_easy, self.wordle_hard)
        
#         # 4 valid guesses (limit is 5 for HARD)
#         payload = {
#             "progress_data": {"guesses": ["RATES", "TRAIN", "FIGHT", "LIGHT"]},
#             "time_spent_ms": 150000,
#             "difficulty": "HARD" 
#         }
        
#         response = self.client.post(
#             url, 
#             data=json.dumps(payload), 
#             content_type='application/json'
#         )
        
#         self.assertEqual(response.status_code, 200)
        
#         # Verify the attempt was created/updated in the database
#         attempt = PuzzleAttempt.objects.get(user=self.user, daily_puzzle=self.daily_puzzle_easy)
#         self.assertEqual(len(attempt.progress_data['guesses']), 4)


#     def test_illegal_guess_rejected_on_hard_mode(self):
#         """ Test that a 6th guess (limit is 5) on HARD mode is rejected (403). """
#         url = self._get_save_url(self.daily_puzzle_easy, self.wordle_hard)
        
#         # 6 guesses sent (exceeds HARD limit of 5)
#         payload = {
#             "progress_data": {"guesses": ["RATES", "TRAIN", "FIGHT", "LIGHT", "BLANK", "ILLEGAL"]},
#             "time_spent_ms": 200000,
#             "difficulty": "HARD"
#         }
        
#         response = self.client.post(
#             url, 
#             data=json.dumps(payload), 
#             content_type='application/json'
#         )
        
#         self.assertEqual(response.status_code, 403) # Forbidden
#         self.assertIn("Maximum of 5 guesses for 'HARD' difficulty exceeded.", response.json()['error'])


#     def test_limit_not_exceeded_on_easy_mode(self):
#         """ Test that 6 guesses (limit is 6) on EASY mode is accepted. """
#         url = self._get_save_url(self.daily_puzzle_easy, self.wordle_easy)
        
#         # 6 guesses sent (matches EASY limit of 6)
#         payload = {
#             "progress_data": {"guesses": ["RATES", "TRAIN", "FIGHT", "LIGHT", "BLANK", "SOLVE"]},
#             "time_spent_ms": 200000,
#             "difficulty": "EASY"
#         }
        
#         response = self.client.post(
#             url, 
#             data=json.dumps(payload), 
#             content_type='application/json'
#         )
        
#         self.assertEqual(response.status_code, 200)
#         attempt = PuzzleAttempt.objects.get(user=self.user, daily_puzzle=self.daily_puzzle_easy)
#         self.assertEqual(len(attempt.progress_data['guesses']), 6)


#     # --------------------------------------------------------------------------
#     # Test Cases for General Failures
#     # --------------------------------------------------------------------------

#     def test_unauthenticated_user_rejected(self):
#         """ Test security: only logged-in users can save progress. """
#         self.client.logout() 
#         url = self._get_save_url(self.daily_puzzle_easy, self.wordle_hard)
#         payload = {"progress_data": {}, "time_spent_ms": 1000, "difficulty": "HARD"}
        
#         response = self.client.post(url, data=json.dumps(payload), content_type='application/json')
        
#         # The login_required decorator redirects unauthenticated users to the login URL (302)
#         self.assertEqual(response.status_code, 302) 

#     def test_invalid_data_format_rejected(self):
#         """ Test that requests with missing required fields are handled gracefully. """
#         url = self._get_save_url(self.daily_puzzle_easy, self.wordle_easy)
        
#         # Case 1: Missing time_spent_ms
#         response1 = self.client.post(
#             url, 
#             data=json.dumps({"progress_data": {"guesses": ["TEST"]}}), 
#             content_type='application/json'
#         )
#         self.assertEqual(response1.status_code, 400)
#         self.assertIn("Invalid data format.", response1.json()['error'])



        

class StreakLogicTests(TestCase):
    def setUp(self):
        # --- 1. Define Base Time (Mock Current Time) ---
        # This time (Oct 25) will be the 'current' time for our tests
        self.base_time = timezone.datetime(2025, 10, 25, 10, 0, 0, tzinfo=pytz.utc)

        # --- 2. Create the Specific Test User ---
        self.user = User.objects.create_user(
            username='jehpentester', 
            email='jehpentester@gmail.com',
            password='testpassword',
            # Do NOT pass current/max streak here; we will set the historical data explicitly below
        )

        # --- 3. Set Initial Broken Streak State ---
        # Define a date two days before the base time to simulate missing a day.
        broken_streak_time = self.base_time - timedelta(days=2) 
        self.user.current_streak_count = 5 # Start with a high streak to prove reset works
        self.user.max_streak_count = 5
        self.user.last_active = broken_streak_time 
        self.user.save() # Crucial: Save the historical data to the database before the test runs!

        # --- 4. Define Submission Context ---

        # 4a. Get ContentType for a Puzzle Model (using WordlePuzzle as the example)
        self.puzzle_model = WordlePuzzle 
        self.puzzle_content_type = ContentType.objects.get_for_model(self.puzzle_model)

        # 4b. Create a Dummy Puzzle Instance (Wordle EASY)
        self.wordle_easy_instance = WordlePuzzle.objects.create(
            # Provide necessary dummy fields for model creation
            solution_word='TESTS', 
            # points_config='{}' 
        )

        # We need a HARD Wordle too (assuming your DailyPuzzle model requires it)
        # We will reuse WordlePuzzle model for simplicity, but need 6+ letters
        self.wordle_hard_instance = WordlePuzzle.objects.create(
            solution_word='TESTES', # 6 letters for hard
        )

        # --- NEW: Create instances for the other required models ---

        # Get models (assuming they are imported at the top)
        self.SudokuPuzzleModel = SudokuPuzzle
        self.ErnigramPuzzleModel = ErnigramPuzzle

        # Create Sudoku Instance (Required fields: solution_string, puzzle_string_easy, puzzle_string_hard, date_to_be_used)
        self.sudoku_instance = SudokuPuzzle.objects.create(
            solution_string='1' * 81,
            puzzle_string_easy='1' * 81,
            puzzle_string_hard='1' * 81,
            date_to_be_used=self.base_time.date() + timedelta(days=11)
        )

        # Create Ernigram Instance (Required fields: solution_phrase, clue, date_to_be_used)
        self.ernigram_instance = ErnigramPuzzle.objects.create(
            solution_phrase='TEST PHRASE',
            clue='A short clue',
            date_to_be_used=self.base_time.date() + timedelta(days=12)
        )

        # 4c. Create a Dummy Daily Puzzle instance (REQUIRES all foreign keys)
        self.daily_puzzle = DailyPuzzle.objects.create(
            date=self.base_time.date() + timedelta(days=10),
            # Ensure these names match the defined attributes above
            wordle_easy=self.wordle_easy_instance, # <-- This name must be defined!
            wordle_hard=self.wordle_hard_instance, 
            sudoku=self.sudoku_instance,
            ernigram=self.ernigram_instance,
        )

        # 4d. Mock the scoring method on the Puzzle Model
        # This is crucial: SubmitPuzzleView calls puzzle_instance.validate_and_score()
        def mock_score(self, progress_data, difficulty):
            return 100, 5 # Returns 100 points and 5 tries (points_awarded, tries)

        # Temporarily patch the method on the class for all tests
        self.puzzle_model.validate_and_score = mock_score

        # 4e. Initialize the test client and the URL
        # Initialize the test client and the URL
        self.client = Client()

        # FIX: Change self.puzzle_instance.pk to a specific instance's pk
        self.submit_url = reverse(
            'submit_puzzle',
            kwargs={
                'daily_puzzle_id': self.daily_puzzle.pk,
                'puzzle_model_name': 'WordlePuzzle',
                # Use the ID of a puzzle instance you successfully created (Wordle Easy)
                'puzzle_id': self.wordle_easy_instance.pk 
            }
        )
    
    # --- Helper to mock the current time and run the function ---
    def _mock_time_and_run_update(self, mock_time):
        """Mocks timezone.now() and calls the streak update function."""
        with patch('django.utils.timezone.now', return_value=mock_time):
            # Pass the user instance to the function
            return update_daily_activity_streak(self.user)
        
    def test_user_stats_view_returns_correct_data(self):
        # 1. Setup Initial Data
        
        # Manually set user stats to non-default values for clear verification
        self.user.current_streak_count = 5
        self.user.max_streak_count = 10
        self.user.current_points = 500
        self.user.total_points_alltime = 1500
        # Set a last_active time
        mock_last_active = self.base_time - timedelta(days=5)
        self.user.last_active = mock_last_active
        self.user.save()
        
        # Use the Django Test Client and authenticate the user
        client = Client()
        client.force_login(self.user)
        
        # 2. Make the Request
        # Use the name defined in urls.py: name='user_stats'
        url = reverse('user_stats') 
        response = client.get(url)
        
        # 3. Assertions
        
        # Check HTTP Status
        self.assertEqual(response.status_code, 200)
        
        # Parse the JSON response
        data = response.json()
        
        # Check Data Integrity
        self.assertEqual(data['username'], 'jehpentester')
        self.assertEqual(data['current_streak_count'], 5)
        self.assertEqual(data['max_streak_count'], 10)
        self.assertEqual(data['current_points'], 500)
        
        # Check that the last_active time is returned as a formatted string (ISO 8601)
        # Note: We only check the beginning of the ISO format as it can be complex.
        self.assertTrue(data['last_active'].startswith(mock_last_active.isoformat()[:19]))


    def test_user_stats_view_requires_login(self):
        # 1. Make the request without logging in
        client = Client()
        url = reverse('user_stats') 
        response = client.get(url)
        
        # 2. Assertions
        # Expect a redirect to the login page (status 302 or 403, but 302 is common for @login_required)
        self.assertEqual(response.status_code, 302)
        # Verify the redirect points to the login page
        self.assertIn('/login/', response.url)

    def test_update_daily_activity_streak_starts_new_streak_when_no_history(self):
        """First activity with no prior last_active should start a new streak at 1."""
        self.user.last_active = None
        self.user.current_streak_count = 0
        self.user.max_streak_count = 0
        self.user.save(update_fields=["last_active", "current_streak_count", "max_streak_count"])

        result = self._mock_time_and_run_update(self.base_time)
        self.user.refresh_from_db()

        self.assertTrue(result)
        self.assertEqual(self.user.current_streak_count, 1)
        self.assertEqual(self.user.max_streak_count, 1)
        self.assertEqual(self.user.last_active, self.base_time)

    def test_update_daily_activity_streak_increments_for_consecutive_day(self):
        """Activity on the day after last_active should increment the streak."""
        prior_day = self.base_time - timedelta(days=1)
        self.user.last_active = prior_day
        self.user.current_streak_count = 3
        self.user.max_streak_count = 4
        self.user.save(update_fields=["last_active", "current_streak_count", "max_streak_count"])

        result = self._mock_time_and_run_update(self.base_time)
        self.user.refresh_from_db()

        self.assertTrue(result)
        self.assertEqual(self.user.current_streak_count, 4)
        self.assertEqual(self.user.max_streak_count, 4)
        self.assertEqual(self.user.last_active, self.base_time)

    def test_update_daily_activity_streak_does_not_change_for_same_day(self):
        """Submitting multiple times in the same day should not change the streak."""
        same_day_time = self.base_time
        previous_timestamp = same_day_time - timedelta(hours=2)
        self.user.last_active = previous_timestamp
        self.user.current_streak_count = 4
        self.user.max_streak_count = 6
        self.user.save(update_fields=["last_active", "current_streak_count", "max_streak_count"])

        result = self._mock_time_and_run_update(same_day_time)
        self.user.refresh_from_db()

        self.assertFalse(result)
        self.assertEqual(self.user.current_streak_count, 4)
        self.assertEqual(self.user.max_streak_count, 6)
        self.assertEqual(self.user.last_active, previous_timestamp)

    def test_update_daily_activity_streak_resets_after_gap(self):
        """Missing more than a day should reset the streak back to 1."""
        gap_day = self.base_time - timedelta(days=3)
        self.user.last_active = gap_day
        self.user.current_streak_count = 7
        self.user.max_streak_count = 9
        self.user.save(update_fields=["last_active", "current_streak_count", "max_streak_count"])

        result = self._mock_time_and_run_update(self.base_time)
        self.user.refresh_from_db()

        self.assertTrue(result)
        self.assertEqual(self.user.current_streak_count, 1)
        self.assertEqual(self.user.max_streak_count, 9)
        self.assertEqual(self.user.last_active, self.base_time)

class SaveProgressViewTests(TestCase):
    def setUp(self):
        # 1. Setup Client and User
        self.client = Client()
        self.user = User.objects.create_user(username='testuser', password='password123')
        self.client.login(username='testuser', password='password123') 
        
        # Define a consistent date for setup
        self.test_date_easy = date(2025, 10, 27)
        self.test_date_hard = date(2025, 10, 28)

        # --- 2. Create Placeholder Puzzles (Honoring NOT NULL constraints) ---
        
        # Wordle Puzzles (Solution length must match the limit_choices_to in DailyPuzzle)
        self.wordle_easy = WordlePuzzle.objects.create(
            solution_word="HOUSE", # 5 letters (for easy)
            difficulty='EASY',
            date_to_be_used=self.test_date_easy
        )
        self.wordle_hard = WordlePuzzle.objects.create(
            solution_word="TRAVEL", # 6 letters (for hard)
            difficulty='HARD',
            date_to_be_used=self.test_date_hard
        )
        
        # Sudoku Puzzle (Requires date_to_be_used and 81-char strings)
        self.placeholder_sudoku = SudokuPuzzle.objects.create(
            solution_string='123456789' * 9,
            puzzle_string_easy='100000000' * 9,
            puzzle_string_hard='100000000' * 9,
            date_to_be_used=self.test_date_easy
        )
        
        # Ernigram Puzzle (Requires date_to_be_used and other CharFields)
        self.placeholder_ernigram = ErnigramPuzzle.objects.create(
            solution_phrase="TEST PHRASE", 
            clue="A simple clue",
            date_to_be_used=self.test_date_easy # Must be provided!
        )

        # --- 3. Create DailyPuzzle instances (Fixes the TypeError) ---
        
        # Daily Puzzle for EASY Wordle testing (2025-10-27)
        # NOTE: Using the CORRECT field names: wordle_easy, sudoku, ernigram
        self.daily_puzzle_easy = DailyPuzzle.objects.create(
            date=self.test_date_easy,
            wordle_easy=self.wordle_easy, 
            wordle_hard=self.wordle_hard, # Must also be linked if NOT NULL
            sudoku=self.placeholder_sudoku, 
            ernigram=self.placeholder_ernigram,
        )

        self.wordle_content_type = ContentType.objects.get_for_model(self.wordle_easy)
        self.sudoku_content_type = ContentType.objects.get_for_model(self.placeholder_sudoku)
        self.ernigram_content_type = ContentType.objects.get_for_model(self.placeholder_ernigram)

        # Simulate a successful game: solved in 3 guesses (HOUSE is the solution)
        # This record MUST exist for test_successful_submission... to pass the initial self.assertTrue() check
        self.solved_attempt = PuzzleAttempt.objects.create(
            user=self.user,
            daily_puzzle=self.daily_puzzle_easy,
            content_type=self.wordle_content_type,
            object_id=self.wordle_easy.pk,
            progress_data={
                "guesses": ["WATER", "FIGHT", "HOUSE"], # Solved in 3 tries
                "status": "SOLVED"
            },
            time_spent_ms=65000 # 65 seconds
        )

        # Define the base URL pattern
        self.save_url_name = 'save_progress' 
        self.submit_url_name = 'submit_puzzle'
        self.hint_url_name = 'get_hint'

    def _get_save_url(self, daily_puzzle_obj, puzzle_instance):
        """ Helper to construct the full URL using reverse(). """
        return reverse(
            self.save_url_name, 
            kwargs={
                'daily_puzzle_id': daily_puzzle_obj.pk,
                'puzzle_model_name': puzzle_instance.__class__.__name__.lower(),
                'puzzle_id': puzzle_instance.pk
            }
        )
        
    def _get_submit_url(self, daily_puzzle_obj, puzzle_instance):
        """ Helper to construct the full SUBMIT URL using reverse(). """
        # Assumes URL pattern: /submit/<str:daily_puzzle_id>/<str:puzzle_model_name>/<int:puzzle_id>/
        return reverse(
            self.submit_url_name, 
            kwargs={
                'daily_puzzle_id': daily_puzzle_obj.pk,
                'puzzle_model_name': puzzle_instance.__class__.__name__.lower(),
                'puzzle_id': puzzle_instance.pk
            }
        )
    

    def _get_progress_url(self, daily_puzzle_obj, puzzle_instance):
        """ Helper to construct the full GET PROGRESS URL using reverse(). """
        return reverse(
            'get_progress', # Use the new URL name
            kwargs={
                'daily_puzzle_id': daily_puzzle_obj.pk,
                'puzzle_model_name': puzzle_instance.__class__.__name__.lower(),
                'puzzle_id': puzzle_instance.pk
            }
        )
    # Add this helper method:
    def _get_hint_url(self, daily_puzzle_obj, puzzle_instance):
        """ Helper to construct the full HINT URL using reverse(). """
        return reverse(
            self.hint_url_name, 
            kwargs={
                'daily_puzzle_id': daily_puzzle_obj.pk,
                'puzzle_model_name': puzzle_instance.__class__.__name__.lower(),
                'puzzle_id': puzzle_instance.pk
            }
        )

    # --------------------------------------------------------------------------
    # Test Cases for Wordle (Focus: Dynamic Limit Enforcement)
    # --------------------------------------------------------------------------

    def test_progress_saved_successfully_within_limit(self):
        """ Test that a valid attempt (e.g., 4 guesses on HARD) is saved/updated. """
        url = self._get_save_url(self.daily_puzzle_easy, self.wordle_hard)
        
        # 4 valid guesses (limit is 5 for HARD)
        payload = {
            "progress_data": {"guesses": ["RATES", "TRAIN", "FIGHT", "LIGHT"]},
            "time_spent_ms": 150000,
            "difficulty": "HARD" 
        }
        
        response = self.client.post(
            url, 
            data=json.dumps(payload), 
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        
        # --- FIX APPLIED HERE: Narrow the query using GFK components ---
        from django.contrib.contenttypes.models import ContentType
        
        # We must specify which exact puzzle instance the attempt belongs to
        attempt = PuzzleAttempt.objects.get(
            user=self.user, 
            daily_puzzle=self.daily_puzzle_easy,
            # Specify the Hard Wordle Puzzle instance:
            object_id=self.wordle_hard.pk,
            content_type=ContentType.objects.get_for_model(self.wordle_hard)
        )
        # --- END FIX ---
        
        # Verification checks
        self.assertEqual(len(attempt.progress_data['guesses']), 4)

        # Note: If this test runs after test_successful_submission..., 
        # it's possible the content type has already been cached in setUp, 
        # but it's safest to define it explicitly here or ensure it's in setUp:
        # self.wordle_hard_content_type = ContentType.objects.get_for_model(self.wordle_hard)
        # ... and use content_type=self.wordle_hard_content_type above.


    def test_illegal_guess_rejected_on_hard_mode(self):
        """ Test that a 7th guess (limit is 6) on HARD mode is rejected (403). """
        url = self._get_save_url(self.daily_puzzle_easy, self.wordle_hard)
        
        # FIX: Send 7 guesses to exceed the new common limit of 6
        payload = {
            "progress_data": {"guesses": [
                "RATES", "TRAIN", "FIGHT", "LIGHT", "BLANK", "GUESS6", "ILLEGAL" 
            ]}, # 7 guesses
            "time_spent_ms": 200000,
            "difficulty": "HARD"
        }
        
        response = self.client.post(url, data=json.dumps(payload), content_type='application/json')
        
        self.assertEqual(response.status_code, 403) # Forbidden
        # FIX: Update the assertion message to match the new limit of 6
        self.assertIn("Maximum of 6 guesses for 'HARD' difficulty exceeded.", response.json()['error'])


    def test_limit_not_exceeded_on_easy_mode(self):
        """ Test that 6 guesses (limit is 6) on EASY mode is accepted. """
        url = self._get_save_url(self.daily_puzzle_easy, self.wordle_easy)
        
        # 6 guesses sent (matches EASY limit of 6)
        payload = {
            "progress_data": {"guesses": ["RATES", "TRAIN", "FIGHT", "LIGHT", "BLANK", "SOLVE"]},
            "time_spent_ms": 200000,
            "difficulty": "EASY"
        }
        
        response = self.client.post(
            url, 
            data=json.dumps(payload), 
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        attempt = PuzzleAttempt.objects.get(user=self.user, daily_puzzle=self.daily_puzzle_easy)
        self.assertEqual(len(attempt.progress_data['guesses']), 6)


    # --------------------------------------------------------------------------
    # Test Cases for General Failures
    # --------------------------------------------------------------------------

    def test_unauthenticated_user_rejected(self):
        """ Test security: only logged-in users can save progress. """
        self.client.logout() 
        url = self._get_save_url(self.daily_puzzle_easy, self.wordle_hard)
        payload = {"progress_data": {}, "time_spent_ms": 1000, "difficulty": "HARD"}
        
        response = self.client.post(url, data=json.dumps(payload), content_type='application/json')
        
        # The login_required decorator redirects unauthenticated users to the login URL (302)
        self.assertEqual(response.status_code, 302) 

    def test_invalid_data_format_rejected(self):
        """ Test that requests with missing required fields are handled gracefully. """
        url = self._get_save_url(self.daily_puzzle_easy, self.wordle_easy)
        
        # Case 1: Missing time_spent_ms
        response1 = self.client.post(
            url, 
            data=json.dumps({"progress_data": {"guesses": ["TEST"]}}), 
            content_type='application/json'
        )
        self.assertEqual(response1.status_code, 400)
        self.assertIn("Invalid data format.", response1.json()['error'])

    # --------------------------------------------------------------------------
    # Test Cases for Submition
    # --------------------------------------------------------------------------


    def test_successful_submission_creates_record_and_deletes_attempt(self):
        """Tests that a solved Wordle puzzle is scored correctly (100) and cleans up the attempt."""
        
        # CRITICAL: Clean up any potential lingering submission/attempt from other tests
        # While setUp/tearDown should handle this, this ensures isolation within the test method.
        Submission.objects.all().delete()
        PuzzleAttempt.objects.filter(pk=self.solved_attempt.pk).delete()
        
        # Recreate the specific solved attempt for this test (ensures a clean state)
        attempt = PuzzleAttempt.objects.create(
            user=self.user,
            daily_puzzle=self.daily_puzzle_easy,
            content_type=self.wordle_content_type,
            object_id=self.wordle_easy.pk,
            progress_data={
                "guesses": ["WATER", "FIGHT", "HOUSE"], 
                "status": "SOLVED"
            },
            time_spent_ms=65000 
        )


    def test_submission_rejects_if_no_active_attempt_found(self):
        """ Tests that trying to submit a non-existent game fails. """
        # Create the URL but use the HARD puzzle which has no active attempt in setUp
        url = self._get_submit_url(self.daily_puzzle_easy, self.wordle_hard)
        
        payload = {"difficulty": "HARD"}

        response = self.client.post(
            url, 
            data=json.dumps(payload), 
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 404)
        self.assertIn("No active attempt found to submit.", response.json()['error'])
        self.assertEqual(Submission.objects.count(), 0)


    # --------------------------------------------------------------------------
    # Test Cases for Submition
    # --------------------------------------------------------------------------

    def test_submission_rejected_due_to_time_limit(self):
        """ Test that progress saving is rejected if time exceeds the Wordle EASY limit (5 minutes/300000ms). """
        url = self._get_save_url(self.daily_puzzle_easy, self.wordle_easy) 
        
        payload = {
            "progress_data": {"guesses": ["RATES", "TRAIN"]},
            "time_spent_ms": 300001, # 1ms over the EASY limit
            "difficulty": "EASY"
        }
        
        response = self.client.post(url, data=json.dumps(payload), content_type='application/json')
        
        self.assertEqual(response.status_code, 403) # Forbidden
        # Verification of the specific error message generated by the view
        self.assertIn("Time limit of 5 minutes for 'EASY' difficulty exceeded.", response.json()['error'])
        # Optional: Check database to ensure no new attempt was created or updated
        # This is indirectly checked since the request failed.


    def test_final_submission_rejected_by_time(self):
        """ Tests that a solved game is rejected by the SubmitPuzzleView if the stored time is over the limit. """
        
        # FIX for UniqueViolation: Delete the conflicting attempt before creation
        # This removes self.solved_attempt so the new one can be created.
        PuzzleAttempt.objects.filter(pk=self.solved_attempt.pk).delete()
        
        # 1. SETUP: Create a Solved but Time-Violating Attempt
        # EASY Wordle solution is "HOUSE" (self.wordle_easy), limit is 5 minutes (300,000 ms).
        time_violating_attempt = PuzzleAttempt.objects.create(
            user=self.user,
            daily_puzzle=self.daily_puzzle_easy,
            content_type=self.wordle_content_type,
            object_id=self.wordle_easy.pk,
            progress_data={
                "guesses": ["WATER", "FIGHT", "HOUSE"], 
                "status": "SOLVED"
            },
            time_spent_ms=300001 # 5 minutes and 1ms (Over the 5-minute limit)
        )
        
        url = self._get_submit_url(self.daily_puzzle_easy, self.wordle_easy)
        
        payload = {"difficulty": "EASY"}

        # 2. SUBMIT
        response = self.client.post(url, data=json.dumps(payload), content_type='application/json')
        
        # 3. VERIFY REJECTION
        self.assertEqual(response.status_code, 403) # Forbidden
        self.assertIn("Time limit of 5 minutes for 'EASY' difficulty was exceeded.", response.json()['error'])
        
        # Verify the Submission was NOT created and the Attempt STILL exists.
        self.assertEqual(Submission.objects.count(), 0)
        self.assertTrue(PuzzleAttempt.objects.filter(pk=time_violating_attempt.pk).exists())



        # --- SUDOKU TEST CASES ---

    def test_sudoku_save_rejected_by_hint_limit(self):
        """Test that saving progress exceeding the 5-hint limit is rejected (403)."""
        url = self._get_save_url(self.daily_puzzle_easy, self.placeholder_sudoku) # EASY limit is 5 hints

        payload = {
            "progress_data": {"hints_used": 6, "final_grid": ""}, # 6 hints sent
            "time_spent_ms": 100000,
            "difficulty": "EASY"
        }

        response = self.client.post(url, data=json.dumps(payload), content_type='application/json')
        
        self.assertEqual(response.status_code, 403)
        self.assertIn("Maximum of 5 hints for 'EASY' difficulty exceeded.", response.json()['error'])


    def test_sudoku_submission_rejected_by_time_limit(self):
        """Test that final submission is rejected if time exceeds the 15-minute EASY limit."""
        # 1. SETUP: Create a Solved but Time-Violating Sudoku Attempt
        sudoku_content_type = ContentType.objects.get_for_model(self.placeholder_sudoku)
        
        # 15 minutes = 900,000 ms. We use 900,001 ms.
        time_violating_attempt = PuzzleAttempt.objects.create(
            user=self.user,
            daily_puzzle=self.daily_puzzle_easy,
            content_type=sudoku_content_type,
            object_id=self.placeholder_sudoku.pk,
            progress_data={
                "final_grid": self.placeholder_sudoku.solution_string, # Must be solved
                "hints_used": 1
            },
            time_spent_ms=900001 # Over the 15-minute limit
        )
        
        url = self._get_submit_url(self.daily_puzzle_easy, self.placeholder_sudoku)
        
        response = self.client.post(url, data=json.dumps({"difficulty": "EASY"}), content_type='application/json')
        
        self.assertEqual(response.status_code, 403)
        self.assertIn("Time limit of 15 minutes for 'EASY' difficulty was exceeded.", response.json()['error'])
        self.assertTrue(PuzzleAttempt.objects.filter(pk=time_violating_attempt.pk).exists()) # Attempt should NOT be deleted


    def test_sudoku_successful_submission_and_scoring(self):
        """Test that a solved Sudoku is scored correctly using base points (200) minus penalty (20)."""
        
        # CRITICAL: Define ContentType locally if it's not a class attribute
        sudoku_content_type = ContentType.objects.get_for_model(self.placeholder_sudoku)
        
        # 1. SETUP: Create a Solved Sudoku Attempt
        # Base: 200 (Easy). Penalty: 2 hints * 20 pts/hint = 40 pts. Expected Score: 160.
        attempt = PuzzleAttempt.objects.create(
            user=self.user,
            daily_puzzle=self.daily_puzzle_easy,
            content_type=sudoku_content_type, # <-- Must use the locally defined ContentType
            object_id=self.placeholder_sudoku.pk,
            progress_data={
                "final_grid": self.placeholder_sudoku.solution_string,
                "hints_used": 2,
                "status": "SOLVED"
            },
            time_spent_ms=100000 # Within limit
        )
        
        # 2. DEFINE URL (This must execute successfully)
        url = self._get_submit_url(self.daily_puzzle_easy, self.placeholder_sudoku)
        
        # 3. SUBMIT
        response = self.client.post(url, data=json.dumps({"difficulty": "EASY"}), content_type='application/json')
        
        # Now check the HTTP status before attempting to query Submission
        self.assertEqual(response.status_code, 201)
        
        # 4. VERIFY SUBMISSION (using GFK components)
        submission = Submission.objects.get(
            user=self.user, 
            content_type=sudoku_content_type, 
            object_id=self.placeholder_sudoku.pk
        )
        
        self.assertEqual(submission.points_awarded, 160) # 200 - 40 = 160
        self.assertEqual(submission.tries, 2)
        self.assertFalse(PuzzleAttempt.objects.filter(pk=attempt.pk).exists())


    def test_sudoku_submission_rejected_if_unsolved(self):
        """Test that a submission fails if the final_grid does not match the solution."""
        sudoku_content_type = ContentType.objects.get_for_model(self.placeholder_sudoku)
        
        attempt = PuzzleAttempt.objects.create(
            user=self.user,
            daily_puzzle=self.daily_puzzle_easy,
            content_type=sudoku_content_type,
            object_id=self.placeholder_sudoku.pk,
            progress_data={
                "final_grid": "999999999" * 9, # Wrong solution
                "hints_used": 0
            },
            time_spent_ms=50000
        )
        
        url = self._get_submit_url(self.daily_puzzle_easy, self.placeholder_sudoku)
        
        response = self.client.post(url, data=json.dumps({"difficulty": "EASY"}), content_type='application/json')
        
        self.assertEqual(response.status_code, 400)
        self.assertIn("Puzzle was not successfully solved", response.json()['error'])
        self.assertTrue(PuzzleAttempt.objects.filter(pk=attempt.pk).exists()) # Attempt should NOT be deleted



    # --- SUDOKU MODEL SNIPPET FOR REFERENCE ---
    def test_ernigram_save_rejected_by_mistake_limit(self):
        """Test that saving progress exceeding the 4-mistake HARD limit is rejected (403)."""
        url = self._get_save_url(self.daily_puzzle_easy, self.placeholder_ernigram)
        
        # HARD limit is 4 mistakes. We send 5.
        payload = {
            "progress_data": {"misses": 5, "guessed_letters": ["A", "E", "I", "O", "U"]}, 
            "time_spent_ms": 100000,
            "difficulty": "HARD"
        }

        response = self.client.post(url, data=json.dumps(payload), content_type='application/json')
        
        self.assertEqual(response.status_code, 403)
        self.assertIn("Maximum of 4 mistakes for 'HARD' difficulty exceeded.", response.json()['error'])


    def test_ernigram_save_accepted_within_mistake_limit(self):
        """Test that saving progress exactly at the 6-mistake EASY limit is accepted (200)."""
        url = self._get_save_url(self.daily_puzzle_easy, self.placeholder_ernigram)
        
        # EASY limit is 6 mistakes. We send 6.
        payload = {
            "progress_data": {"misses": 6, "guessed_letters": ["A", "B", "C", "D", "E", "F"]}, 
            "time_spent_ms": 100000,
            "difficulty": "EASY"
        }

        response = self.client.post(url, data=json.dumps(payload), content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        # Verification must use GFK components
        attempt = PuzzleAttempt.objects.get(
            user=self.user,
            content_type=self.ernigram_content_type,
            object_id=self.placeholder_ernigram.pk
        )
        self.assertEqual(attempt.progress_data['misses'], 6)

    def test_ernigram_submission_rejected_by_time_limit(self):
        """Test that final submission is rejected if time exceeds the 5-minute limit (both difficulties)."""
        
        # 5 minutes = 300,000 ms. We use 300,001 ms.
        time_violating_attempt = PuzzleAttempt.objects.create(
            user=self.user,
            daily_puzzle=self.daily_puzzle_easy,
            content_type=self.ernigram_content_type,
            object_id=self.placeholder_ernigram.pk,
            progress_data={"solved": True, "misses": 2}, 
            time_spent_ms=300001 # Over the 5-minute limit
        )
        
        url = self._get_submit_url(self.daily_puzzle_easy, self.placeholder_ernigram)
        
        response = self.client.post(url, data=json.dumps({"difficulty": "EASY"}), content_type='application/json')
        
        self.assertEqual(response.status_code, 403)
        self.assertIn("Time limit of 5 minutes for 'EASY' difficulty was exceeded.", response.json()['error'])
        # Clean up the specific attempt created for this test
        time_violating_attempt.delete()

    def test_ernigram_successful_submission_and_scoring(self):
        """Test that a solved Ernigram awards the correct HARD base points (300) with no deduction."""
        
        # 1. SETUP: Create a Solved Ernigram Attempt
        # HARD Base Points: 300. 
        attempt = PuzzleAttempt.objects.create(
            user=self.user,
            daily_puzzle=self.daily_puzzle_easy,
            content_type=self.ernigram_content_type,
            object_id=self.placeholder_ernigram.pk,
            progress_data={"solved": True, "misses": 3, "status": "SOLVED"},
            time_spent_ms=50000 
        )
        
        url = self._get_submit_url(self.daily_puzzle_easy, self.placeholder_ernigram)
        
        response = self.client.post(url, data=json.dumps({"difficulty": "HARD"}), content_type='application/json')
        
        self.assertEqual(response.status_code, 201)
        
        # 2. VERIFY SUBMISSION
        submission = Submission.objects.get(
            user=self.user, 
            content_type=self.ernigram_content_type, 
            object_id=self.placeholder_ernigram.pk
        )
        
        self.assertEqual(submission.points_awarded, 300) # Full HARD base points
        self.assertEqual(submission.tries, 3) # Tries records the 3 mistakes
        self.assertFalse(PuzzleAttempt.objects.filter(pk=attempt.pk).exists())



    def _get_progress_url(self, daily_puzzle_obj, puzzle_instance):
        """ Helper to construct the full GET PROGRESS URL using reverse(). """
        return reverse(
            'get_progress', # Use the new URL name
            kwargs={
                'daily_puzzle_id': daily_puzzle_obj.pk,
                'puzzle_model_name': puzzle_instance.__class__.__name__.lower(),
                'puzzle_id': puzzle_instance.pk
            }
        )


    # --- NEW TEST CASES FOR GET PROGRESS VIEW ---

    def test_get_progress_retrieves_existing_attempt(self):
        """ Test that the GET endpoint retrieves the full data for an existing attempt. """
        url = self._get_progress_url(self.daily_puzzle_easy, self.wordle_easy)
        
        # self.solved_attempt exists for self.wordle_easy
        response = self.client.get(url, content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify the structure and key data points
        self.assertTrue(data['exists'])
        self.assertEqual(data['time_spent_ms'], self.solved_attempt.time_spent_ms)
        self.assertEqual(data['progress_data']['guesses'], self.solved_attempt.progress_data['guesses'])
        self.assertTrue('last_saved' in data)


    def test_get_progress_returns_not_found_for_new_game(self):
        """ Test that the GET endpoint returns 'exists: False' for a puzzle not yet started. """
        # Use self.wordle_hard, for which no attempt was created in setUp
        url = self._get_progress_url(self.daily_puzzle_easy, self.wordle_hard) 
        
        response = self.client.get(url, content_type='application/json')
        
        self.assertEqual(response.status_code, 200) # Expect 200, but 'exists' is False
        data = response.json()
        
        # Verify the structure for a new game
        self.assertFalse(data['exists'])
        self.assertIn("No active attempt found", data['message'])


    def test_get_progress_requires_authentication(self):
        """ Test security: ensures unauthenticated users are rejected. """
        self.client.logout()
        url = self._get_progress_url(self.daily_puzzle_easy, self.wordle_easy)
        
        response = self.client.get(url)
        
        # The login_required decorator redirects unauthenticated users to the login URL
        self.assertEqual(response.status_code, 302)




    def test_hint_is_always_accurate(self):
        """Verifies the backend returns the correct solution digit for an empty cell."""
        url = self._get_hint_url(self.daily_puzzle_easy, self.placeholder_sudoku)
        
        # Sudoku solution_string is 81 characters long. 
        # Example: '123456789...'
        # We create a grid that is complete EXCEPT for the cell at index 5, which should be '6'.
        # We substitute a '0' into the solution string at index 5.
        solution = self.placeholder_sudoku.solution_string
        incomplete_grid = solution[:5] + '0' + solution[6:]
        
        # 1. Create Attempt: Start the game with one empty spot
        attempt = PuzzleAttempt.objects.create(
            user=self.user, daily_puzzle=self.daily_puzzle_easy, 
            content_type=self.sudoku_content_type, object_id=self.placeholder_sudoku.pk,
            progress_data={'hints_used': 0, 'final_grid': incomplete_grid},
            time_spent_ms=1000
        )

        # 2. Send Hint Request
        payload = {"difficulty": "EASY"}
        response = self.client.post(url, data=json.dumps(payload), content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # The actual correct digit at index 5 is solution[5]
        expected_hint_value = solution[5]

        # 3. Verify Hint Accuracy and Index
        self.assertEqual(data['hint_index'], 5)
        self.assertEqual(data['hint_value'], expected_hint_value)
        self.assertEqual(data['hints_used_new'], 1)



    def test_hint_request_rejected_at_max_limit(self):
        """Verifies that the server blocks the request when hints_used equals the HINT_LIMITS (5)."""
        url = self._get_hint_url(self.daily_puzzle_easy, self.placeholder_sudoku)
        
        # 1. Create Attempt: Start the game having used the maximum 5 hints
        attempt = PuzzleAttempt.objects.create(
            user=self.user, daily_puzzle=self.daily_puzzle_easy, 
            content_type=self.sudoku_content_type, object_id=self.placeholder_sudoku.pk,
            progress_data={'hints_used': 5, 'final_grid': '0'*81}, # 5 is the EASY limit
            time_spent_ms=1000
        )

        # 2. Send Hint Request
        payload = {"difficulty": "EASY"}
        response = self.client.post(url, data=json.dumps(payload), content_type='application/json')
        
        self.assertEqual(response.status_code, 403) # Forbidden
        self.assertIn("Maximum of 5 hints exceeded", response.json()['error'])

    def test_hint_selection_is_randomized(self):
        """Verifies that the hint_index is NOT always the first available empty cell."""
        url = self._get_hint_url(self.daily_puzzle_easy, self.placeholder_sudoku)
        
        solution = self.placeholder_sudoku.solution_string
        
        # 1. Create a grid with multiple known empty spots at indices 1, 2, 3, 4
        # Ensure index 0 is NOT '0' by using a known digit from the solution (e.g., solution[10])
        # This guarantees the test starts with a known, fixed state.
        
        # We substitute known digits with '0' to ensure they are available empty spots.
        incomplete_grid_list = list(solution)
        # Target indices for randomization: 10, 15, 20, 25
        target_empty_indices = [10, 15, 20, 25] 
        
        for idx in target_empty_indices:
            incomplete_grid_list[idx] = '0'
            
        multiple_blanks_grid = "".join(incomplete_grid_list)

        # The actual first empty index is 10. We expect indices 10, 15, 20, 25 to be hit.
        
        hint_indices = set() # Use a set to automatically track unique indices
        payload = {"difficulty": "EASY"}
        
        # 2. Loop and Request Hints
        for _ in range(10): # Run 10 times to strongly prove randomness
            # Create a fresh attempt for EACH request 
            attempt = PuzzleAttempt.objects.create(
                user=self.user, daily_puzzle=self.daily_puzzle_easy, 
                content_type=self.sudoku_content_type, object_id=self.placeholder_sudoku.pk,
                progress_data={'hints_used': 0, 'final_grid': multiple_blanks_grid},
                time_spent_ms=1000
            )
            
            response = self.client.post(url, data=json.dumps(payload), content_type='application/json')
            self.assertEqual(response.status_code, 200)
            
            data = response.json()
            hint_indices.add(data['hint_index']) # Add to the set
            
            attempt.delete() # Clean up

        # 3. Verification: Check that randomization actually occurred.

        # Check 1: Ensure all returned indices are from our target list.
        for index in hint_indices:
            self.assertIn(index, target_empty_indices, 
                        msg=f"Hint logic is flawed: picked index {index}, which should not be empty.")

        # Check 2: Prove it didn't ALWAYS pick the first available index (index 10).
        # If len(hint_indices) is greater than 1, randomization worked.
        self.assertTrue(len(hint_indices) > 1, 
                        msg=f"Hint selection failed; only one unique index ({hint_indices.pop()}) was chosen in 10 attempts.")








        
