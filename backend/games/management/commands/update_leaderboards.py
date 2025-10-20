# games/management/commands/generate_daily_puzzles.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from games.models import DailyPuzzle, Leaderboard
from games.services.ai_puzzle_generator import puzzle_generator
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Generate daily puzzles at 6 AM'
    
    def handle(self, *args, **kwargs):
        """Generate puzzles for today"""
        today = timezone.now().date()
        
        self.stdout.write(f"Generating puzzles for {today}...")
        
        # Game types to generate
        games_config = [
            {'game_type': 'wordle', 'difficulty': 'easy'},
            {'game_type': 'wordle', 'difficulty': 'hard'},
            # Add more games here as they're implemented
            # {'game_type': 'hangman', 'difficulty': 'easy'},
            # {'game_type': 'crossword', 'difficulty': 'hard'},
        ]
        
        generated_count = 0
        
        for config in games_config:
            game_type = config['game_type']
            difficulty = config['difficulty']
            
            # Check if puzzle already exists
            existing = DailyPuzzle.objects.filter(
                date=today,
                game_type=game_type,
                difficulty=difficulty
            ).exists()
            
            if existing:
                self.stdout.write(
                    self.style.WARNING(
                        f"Puzzle already exists: {game_type} ({difficulty})"
                    )
                )
                continue
            
            try:
                # Generate puzzle using AI
                if game_type == 'wordle':
                    puzzle_data = puzzle_generator.generate_wordle_puzzle(
                        difficulty=difficulty
                    )
                # Add other game types here
                # elif game_type == 'hangman':
                #     puzzle_data = puzzle_generator.generate_hangman_puzzle(difficulty)
                
                # Save to database
                puzzle = DailyPuzzle.objects.create(
                    date=today,
                    game_type=game_type,
                    difficulty=difficulty,
                    puzzle_data=puzzle_data,
                    is_active=True
                )
                
                generated_count += 1
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f"✓ Generated: {game_type} ({difficulty}) - Word: {puzzle_data['word']}"
                    )
                )
                
            except Exception as e:
                logger.error(f"Failed to generate {game_type} ({difficulty}): {e}")
                self.stdout.write(
                    self.style.ERROR(
                        f"✗ Failed: {game_type} ({difficulty}) - {str(e)}"
                    )
                )
        
        # Update leaderboards
        self.stdout.write("Updating leaderboards...")
        self._update_leaderboards()
        
        self.stdout.write(
            self.style.SUCCESS(
                f"\n✓ Complete! Generated {generated_count} puzzles."
            )
        )
    
    def _update_leaderboards(self):
        """Update all leaderboard periods"""
        for period in ['daily', 'weekly', 'monthly', 'all_time']:
            try:
                count = Leaderboard.calculate_leaderboard(period)
                self.stdout.write(
                    self.style.SUCCESS(
                        f"  ✓ {period.title()}: {count} entries"
                    )
                )
            except Exception as e:
                logger.error(f"Failed to update {period} leaderboard: {e}")
                self.stdout.write(
                    self.style.ERROR(
                        f"  ✗ {period.title()}: Failed"
                    )
                )