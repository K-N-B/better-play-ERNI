from datetime import datetime as real_datetime
from datetime import timedelta
from unittest import mock

import pytz
from django.contrib.contenttypes.models import ContentType
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from gameplay.models import Submission
from games.models import DailyPuzzle, ErnigramPuzzle, SudokuPuzzle, WordlePuzzle
from rest_framework import status
from rest_framework.test import APITestCase

# Models from other apps we need to create
from users.models import Department, User

# Models we are testing
from .models import (
    DailyDepartmentScore,
    DailyIndividualScore,
    MonthlyDepartmentScore,
    MonthlyIndividualScore,
    WeeklyDepartmentScore,
    WeeklyIndividualScore,
)
from .services import LeaderboardAggregator, get_month_start, get_week_start

# --- Mocking Setup ---

# This is our "today" for all tests
MOCK_DATETIME = timezone.datetime(
    2025, 10, 27, 14, 0, 0, tzinfo=pytz.timezone("Asia/Manila")
)  # This is a Monday
MOCK_DATE = MOCK_DATETIME.date()


class MockDateTime(real_datetime):
    """Mocks datetime.now() to return our fixed MOCK_DATETIME"""

    @classmethod
    def now(cls, tz=None):
        # We must respect the tz argument if it's passed
        if tz:
            return MOCK_DATETIME.astimezone(tz)
        return MOCK_DATETIME


# --- Base Test Case ---


class LeaderboardsBaseTestCase(TestCase):
    """
    Sets up a complex world for leaderboard aggregation tests.

    - Dept A: User 1
    - Dept B: User 2, User 3
    """

    @classmethod
    def setUpTestData(cls):
        cls.test_date_mon = MOCK_DATE
        cls.test_date_tue = MOCK_DATE + timedelta(days=1)
        cls.test_date_next_mon = MOCK_DATE + timedelta(days=7)
        cls.test_date_next_month = MOCK_DATE + timedelta(days=35)

        # Create Departments
        cls.dept_a = Department.objects.create(name="Engineering")
        cls.dept_b = Department.objects.create(name="Sales")

        # Create Users
        cls.user_1 = User.objects.create_user(
            username='user1',
            password='p',
            email='user1@e.com',
            department=cls.dept_a,
            total_points_alltime=1000,
        )
        cls.user_2 = User.objects.create_user(
            username='user2',
            password='p',
            email='user2@e.com',
            department=cls.dept_b,
            total_points_alltime=500,
        )
        cls.user_3 = User.objects.create_user(
            username='user3',
            password='p',
            email='user3@e.com',
            department=cls.dept_b,
            total_points_alltime=2000,
        )

        # Create a generic puzzle to submit against
        cls.puzzle = WordlePuzzle.objects.create(solution_word="TESTS", difficulty="EASY")
        cls.puzzle_ct = ContentType.objects.get_for_model(cls.puzzle)

        # We need DailyPuzzle entries for each day we're testing
        # We have to create all the puzzles for the DailyPuzzle to be valid
        cls.wordle_easy = WordlePuzzle.objects.create(
            solution_word="EASY", difficulty="EASY", date_to_be_used=cls.test_date_mon
        )
        cls.wordle_hard = WordlePuzzle.objects.create(
            solution_word="HARD", difficulty="HARD", date_to_be_used=cls.test_date_mon
        )
        cls.sudoku = SudokuPuzzle.objects.create(
            solution_string="1" * 81,
            puzzle_string_easy="1" * 81,
            puzzle_string_hard="1" * 81,
            date_to_be_used=cls.test_date_mon,
        )
        cls.ernigram = ErnigramPuzzle.objects.create(
            solution_phrase="A", clue="B", date_to_be_used=cls.test_date_mon
        )

        DailyPuzzle.objects.create(
            date=cls.test_date_mon,
            wordle_easy=cls.wordle_easy,
            wordle_hard=cls.wordle_hard,
            sudoku=cls.sudoku,
            ernigram=cls.ernigram,
        )

        # Create puzzles for Tuesday
        cls.wordle_easy_tue = WordlePuzzle.objects.create(
            solution_word="EASY2", difficulty="EASY", date_to_be_used=cls.test_date_tue
        )
        cls.wordle_hard_tue = WordlePuzzle.objects.create(
            solution_word="HARD2", difficulty="HARD", date_to_be_used=cls.test_date_tue
        )
        cls.sudoku_tue = SudokuPuzzle.objects.create(
            solution_string="2" * 81,
            puzzle_string_easy="2" * 81,
            puzzle_string_hard="2" * 81,
            date_to_be_used=cls.test_date_tue,
        )
        cls.ernigram_tue = ErnigramPuzzle.objects.create(
            solution_phrase="C", clue="D", date_to_be_used=cls.test_date_tue
        )

        DailyPuzzle.objects.create(
            date=cls.test_date_tue,
            wordle_easy=cls.wordle_easy_tue,
            wordle_hard=cls.wordle_hard_tue,
            sudoku=cls.sudoku_tue,
            ernigram=cls.ernigram_tue,
        )

        # (Add setups for next_mon and next_month if needed for more complex tests)


# ============================================================================
# 1. SERVICE LAYER TESTS (The Aggregation Logic)
# ============================================================================
class LeaderboardAggregatorTests(LeaderboardsBaseTestCase):

    def test_service_daily_scores(self):
        """GATE: Does update_daily_scores correctly sum submissions?"""

        # 1. Create submissions for Monday
        # User 1 (Dept A): 100 + 50 = 150 points
        Submission.objects.create(
            user=self.user_1,
            puzzle=self.wordle_easy,
            puzzle_date=self.test_date_mon,
            points_awarded=100,
            difficulty='easy',
            tries=1,
            time_taken_ms=1,
        )
        Submission.objects.create(
            user=self.user_1,
            puzzle=self.sudoku,
            puzzle_date=self.test_date_mon,
            points_awarded=50,
            difficulty='easy',
            tries=2,
            time_taken_ms=1,
        )
        # User 2 (Dept B): 200 points
        Submission.objects.create(
            user=self.user_2,
            puzzle=self.ernigram,
            puzzle_date=self.test_date_mon,
            points_awarded=200,
            difficulty='easy',
            tries=1,
            time_taken_ms=1,
        )

        # 2. Run the service
        LeaderboardAggregator.update_daily_scores(self.test_date_mon)

        # 3. Assert Individual Scores
        self.assertEqual(DailyIndividualScore.objects.count(), 2)
        score_u1 = DailyIndividualScore.objects.get(user=self.user_1, date=self.test_date_mon)
        score_u2 = DailyIndividualScore.objects.get(user=self.user_2, date=self.test_date_mon)
        self.assertEqual(score_u1.score, 150)
        self.assertEqual(score_u2.score, 200)

        # 4. Assert Department Scores
        # Note: Your service.py doesn't seem to update department all-time points correctly,
        # but it *does* update daily scores, which we test here.
        self.assertEqual(DailyDepartmentScore.objects.count(), 2)
        score_dA = DailyDepartmentScore.objects.get(department=self.dept_a, date=self.test_date_mon)
        score_dB = DailyDepartmentScore.objects.get(department=self.dept_b, date=self.test_date_mon)
        self.assertEqual(score_dA.score, 150)
        self.assertEqual(score_dB.score, 200)  # Only User 2 from Dept B submitted

    def test_service_weekly_scores(self):
        """GATE: Does update_weekly_scores correctly sum daily scores?"""

        # 1. Create daily scores for two days in the same week
        DailyIndividualScore.objects.create(user=self.user_1, date=self.test_date_mon, score=150)
        DailyIndividualScore.objects.create(user=self.user_2, date=self.test_date_mon, score=200)

        DailyIndividualScore.objects.create(user=self.user_1, date=self.test_date_tue, score=100)
        DailyIndividualScore.objects.create(user=self.user_3, date=self.test_date_tue, score=50)

        # 2. Run the service
        week_start = get_week_start(self.test_date_mon)
        self.assertEqual(week_start, self.test_date_mon)  # Make sure our test date is a Monday
        LeaderboardAggregator.update_weekly_scores(week_start)

        # 3. Assert Weekly Scores
        self.assertEqual(WeeklyIndividualScore.objects.count(), 3)
        score_u1 = WeeklyIndividualScore.objects.get(user=self.user_1, week_start_date=week_start)
        score_u2 = WeeklyIndividualScore.objects.get(user=self.user_2, week_start_date=week_start)
        score_u3 = WeeklyIndividualScore.objects.get(user=self.user_3, week_start_date=week_start)

        self.assertEqual(score_u1.score, 250)  # 150 + 100
        self.assertEqual(score_u2.score, 200)  # 200
        self.assertEqual(score_u3.score, 50)  # 50

    def test_service_monthly_scores(self):
        """GATE: Does update_monthly_scores correctly sum daily scores?"""

        # 1. Create daily scores for two days in the same month
        DailyIndividualScore.objects.create(user=self.user_1, date=self.test_date_mon, score=100)
        DailyIndividualScore.objects.create(user=self.user_1, date=self.test_date_tue, score=200)
        # Create a score for another user
        DailyIndividualScore.objects.create(user=self.user_2, date=self.test_date_tue, score=500)

        # 2. Run the service
        month_start = get_month_start(self.test_date_mon)
        LeaderboardAggregator.update_monthly_scores(month_start)

        # 3. Assert Monthly Scores
        self.assertEqual(MonthlyIndividualScore.objects.count(), 2)
        score_u1 = MonthlyIndividualScore.objects.get(
            user=self.user_1, month_start_date=month_start
        )
        score_u2 = MonthlyIndividualScore.objects.get(
            user=self.user_2, month_start_date=month_start
        )

        self.assertEqual(score_u1.score, 300)  # 100 + 200
        self.assertEqual(score_u2.score, 500)  # 500

    @mock.patch('leaderboards.services.LeaderboardAggregator.update_monthly_scores')
    @mock.patch('leaderboards.services.LeaderboardAggregator.update_weekly_scores')
    @mock.patch('leaderboards.services.LeaderboardAggregator.update_daily_scores')
    def test_service_update_all_for_date_calls_all_services(
        self, mock_daily, mock_weekly, mock_monthly
    ):
        """GATE: Does update_all_for_date call the daily, weekly, and monthly updaters?"""
        from .services import LeaderboardAggregator  # ✅ Import inside function

        LeaderboardAggregator.update_all_for_date(self.test_date_mon)

        mock_daily.assert_called_once_with(self.test_date_mon)
        mock_weekly.assert_called_once_with(
            self.test_date_mon
        )  # get_week_start(self.test_date_mon) returns self.test_date_mon
        mock_monthly.assert_called_once_with(self.test_date_mon.replace(day=1))


# ============================================================================
# 2. API / VIEW TESTS
# ============================================================================
# We patch timezone.now() where it's imported in the views.py file
@mock.patch('leaderboards.views.timezone.now', MockDateTime.now)
class GetLeaderboardViewTests(LeaderboardsBaseTestCase, APITestCase):
    """
    Tests the GetLeaderboardView (GET /api/leaderboards/leaderboard/)
    This class uses APITestCase to easily make API requests.
    """

    def setUp(self):
        """
        Create a full set of leaderboard data for all periods.
        This tests the API's ability to *retrieve*, not calculate.
        """
        # --- Create Mock Leaderboard Data ---

        # All-Time (on the User/Dept models)
        # user_1 (Dept A): 1000
        # user_2 (Dept B): 500
        # user_3 (Dept B): 2000
        # These are set in setUpTestData and available as self.user_1 etc.
        patcher = mock.patch('leaderboards.views.timezone.now', MockDateTime.now)
        self.addCleanup(patcher.stop)
        patcher.start()

        # Departments (set in setUpTestData)
        self.dept_a.total_points_alltime = 1000
        self.dept_a.save()
        self.dept_b.total_points_alltime = 2500  # 500 + 2000
        self.dept_b.save()

        # Daily (for MOCK_DATE)
        self.daily_date = MOCK_DATE
        DailyIndividualScore.objects.create(user=self.user_1, date=self.daily_date, score=100)
        DailyIndividualScore.objects.create(user=self.user_2, date=self.daily_date, score=200)
        DailyDepartmentScore.objects.create(department=self.dept_a, date=self.daily_date, score=100)
        DailyDepartmentScore.objects.create(department=self.dept_b, date=self.daily_date, score=200)

        # Weekly
        self.week_start = get_week_start(self.daily_date)
        WeeklyIndividualScore.objects.create(
            user=self.user_1, week_start_date=self.week_start, score=150
        )
        WeeklyIndividualScore.objects.create(
            user=self.user_2, week_start_date=self.week_start, score=250
        )
        WeeklyDepartmentScore.objects.create(
            department=self.dept_a, week_start_date=self.week_start, score=150
        )
        WeeklyDepartmentScore.objects.create(
            department=self.dept_b, week_start_date=self.week_start, score=250
        )

        # Monthly
        self.month_start = get_month_start(self.daily_date)
        MonthlyIndividualScore.objects.create(
            user=self.user_1, month_start_date=self.month_start, score=300
        )
        MonthlyIndividualScore.objects.create(
            user=self.user_2, month_start_date=self.month_start, score=400
        )
        MonthlyDepartmentScore.objects.create(
            department=self.dept_a, month_start_date=self.month_start, score=300
        )
        MonthlyDepartmentScore.objects.create(
            department=self.dept_b, month_start_date=self.month_start, score=400
        )

    def test_api_is_publicly_accessible(self):
        """GATE: Is the leaderboard API public (AllowAny)?"""
        url = reverse('get-leaderboard')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_api_get_daily_individual_ranking(self):
        """GATE: Does API return correct Daily Individual data in order?"""
        url = reverse('get-leaderboard')
        # Test ?date= filter
        response = self.client.get(
            url, {'type': 'individual', 'period': 'daily', 'date': self.daily_date.isoformat()}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

        # Check ranking
        self.assertEqual(response.data[0]['score'], 200)  # user_2
        self.assertEqual(response.data[0]['user']['username'], 'user2')
        self.assertEqual(response.data[1]['score'], 100)  # user_1
        self.assertEqual(response.data[1]['user']['username'], 'user1')

    def test_api_get_weekly_department_ranking(self):
        """GATE: Does API return correct Weekly Department data in order?"""
        url = reverse('get-leaderboard')
        # Test default period (weekly) and default date (today)
        response = self.client.get(url, {'type': 'department'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

        # Check ranking
        self.assertEqual(response.data[0]['score'], 250)  # Dept B
        self.assertEqual(response.data[0]['department']['name'], 'Sales')
        self.assertEqual(response.data[1]['score'], 150)  # Dept A
        self.assertEqual(response.data[1]['department']['name'], 'Engineering')

    def test_api_get_monthly_individual_ranking(self):
        """GATE: Does API return correct Monthly Individual data in order?"""
        url = reverse('get-leaderboard')
        response = self.client.get(url, {'type': 'individual', 'period': 'monthly'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

        # Check ranking
        self.assertEqual(response.data[0]['score'], 400)  # user_2
        self.assertEqual(response.data[1]['score'], 300)  # user_1

    def test_api_get_all_time_individual_ranking(self):
        """GATE: Does API return correct All-Time Individual data in order?"""
        url = reverse('get-leaderboard')
        response = self.client.get(url, {'type': 'individual', 'period': 'all_time'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)  # All 3 users

        # Check ranking (based on total_points_alltime in setUpTestData)
        self.assertEqual(response.data[0]['score'], 2000)  # user_3
        self.assertEqual(response.data[0]['user']['username'], 'user3')
        self.assertEqual(response.data[1]['score'], 1000)  # user_1
        self.assertEqual(response.data[2]['score'], 500)  # user_2

    def test_api_get_all_time_department_ranking(self):
        """GATE: Does API return correct All-Time Department data in order?"""
        url = reverse('get-leaderboard')
        response = self.client.get(url, {'type': 'department', 'period': 'all_time'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)  # All 2 departments

        # Check ranking
        self.assertEqual(response.data[0]['score'], 2500)  # Dept B (500 + 2000)
        self.assertEqual(response.data[0]['department']['name'], 'Sales')
        self.assertEqual(response.data[1]['score'], 1000)  # Dept A
        self.assertEqual(response.data[1]['department']['name'], 'Engineering')
