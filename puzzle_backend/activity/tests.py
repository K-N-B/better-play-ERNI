# activity/tests.py
from datetime import timedelta
from unittest import mock

from activity.models import UserActivity
from activity.serializers import (
    ActivityEventSerializer,
    ActivityHubResponseSerializer,
    OnlineUserSerializer,
)
from activity.services import ActivityService
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

# We'll mock gameplay Submission since it's external
from gameplay.models import Submission
from games.models import WordlePuzzle

User = get_user_model()


# ====================================================================
# 1. MODEL TESTS
# ====================================================================


class UserActivityModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='alice', password='test123')

    def test_user_activity_creation(self):
        """Should create a UserActivity record with a valid user."""
        activity = UserActivity.objects.create(user=self.user)
        self.assertIsNotNone(activity.last_active)
        self.assertEqual(
            str(activity), f"{self.user.username} - Last active: {activity.last_active}"
        )

    def test_last_active_auto_updates(self):
        """Should update timestamp on save."""
        activity = UserActivity.objects.create(user=self.user)
        original_time = activity.last_active
        activity.save()
        self.assertGreaterEqual(activity.last_active, original_time)


# ====================================================================
# 2. SERVICE TESTS
# ====================================================================


class ActivityServiceTests(TestCase):
    def setUp(self):
        # Clear potential leftovers
        UserActivity.objects.all().delete()
        User.objects.all().delete()

        # Create users with unique emails
        self.user1 = User.objects.create_user(
            username='bob', email='bob@example.com', password='pw'
        )
        self.user2 = User.objects.create_user(
            username='charlie', email='charlie@example.com', password='pw'
        )

    def test_update_user_heartbeat_creates_or_updates(self):
        """Should create and update UserActivity for a user."""
        ActivityService.update_user_heartbeat(self.user1)
        self.assertTrue(UserActivity.objects.filter(user=self.user1).exists())

        prev_time = UserActivity.objects.get(user=self.user1).last_active
        ActivityService.update_user_heartbeat(self.user1)
        updated_time = UserActivity.objects.get(user=self.user1).last_active
        self.assertNotEqual(prev_time, updated_time)

    def test_get_online_users_filters_correctly(self):
        """Should only include users active within ONLINE_THRESHOLD_MINUTES."""
        now = timezone.now()
        five_mins_ago = now - timedelta(minutes=4)
        old_time = now - timedelta(minutes=10)

        ua1 = UserActivity.objects.create(user=self.user1)
        ua2 = UserActivity.objects.create(user=self.user2)

        # Force manual timestamps AFTER creation
        UserActivity.objects.filter(user=self.user1).update(last_active=five_mins_ago)
        UserActivity.objects.filter(user=self.user2).update(last_active=old_time)

        online_users = ActivityService.get_online_users()
        usernames = [u.username for u in online_users]

        self.assertIn('bob', usernames)
        self.assertNotIn('charlie', usernames)

    @mock.patch('activity.services.Submission.objects')
    def test_get_recent_activity_returns_submissions(self, mock_submission_mgr):
        """Should call Submission.objects.filter with proper cutoff time."""
        mock_submission_mgr.filter.return_value.select_related.return_value.order_by.return_value.__getitem__.return_value = (
            []
        )
        ActivityService.get_recent_activity()
        self.assertTrue(mock_submission_mgr.filter.called)

    @mock.patch('activity.services.ActivityService.get_recent_activity')
    @mock.patch('activity.services.ActivityService.get_online_users')
    def test_get_activity_hub_data_combines_results(self, mock_online, mock_recent):
        """Should combine recent activity + online users without DB collision."""
        mock_online.return_value = [self.user1]
        mock_recent.return_value = ['recent_1']

        data = ActivityService.get_activity_hub_data()
        self.assertIn('recent_activity', data)
        self.assertIn('online_users', data)
        self.assertEqual(data['online_users'][0], self.user1)


# ====================================================================
# 3. SERIALIZER TESTS
# ====================================================================


class ActivitySerializerTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='bob', email='bob@example.com', password='pw')

        self.puzzle_date = timezone.now().date()

        # ✅ Create Wordle puzzle
        self.puzzle = WordlePuzzle.objects.create(
            date_to_be_used=self.puzzle_date, difficulty='EASY', solution_word='APPLE'
        )

        # ✅ Add all required fields for Submission
        content_type = ContentType.objects.get_for_model(WordlePuzzle)
        self.submission = Submission.objects.create(
            user=self.user,
            content_type=content_type,
            object_id=self.puzzle.id,
            puzzle_date=self.puzzle_date,
            time_taken_ms=123456,
            difficulty='EASY',
            points_awarded=10,  # ✅ FIX: Add non-null points_awarded
        )

    def test_activity_event_serializer_formats_correctly(self):
        """Should serialize submission correctly with puzzle name and formatted time."""
        serializer = ActivityEventSerializer(self.submission)
        data = serializer.data

        self.assertEqual(data['user']['username'], 'bob')
        self.assertEqual(data['puzzle_name'], 'Wordle')
        self.assertEqual(data['difficulty'], 'EASY')
        self.assertTrue(data['time_in_minutes'].startswith('2:'))  # 123456ms ≈ 2 minutes

    def test_online_user_serializer_returns_expected_fields(self):
        user = User.objects.create_user(
            username='bob_serializer_test', email='bob_serializer@example.com', password='pw'
        )
        serializer = OnlineUserSerializer(user)

        self.assertEqual(serializer.data['username'], 'bob_serializer_test')
        self.assertIn('id', serializer.data)

    def test_activity_hub_response_serializer_structure(self):
        """Should serialize both online and recent lists."""
        ser = ActivityHubResponseSerializer(
            {
                'recent_activity': [self.submission],
                'online_users': [self.user],
            }
        )
        data = ser.data
        self.assertIn('recent_activity', data)
        self.assertIn('online_users', data)


# ====================================================================
# 4. VIEW TESTS
# ====================================================================

from rest_framework.test import APIClient


class ActivityViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='eva', password='pw123')
        self.client.force_authenticate(user=self.user)

    @mock.patch('activity.services.ActivityService.get_activity_hub_data')
    def test_activity_hub_view_success(self, mock_service):
        """Should return valid data from ActivityService."""
        mock_service.return_value = {
            'recent_activity': [],
            'online_users': [self.user],
        }
        self.client.login(username='bob', password='pw')
        response = self.client.get(reverse('activity-hub'))
        self.assertEqual(response.status_code, 200)
        self.assertIn('online_users', response.json())

    @mock.patch('activity.services.ActivityService.update_user_heartbeat')
    def test_heartbeat_view_success(self, mock_update):
        """Should call ActivityService and return success."""
        self.client.login(username='bob', password='pw')
        response = self.client.post(reverse('heartbeat'))
        self.assertEqual(response.status_code, 200)
        self.assertIn('success', response.json())

    def test_unauthenticated_access_denied(self):
        """Should reject unauthenticated users."""
        client = APIClient()  # fresh unauthenticated client
        response = client.post('/api/heartbeat/')
        self.assertEqual(response.status_code, 401)
