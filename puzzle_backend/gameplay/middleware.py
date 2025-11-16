from django.utils import timezone
from .models import Challenge
import pytz

class ChallengeExpiryMiddleware:
    """
    Middleware to automatically expire challenges on each request
    (lightweight, only runs updates when needed)
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Run expiry check before processing the request
        self.expire_old_challenges()
        response = self.get_response(request)
        return response

    def expire_old_challenges(self):
        """Expire any pending challenges past their expiration time"""
        pht_tz = pytz.timezone('Asia/Manila')
        now_pht = timezone.now().astimezone(pht_tz)
        
        # Only update challenges that are pending and expired
        Challenge.objects.filter(
            status=Challenge.Status.PENDING,
            expires_at__lt=now_pht
        ).update(status=Challenge.Status.EXPIRED)