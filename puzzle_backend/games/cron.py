# games/cron.py
from datetime import timedelta

import pytz
from django.core.management import call_command
from django.utils import timezone
from django_cron import CronJobBase, Schedule


class GenerateDailyPuzzlesCronJob(CronJobBase):
    """Generates tomorrow's puzzles at 6:00 AM Philippine Time"""

    RUN_AT_TIMES = ['06:00']
    schedule = Schedule(run_at_times=RUN_AT_TIMES)
    code = 'games.generate_daily_puzzles'

    def do(self):
        pht_tz = pytz.timezone('Asia/Manila')
        now_pht = timezone.now().astimezone(pht_tz)
        print(f"[{now_pht}] Running daily puzzle generation...")

        try:
            call_command('generate_daily_puzzles', days_ahead=1)
            print("✅ Puzzle generation completed")
        except Exception as e:
            print(f"❌ Error: {e}")
            raise


class AggregateLeaderboardsCronJob(CronJobBase):
    """Aggregates yesterday's scores into leaderboards at 12:05 AM"""

    RUN_AT_TIMES = ['00:05']  # Run 5 minutes after midnight
    schedule = Schedule(run_at_times=RUN_AT_TIMES)
    code = 'leaderboards.aggregate_daily'

    def do(self):
        pht_tz = pytz.timezone('Asia/Manila')
        now_pht = timezone.now().astimezone(pht_tz)
        print(f"[{now_pht}] Running leaderboard aggregation...")

        try:
            # Aggregate yesterday's scores
            yesterday = now_pht.date() - timedelta(days=1)
            call_command('aggregate_leaderboards', date=yesterday.isoformat())
            print("✅ Leaderboard aggregation completed")
        except Exception as e:
            print(f"❌ Error: {e}")
            raise
