from django.core.management.base import BaseCommand
from django.utils import timezone
from gameplay.models import Challenge
import pytz

class Command(BaseCommand):
    help = 'Expire pending challenges that have passed their expiration date'

    def handle(self, *args, **options):
        pht_tz = pytz.timezone('Asia/Manila')
        now_pht = timezone.now().astimezone(pht_tz)
        
        # Find all pending challenges that have expired
        expired_challenges = Challenge.objects.filter(
            status=Challenge.Status.PENDING,
            expires_at__lt=now_pht
        )
        
        count = expired_challenges.count()
        
        if count > 0:
            # Update to EXPIRED status
            expired_challenges.update(status=Challenge.Status.EXPIRED)
            self.stdout.write(
                self.style.SUCCESS(f'Successfully expired {count} challenge(s)')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS('No challenges to expire')
            )