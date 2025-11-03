# leaderboards/management/commands/aggregate_leaderboards.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta
import pytz
from leaderboards.services import LeaderboardAggregator, get_week_start, get_month_start


class Command(BaseCommand):
    help = 'Aggregates scores into leaderboards for specified period'

    def add_arguments(self, parser):
        parser.add_argument(
            '--period',
            type=str,
            choices=['daily', 'weekly', 'monthly', 'all'],
            default='all',
            help='Which period to aggregate (daily, weekly, monthly, or all)',
        )
        parser.add_argument(
            '--date',
            type=str,
            help='Specific date to aggregate (YYYY-MM-DD). Defaults to today.',
        )

    def handle(self, *args, **options):
        period = options['period']
        
        # Determine target date
        if options['date']:
            target_date = date.fromisoformat(options['date'])
        else:
            pht_tz = pytz.timezone('Asia/Manila')
            now_pht = timezone.now().astimezone(pht_tz)
            target_date = now_pht.date()
        
        self.stdout.write(f"Aggregating leaderboards for {target_date}...")
        
        try:
            if period == 'daily' or period == 'all':
                LeaderboardAggregator.update_daily_scores(target_date)
            
            if period == 'weekly' or period == 'all':
                week_start = get_week_start(target_date)
                LeaderboardAggregator.update_weekly_scores(week_start)
            
            if period == 'monthly' or period == 'all':
                month_start = get_month_start(target_date)
                LeaderboardAggregator.update_monthly_scores(month_start)
            
            self.stdout.write(self.style.SUCCESS('\n✅ Aggregation complete!'))
        
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'\n❌ Error: {e}'))
            raise