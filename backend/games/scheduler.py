from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from django.conf import settings
from django_apscheduler.jobstores import DjangoJobStore
from django_apscheduler.models import DjangoJobExecution
from django_apscheduler import util
import logging

logger = logging.getLogger(__name__)


def generate_daily_puzzles():
    from django.core.management import call_command
    try:
        logger.info("Starting daily puzzle generation...")
        call_command('generate_daily_puzzles')
        logger.info("Completed")
    except Exception as e:
        logger.error(f"Failed: {e}")


def update_leaderboards():
    from django.core.management import call_command
    try:
        logger.info("Starting leaderboard update...")
        call_command('update_leaderboards')
        logger.info("Completed")
    except Exception as e:
        logger.error(f"Failed: {e}")


@util.close_old_connections
def delete_old_job_executions(max_age=604_800):
    DjangoJobExecution.objects.delete_old_job_executions(max_age)


def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_jobstore(DjangoJobStore(), "default")

    scheduler.add_job(
        generate_daily_puzzles,
        trigger=CronTrigger(hour=6, minute=0),
        id="generate_daily_puzzles",
        max_instances=1,
        replace_existing=True,
    )
    logger.info("Added job: generate_daily_puzzles")

    scheduler.add_job(
        update_leaderboards,
        trigger=CronTrigger(minute=0),
        id="update_leaderboards",
        max_instances=1,
        replace_existing=True,
    )
    logger.info("Added job: update_leaderboards")

    scheduler.add_job(
        delete_old_job_executions,
        trigger=CronTrigger(day_of_week="mon", hour=0, minute=0),
        id="delete_old_job_executions",
        max_instances=1,
        replace_existing=True,
    )

    try:
        logger.info("Starting scheduler...")
        scheduler.start()
        logger.info("Scheduler started!")
    except Exception as e:
        logger.error(f"Failed to start: {e}")
        scheduler.shutdown()