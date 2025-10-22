from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from games.models import UserDailyProgress, Leaderboard
from datetime import date, timedelta

User = get_user_model()

class Command(BaseCommand):
    help = 'Generate test data for leaderboard debugging'

    def add_arguments(self, parser):
        parser.add_argument('--username', type=str, help='Username to add points to')
        parser.add_argument('--points', type=int, default=100, help='Points to add')
        parser.add_argument('--date', type=str, help='Date (YYYY-MM-DD), default: today')
        parser.add_argument('--days-back', type=int, help='Generate data for N days back')
        parser.add_argument('--clear', action='store_true', help='Clear all test data first')

    def handle(self, *args, **options):
        username = options.get('username')
        points = options.get('points')
        date_str = options.get('date')
        days_back = options.get('days_back')
        clear = options.get('clear')

        if clear:
            UserDailyProgress.objects.all().delete()
            Leaderboard.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('Cleared all test data'))
            return

        if not username:
            self.stdout.write(self.style.ERROR('Please provide --username'))
            return

        # Parse date
        if date_str:
            test_date = date.fromisoformat(date_str)
        else:
            test_date = date.today()

        # Generate data for multiple days
        if days_back:
            for i in range(days_back):
                past_date = date.today() - timedelta(days=i)
                progress = UserDailyProgress.generate_mock_points_for_player(
                    username=username,
                    points=points + (i * 10),
                    puzzles_completed=3,
                    test_date=past_date
                )
                self.stdout.write(f"✓ {past_date}: {points + (i * 10)} points")
        else:
            # Single day
            progress = UserDailyProgress.generate_mock_points_for_player(
                username=username,
                points=points,
                puzzles_completed=3,
                test_date=test_date
            )
            self.stdout.write(self.style.SUCCESS(
                f"✓ Added {points} points to {username} on {test_date}"
            ))

        # Recalculate leaderboards
        self.stdout.write('\nRecalculating leaderboards...')
        Leaderboard.calculate_leaderboard('daily')
        Leaderboard.calculate_leaderboard('weekly')
        Leaderboard.calculate_leaderboard('monthly')
        
        self.stdout.write(self.style.SUCCESS('\n=== LEADERBOARD RESULTS ==='))
        for period in ['daily', 'weekly', 'monthly', 'all_time']:
            self.stdout.write(f'\n{period.upper()}:')
            entries = Leaderboard.objects.filter(period=period)[:5]
            for entry in entries:
                self.stdout.write(
                    f"  {entry.rank}. {entry.user.username}: "
                    f"{entry.total_points} pts ({entry.puzzles_completed} puzzles)"
                )



# Add points for today
# python manage.py test_leaderboard --username player1 --points 150

# # Add points for specific date
# python manage.py test_leaderboard --username player1 --points 200 --date 2025-10-15

# # Generate 7 days of data
# python manage.py test_leaderboard --username player1 --points 100 --days-back 7

# # Clear all test data
# python manage.py test_leaderboard --clear