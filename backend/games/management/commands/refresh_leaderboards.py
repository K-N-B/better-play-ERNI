from django.core.management.base import BaseCommand
from games.models import Leaderboard

class Command(BaseCommand):
    help = "Manually refresh all leaderboards"

    def handle(self, *args, **options):
        periods = ['daily', 'weekly', 'monthly', 'all_time']
        for period in periods:
            # Optionally delete old entries
            Leaderboard.objects.filter(period=period).delete()
            count = Leaderboard.calculate_leaderboard(period)
            self.stdout.write(self.style.SUCCESS(f"Leaderboard '{period}' refreshed: {count} entries"))
