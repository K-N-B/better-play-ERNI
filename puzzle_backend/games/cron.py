# games/cron.py
from django_cron import CronJobBase, Schedule
from django.core.management import call_command
from django.utils import timezone
import pytz

class GenerateDailyPuzzlesCronJob(CronJobBase):
    """
    Generates tomorrow's puzzles at 6:00 AM Philippine Time.
    Run frequency: Once per day at 6 AM PHT
    """
    RUN_AT_TIMES = ['06:00']  # 6 AM
    
    schedule = Schedule(run_at_times=RUN_AT_TIMES)
    code = 'games.generate_daily_puzzles'  # Unique code
    
    def do(self):
        """Execute the puzzle generation"""
        pht_tz = pytz.timezone('Asia/Manila')
        now_pht = timezone.now().astimezone(pht_tz)
        
        print(f"[{now_pht}] Running daily puzzle generation cron job...")
        
        try:
            # Generate puzzle for tomorrow
            call_command('generate_daily_puzzles', days_ahead=1)
            print("✅ Puzzle generation completed successfully")
        except Exception as e:
            print(f"❌ Error generating puzzles: {e}")
            raise