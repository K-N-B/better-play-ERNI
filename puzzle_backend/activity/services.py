# activity/services.py - FIXED VERSION

from datetime import timedelta

from django.utils import timezone
from gameplay.models import Submission

from .models import UserActivity


class ActivityService:
    """Service for managing user activity and online status"""

    # Configuration
    ONLINE_THRESHOLD_MINUTES = 5  # Consider user online if active within 5 minutes
    RECENT_ACTIVITY_HOURS = 24  # Show activity from last 24 hours
    RECENT_ACTIVITY_LIMIT = 20  # Show last 20 events

    @classmethod
    def update_user_heartbeat(cls, user):
        """
        Update user's last_active timestamp.
        Called when user sends heartbeat ping.
        """
        UserActivity.objects.update_or_create(user=user, defaults={'last_active': timezone.now()})

    @classmethod
    def get_online_users(cls):
        """
        Get list of users who are currently online.
        Online = last_active within ONLINE_THRESHOLD_MINUTES.
        """
        threshold = timezone.now() - timedelta(minutes=cls.ONLINE_THRESHOLD_MINUTES)

        # Get users with recent activity
        online_activities = UserActivity.objects.filter(last_active__gte=threshold).select_related(
            'user'
        )

        # Extract users and order by username
        online_users = [activity.user for activity in online_activities]
        online_users.sort(key=lambda u: u.username.lower())

        return online_users

    @classmethod
    def get_recent_activity(cls):
        """
        ✅ FIX: Get recent puzzle completions WITHOUT filtering by puzzle_type.
        Returns submissions from all puzzle types.
        """
        cutoff_time = timezone.now() - timedelta(hours=cls.RECENT_ACTIVITY_HOURS)

        # ✅ REMOVED: puzzle_type filter (field doesn't exist)
        # Get all recent submissions regardless of puzzle type
        submissions = (
            Submission.objects.filter(created_at__gte=cutoff_time)
            .select_related(
                'user', 'content_type'  # ✅ Load content_type for efficient puzzle_name derivation
            )
            .order_by('-created_at')[: cls.RECENT_ACTIVITY_LIMIT]
        )

        return submissions

    @classmethod
    def get_activity_hub_data(cls):
        """
        Get all data needed for the activity hub in one call.
        Returns dict with recent_activity and online_users.
        """
        return {
            'recent_activity': list(cls.get_recent_activity()),
            'online_users': cls.get_online_users(),
        }
