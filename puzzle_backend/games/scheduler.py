# games/scheduler.py
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from django.core.management import call_command
from django.utils import timezone
import pytz

def generate_daily_puzzles_task():
    """Task to generate tomorrow's puzzles"""
    pht_tz = pytz.timezone('Asia/Manila')
    now_pht = timezone.now().astimezone(pht_tz)
    
    print(f"[{now_pht}] Running daily puzzle generation task...")
    
    try:
        call_command('generate_daily_puzzles', days_ahead=1)
        print("✅ Puzzle generation completed successfully")
    except Exception as e:
        print(f"❌ Error generating puzzles: {e}")


def start_scheduler():
    """Start the APScheduler"""
    scheduler = BackgroundScheduler(timezone='Asia/Manila')
    
    # Schedule job to run daily at 6:00 AM Philippine Time
    scheduler.add_job(
        generate_daily_puzzles_task,
        trigger=CronTrigger(hour=6, minute=0),
        id='generate_daily_puzzles',
        name='Generate Daily Puzzles',
        replace_existing=True,
    )
    
    scheduler.start()
    print("🕐 Scheduler started. Daily puzzles will generate at 6:00 AM PHT.")