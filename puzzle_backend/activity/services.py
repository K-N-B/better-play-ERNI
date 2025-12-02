# activity/services.py
from datetime import timedelta
from django.utils import timezone
from gameplay.models import Submission, Challenge
from shop.models import ClaimedReward  # ✅ Import ClaimedReward
from .models import UserActivity
import traceback


class ActivityService:
    """Service for managing user activity and online status"""

    ONLINE_THRESHOLD_MINUTES = 5
    RECENT_ACTIVITY_HOURS = 24
    RECENT_ACTIVITY_LIMIT = 20

    @classmethod
    def update_user_heartbeat(cls, user):
        """Update user's last_active timestamp."""
        UserActivity.objects.update_or_create(user=user, defaults={'last_active': timezone.now()})

    @classmethod
    def get_online_users(cls):
        """Get list of users who are currently online."""
        threshold = timezone.now() - timedelta(minutes=cls.ONLINE_THRESHOLD_MINUTES)
        online_activities = UserActivity.objects.filter(last_active__gte=threshold).select_related(
            'user'
        )
        online_users = [activity.user for activity in online_activities]
        online_users.sort(key=lambda u: u.username.lower())
        return online_users

    @classmethod
    def _format_submission_event(cls, submission):
        """Helper to format a Submission into an activity event dict"""
        try:
            model_name = submission.content_type.model.lower()
            puzzle_names = {
                'wordlepuzzle': 'Wordle',
                'sudokupuzzle': 'Sudoku',
                'ernigrampuzzle': 'ERNIgram',
            }
            puzzle_name = puzzle_names.get(model_name, model_name.title())

            # Convert time to minutes
            total_seconds = submission.time_taken_ms // 1000
            minutes = total_seconds // 60
            seconds = total_seconds % 60
            time_in_minutes = f"{minutes}:{seconds:02d}"

            return {
                'id': f"sub_{submission.id}",
                'event_type': 'submission',
                'created_at': submission.created_at,
                'user': {
                    'id': submission.user.id,
                    'username': submission.user.username,
                    'profile_picture_url': submission.user.profile_picture_url
                },
                'puzzle_name': puzzle_name,
                'difficulty': submission.difficulty,
                'time_in_minutes': time_in_minutes,
            }
        except Exception as e:
            print(f"[ActivityService] Error formatting submission {submission.id}: {e}")
            traceback.print_exc()
            return None

    @classmethod
    def _format_challenge_event(cls, challenge):
        """Helper to format a Challenge into activity event dict(s)"""
        try:
            # Safety check: ensure challenger_submission exists
            if not challenge.challenger_submission:
                print(f"[ActivityService] Challenge {challenge.id} missing challenger_submission")
                return []

            model_name = challenge.challenger_submission.content_type.model.lower()
            puzzle_names = {
                'wordlepuzzle': 'Wordle',
                'sudokupuzzle': 'Sudoku',
                'ernigrampuzzle': 'ERNIgram',
            }
            puzzle_name = puzzle_names.get(model_name, model_name.title())

            events = []

            # Always add "challenge sent" event
            events.append({
                'id': f"chal_sent_{challenge.id}",
                'event_type': 'challenge_sent',
                'created_at': challenge.created_at,
                'challenger': {
                    'id': challenge.challenger.id,
                    'username': challenge.challenger.username,
                    'profile_picture_url': challenge.challenger.profile_picture_url
                },
                'recipient': {
                    'id': challenge.recipient.id,
                    'username': challenge.recipient.username,
                    'profile_picture_url': challenge.recipient.profile_picture_url
                },
                'puzzle_name': puzzle_name,
                'difficulty': challenge.challenger_submission.difficulty,
                'status': challenge.status,
            })

            # If completed, also add "challenge completed" event
            if challenge.status == 'COMPLETED' and challenge.recipient_submission:
                winner_data = None
                if challenge.winner:
                    winner_data = {
                        'id': challenge.winner.id,
                        'username': challenge.winner.username,
                        'profile_picture_url': challenge.winner.profile_picture_url
                    }

                events.append({
                    'id': f"chal_comp_{challenge.id}",
                    'event_type': 'challenge_completed',
                    'created_at': challenge.recipient_submission.created_at,
                    'challenger': {
                        'id': challenge.challenger.id,
                        'username': challenge.challenger.username,
                        'profile_picture_url': challenge.challenger.profile_picture_url
                    },
                    'recipient': {
                        'id': challenge.recipient.id,
                        'username': challenge.recipient.username,
                        'profile_picture_url': challenge.recipient.profile_picture_url
                    },
                    'puzzle_name': puzzle_name,
                    'difficulty': challenge.challenger_submission.difficulty,
                    'status': challenge.status,
                    'winner': winner_data,
                })

            return events

        except Exception as e:
            print(f"[ActivityService] Error formatting challenge {challenge.id}: {e}")
            traceback.print_exc()
            return []

    @classmethod
    def _format_purchase_event(cls, claimed_reward):
        """Helper to format a ClaimedReward into an activity event dict"""
        try:
            # Build the reward dict with proper checks
            reward_data = {
                'id': claimed_reward.reward.id,
                'name': claimed_reward.reward.name,
                'image': None,
            }
            
            # Safely get the image URL
            if claimed_reward.reward.image:
                try:
                    reward_data['image'] = claimed_reward.reward.image.url
                except Exception as img_error:
                    print(f"[ActivityService] Could not get image URL: {img_error}")
            
            event_data = {
                'id': f"purchase_{claimed_reward.id}",
                'event_type': 'shop_purchase',
                'created_at': claimed_reward.claimed_at,
                'user': {
                    'id': claimed_reward.user.id,
                    'username': claimed_reward.user.username,
                    'profile_picture_url': claimed_reward.user.profile_picture_url
                },
                'reward': reward_data,
                'points_spent': claimed_reward.points_spent,
            }
            
            print(f"[ActivityService] ✅ Formatted purchase event: {event_data}")
            return event_data
            
        except Exception as e:
            print(f"[ActivityService] ❌ Error formatting purchase {claimed_reward.id}: {e}")
            traceback.print_exc()
            return None

    @classmethod
    def get_recent_activity(cls):
        """
        Get recent puzzle completions, challenge events, AND shop purchases.
        Returns unified list of activity events sorted by time.
        """
        cutoff_time = timezone.now() - timedelta(hours=cls.RECENT_ACTIVITY_HOURS)

        try:
            # Fetch submissions
            submissions = (
                Submission.objects.filter(created_at__gte=cutoff_time)
                .select_related('user', 'content_type')
                .order_by('-created_at')[:cls.RECENT_ACTIVITY_LIMIT]
            )

            # Fetch challenges
            challenges = (
                Challenge.objects.filter(created_at__gte=cutoff_time)
                .select_related(
                    'challenger', 'recipient', 'winner',
                    'challenger_submission__content_type',
                    'recipient_submission'
                )
                .order_by('-created_at')[:cls.RECENT_ACTIVITY_LIMIT]
            )

            # ✅ Fetch shop purchases
            purchases = (
                ClaimedReward.objects.filter(claimed_at__gte=cutoff_time)
                .select_related('user', 'reward')
                .order_by('-claimed_at')[:cls.RECENT_ACTIVITY_LIMIT]
            )

            # Convert to unified event format
            events = []

            for submission in submissions:
                event = cls._format_submission_event(submission)
                if event:
                    events.append(event)

            for challenge in challenges:
                challenge_events = cls._format_challenge_event(challenge)
                events.extend(challenge_events)

            # ✅ Add purchase events
            for purchase in purchases:
                event = cls._format_purchase_event(purchase)
                if event:
                    events.append(event)

            # Sort all events by created_at (newest first)
            events.sort(key=lambda x: x['created_at'], reverse=True)

            # Return only the top RECENT_ACTIVITY_LIMIT items
            return events[:cls.RECENT_ACTIVITY_LIMIT]

        except Exception as e:
            print(f"[ActivityService] Error in get_recent_activity: {e}")
            traceback.print_exc()
            return []

    @classmethod
    def get_activity_hub_data(cls):
        """Get all data needed for the activity hub in one call."""
        return {
            'recent_activity': cls.get_recent_activity(),
            'online_users': cls.get_online_users(),
        }