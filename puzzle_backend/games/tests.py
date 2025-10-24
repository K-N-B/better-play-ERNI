from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from .models import WordlePuzzle, SudokuPuzzle, ErnigramPuzzle, DailyPuzzle, PuzzleAttempt

User = get_user_model()

class PuzzleAPITests(APITestCase):

    def setUp(self):
        """Set up initial data for tests."""
        # Create users
        self.user = User.objects.create_user(username='testuser', password='password123')
        self.admin_user = User.objects.create_superuser(username='admin', password='password123', email='admin@example.com')

        # Create puzzle instances
        self.today = timezone.now().date()
        self.wordle1 = WordlePuzzle.objects.create(solution_word="PYTHON", date_to_be_used=self.today)
        self.wordle2 = WordlePuzzle.objects.create(solution_word="DJANGO", date_to_be_used=self.today + timezone.timedelta(days=1))
        self.sudoku = SudokuPuzzle.objects.create(
            solution_string='5' * 81,
            puzzle_string_easy='1' * 81,
            puzzle_string_hard='2' * 81,
            date_to_be_used=self.today
        )
        self.ernigram = ErnigramPuzzle.objects.create(
            solution_phrase="HELLO WORLD",
            clue="A common first program.",
            date_to_be_used=self.today
        )

        # Create a DailyPuzzle linking the individual puzzles
        self.daily_puzzle = DailyPuzzle.objects.create(
            date=self.today,
            wordle_easy=self.wordle1,
            wordle_hard=self.wordle2,
            sudoku=self.sudoku,
            ernigram=self.ernigram
        )

    def test_model_str_methods(self):
        """Test the __str__ methods of all models."""
        self.assertEqual(str(self.wordle1), f"Wordle for {self.today}: PYTHON")
        self.assertEqual(str(self.sudoku), f"Sudoku for {self.today}")
        self.assertEqual(str(self.ernigram), f"Ernigram for {self.today}")
        self.assertEqual(str(self.daily_puzzle), f"Puzzles for {self.today}")

    def test_get_daily_puzzles_unauthenticated(self):
        """Ensure unauthenticated users can read puzzle data."""
        url = reverse('dailypuzzle-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['date'], str(self.today))

    def test_create_daily_puzzle_as_admin(self):
        """Ensure admin users can create new daily puzzles."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('dailypuzzle-list')
        new_date = self.today + timezone.timedelta(days=2)
        data = {
            'date': new_date,
            'wordle_easy': self.wordle1.id,
            'wordle_hard': self.wordle2.id,
            'sudoku': self.sudoku.id,
            'ernigram': self.ernigram.id
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(DailyPuzzle.objects.filter(date=new_date).exists())

    def test_create_daily_puzzle_as_normal_user_forbidden(self):
        """Ensure normal users cannot create new daily puzzles."""
        self.client.force_authenticate(user=self.user)
        url = reverse('dailypuzzle-list')
        new_date = self.today + timezone.timedelta(days=2)
        data = {'date': new_date, 'wordle_easy': self.wordle1.id, 'wordle_hard': self.wordle2.id, 'sudoku': self.sudoku.id, 'ernigram': self.ernigram.id}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_and_get_puzzle_attempt(self):
        """Test creating and retrieving a puzzle attempt for an authenticated user."""
        self.client.force_authenticate(user=self.user)
        
        # Create a new puzzle attempt
        url = reverse('puzzleattempt-list')
        data = {
            'daily_puzzle': self.daily_puzzle.date,
            'content_type': 'games.wordlepuzzle', # Example content type
            'object_id': self.wordle1.id,
            'progress_data': {'guesses': ['WORLD']},
            'time_spent_ms': 5000
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PuzzleAttempt.objects.count(), 1)
        self.assertEqual(PuzzleAttempt.objects.first().user, self.user)

        # Retrieve the puzzle attempt
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['progress_data']['guesses'][0], 'WORLD')

    def test_cannot_view_other_user_attempts(self):
        """Ensure users cannot see puzzle attempts from other users."""
        # Create an attempt for self.user
        PuzzleAttempt.objects.create(
            user=self.user,
            daily_puzzle=self.daily_puzzle,
            content_type_id=self.wordle1.id,
            object_id=self.wordle1.id
        )

        # Authenticate as admin and check attempts
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('puzzleattempt-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0) # Admin should see their own, which is none

    def test_update_puzzle_attempt(self):
        """Test that a user can update their own puzzle attempt."""
        attempt = PuzzleAttempt.objects.create(
            user=self.user,
            daily_puzzle=self.daily_puzzle,
            content_type_id=self.wordle1.id,
            object_id=self.wordle1.id,
            progress_data={'guesses': ['INITIAL']},
            time_spent_ms=1000
        )
        self.client.force_authenticate(user=self.user)
        url = reverse('puzzleattempt-detail', kwargs={'pk': attempt.pk})
        updated_data = {
            'progress_data': {'guesses': ['UPDATED']},
            'time_spent_ms': 9999
        }
        response = self.client.patch(url, updated_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh from DB and check values
        attempt.refresh_from_db()
        self.assertEqual(attempt.time_spent_ms, 9999)
        self.assertEqual(attempt.progress_data['guesses'][0], 'UPDATED')