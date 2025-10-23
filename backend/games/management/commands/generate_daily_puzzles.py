from django.core.management.base import BaseCommand
from django.utils import timezone
from games.models import Puzzle
from games.services.gemini_service import GeminiPuzzleGenerator
from games.services.leaderboard_service import LeaderboardService
from games.services.streak_service import StreakService
from datetime import timedelta


class Command(BaseCommand):
    help = 'Generate daily puzzles and perform daily maintenance tasks'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--date',
            type=str,
            help='Generate puzzles for specific date (YYYY-MM-DD). Defaults to today.'
        )
    
    def handle(self, *args, **options):
        """
        Main command execution.
        Should run daily at 6 AM server time via cron or Celery Beat.
        """
        # Determine target date
        if options['date']:
            from datetime import datetime
            target_date = datetime.strptime(options['date'], '%Y-%m-%d').date()
        else:
            target_date = timezone.now().date()
        
        self.stdout.write(self.style.SUCCESS(
            f'\n{"="*60}\n'
            f'Starting Daily Puzzle Generation for {target_date}\n'
            f'{"="*60}\n'
        ))
        
        # 1. Archive yesterday's puzzles
        self._archive_old_puzzles(target_date)
        
        # 2. Generate new puzzles
        self._generate_puzzles(target_date)
        
        # 3. Check and break streaks
        self._update_streaks()
        
        # 4. Reset daily points
        self._reset_daily_points()
        
        # 5. Check if it's Monday (reset weekly)
        if target_date.weekday() == 0:  # Monday
            self._reset_weekly_points()
        
        # 6. Check if it's 1st of month (reset monthly)
        if target_date.day == 1:
            self._reset_monthly_points()
        
        # 7. Refresh leaderboards
        self._refresh_leaderboards()
        
        self.stdout.write(self.style.SUCCESS(
            f'\n{"="*60}\n'
            f'Daily Maintenance Complete!\n'
            f'{"="*60}\n'
        ))
    
    def _archive_old_puzzles(self, target_date):
        """Mark yesterday's puzzles as inactive"""
        self.stdout.write('📦 Archiving old puzzles...')
        
        yesterday = target_date - timedelta(days=1)
        count = Puzzle.objects.filter(
            puzzle_date__lt=target_date,
            is_active=True
        ).update(is_active=False)
        
        self.stdout.write(self.style.SUCCESS(f'   ✓ Archived {count} puzzles\n'))
    
    def _generate_puzzles(self, target_date):
        """Generate new puzzles using Gemini AI"""
        self.stdout.write('🤖 Generating new puzzles with Gemini AI...')
        
        # Check if puzzles already exist for this date
        existing_count = Puzzle.objects.filter(puzzle_date=target_date).count()
        if existing_count > 0:
            self.stdout.write(self.style.WARNING(
                f'   ⚠ {existing_count} puzzles already exist for {target_date}. Skipping generation.\n'
            ))
            return
        
        # Generate all puzzles
        puzzle_data_list = GeminiPuzzleGenerator.generate_all_daily_puzzles(target_date)
        
        # Create puzzle records
        created_count = 0
        for puzzle_data in puzzle_data_list:
            puzzle = Puzzle.objects.create(**puzzle_data)
            created_count += 1
            self.stdout.write(
                f'   ✓ Created {puzzle.puzzle_type.upper()} ({puzzle.difficulty}): '
                f'{puzzle.solution_word or puzzle.solution_phrase or "Sudoku"}'
            )
        
        self.stdout.write(self.style.SUCCESS(f'   ✓ Generated {created_count} puzzles\n'))
    
    def _update_streaks(self):
        """Check and update user streaks"""
        self.stdout.write('🔥 Updating streaks...')
        
        broken_count = StreakService.check_and_break_streaks()
        
        self.stdout.write(self.style.SUCCESS(f'   ✓ Updated streaks ({broken_count} broken)\n'))
    
    def _reset_daily_points(self):
        """Reset daily point totals"""
        self.stdout.write('🔄 Resetting daily points...')
        
        LeaderboardService.reset_daily_points()
        
        self.stdout.write(self.style.SUCCESS('   ✓ Daily points reset\n'))
    
    def _reset_weekly_points(self):
        """Reset weekly point totals (Monday only)"""
        self.stdout.write('🔄 Resetting weekly points...')
        
        LeaderboardService.reset_weekly_points()
        
        self.stdout.write(self.style.SUCCESS('   ✓ Weekly points reset\n'))
    
    def _reset_monthly_points(self):
        """Reset monthly point totals (1st of month only)"""
        self.stdout.write('🔄 Resetting monthly points...')
        
        LeaderboardService.reset_monthly_points()
        
        self.stdout.write(self.style.SUCCESS('   ✓ Monthly points reset\n'))
    
    def _refresh_leaderboards(self):
        """Recalculate all leaderboard rankings"""
        self.stdout.write('🏆 Refreshing leaderboards...')
        
        results = LeaderboardService.refresh_all_leaderboards()
        
        for period, count in results.items():
            self.stdout.write(f'   ✓ {period.capitalize()}: {count} entries')
        
        self.stdout.write(self.style.SUCCESS('   ✓ Leaderboards refreshed\n'))


"""
CRON SETUP INSTRUCTIONS:

1. Add to your server's crontab:
   0 6 * * * cd /path/to/project && python manage.py generate_daily_puzzles

2. Or use Celery Beat (recommended for production):
   # In your celery.py:
   from celery.schedules import crontab
   
   app.conf.beat_schedule = {
       'generate-daily-puzzles': {
           'task': 'games.tasks.generate_daily_puzzles',
           'schedule': crontab(hour=6, minute=0),
       },
   }

3. Manual execution for testing:
   python manage.py generate_daily_puzzles
   python manage.py generate_daily_puzzles --date=2025-10-24
"""