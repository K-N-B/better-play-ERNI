# gameplay/middleware.py
from django.utils import timezone
from django.db.models import Q
from datetime import datetime
import pytz


class ChallengeExpiryMiddleware:
    """
    Middleware to automatically mark expired challenges as EXPIRED.
    Runs on every request to ensure challenges past midnight PHT are moved to history.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Import here to avoid circular imports
        from gameplay.models import Challenge

        # Get current time in Philippine Time
        pht_tz = pytz.timezone('Asia/Manila')
        now_pht = timezone.now().astimezone(pht_tz)

        # Find all PENDING challenges that have expired
        expired_challenges = Challenge.objects.filter(
            status=Challenge.Status.PENDING,
            expires_at__lt=now_pht
        )

        # Update them to EXPIRED status
        count = expired_challenges.update(status=Challenge.Status.EXPIRED)

        if count > 0:
            print(f"[ChallengeExpiryMiddleware] ✅ Marked {count} challenges as EXPIRED")

        response = self.get_response(request)
        return response