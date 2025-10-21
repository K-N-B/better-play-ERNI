"""
Management command to generate daily puzzles using Gemini AI
Run with: python manage.py generate_daily_puzzles
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from games.models import DailyPuzzle
from games.services.ai_puzzle_generator import AIPuzzleGenerator
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Generate daily puzzles for all game types using Gemini AI'

    def handle(self, *args, **options):
        """Main command execution"""
        today = timezone.now().date()
        
        self.stdout.write(self.style.WARNING('\nGenerating daily puzzles with Gemini AI...'))
        
        # Initialize AI generator
        try:
            generator = AIPuzzleGenerator()
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Failed to initialize Gemini: {str(e)}'))
            return
        
        # Delete existing puzzles for today
        deleted_count = DailyPuzzle.objects.filter(date=today).delete()[0]
        if deleted_count > 0:
            self.stdout.write(f'Deleted {deleted_count} existing puzzle(s) for today')
        
        # Game types and difficulties to generate
        puzzle_configs = [
            ('wordle', 'easy'),
            ('wordle', 'hard'),
        ]
        
        success_count = 0
        fail_count = 0
        
        for game_type, difficulty in puzzle_configs:
            try:
                self.stdout.write(f'\nGenerating {game_type} ({difficulty})...')
                
                # Generate puzzle using Gemini
                puzzle_data = generator.generate_wordle_puzzle(difficulty)
                
                # Create database entry
                daily_puzzle = DailyPuzzle.objects.create(
                    game_type=game_type,
                    difficulty=difficulty,
                    date=today,
                    puzzle_data=puzzle_data
                )
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ Generated: {game_type} ({difficulty}) - '
                        f'Word: {puzzle_data["word"]}'
                    )
                )
                success_count += 1
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f'✗ Failed: {game_type} ({difficulty}) - {str(e)}'
                    )
                )
                logger.error(f'Puzzle generation failed: {game_type}/{difficulty} - {e}')
                fail_count += 1
        
        # Summary
        self.stdout.write('\n' + '=' * 60)
        self.stdout.write(f'Successfully generated: {success_count} puzzle(s)')
        if fail_count > 0:
            self.stdout.write(self.style.WARNING(f'Failed to generate: {fail_count} puzzle(s)'))
        self.stdout.write('=' * 60 + '\n')
        
        # Update leaderboards after generating puzzles
        self.stdout.write('\nUpdating leaderboards...')
        try:
            from django.core.management import call_command
            call_command('update_leaderboards')
            self.stdout.write(self.style.SUCCESS('✓ Leaderboards updated\n'))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'Leaderboard update failed: {str(e)}\n'))