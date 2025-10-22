# games/management/commands/generate_daily_puzzles.py
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from games.models import DailyPuzzle
from games.ai_service import WordleGeneratorAI  # Make sure this import path is correct
from datetime import datetime, timedelta

class Command(BaseCommand):
    help = 'Generates all daily puzzles (e.g., easy and hard Wordle). Use --date YYYY-MM-DD for testing.'

    def add_arguments(self, parser):
        """
        Defines the custom command-line arguments. We only need a date argument for testing,
        as the command is designed to generate a fixed set of puzzles.
        """
        parser.add_argument(
            '--date',
            type=str,
            help='Optional: Specify the date to generate puzzles for in YYYY-MM-DD format. Defaults to today.'
        )

    def handle(self, *args, **options):
        """
        Main command logic. It iterates through a configuration list and generates
        each defined puzzle for the target date.
        """
        # Determine the target date (either from the command line or today's date)
        target_date_str = options.get('date')
        if target_date_str:
            try:
                target_date = datetime.strptime(target_date_str, '%Y-%m-%d').date()
                self.stdout.write(self.style.NOTICE(f"Using specified date for generation: {target_date}"))
            except ValueError:
                raise CommandError("Invalid date format. Please use YYYY-MM-DD.")
        else:
            target_date = timezone.now().date()

        self.stdout.write(f"Starting daily puzzle generation for {target_date}...")

        # --- This list defines which puzzles to generate ---
        # It's easy to add more games (like Sudoku) here in the future.
        games_to_generate = [
            {'game_type': 'wordle', 'difficulty': 'easy'},
            {'game_type': 'wordle', 'difficulty': 'hard'},
        ]

        # Initialize the AI service once
        ai_generator = WordleGeneratorAI()
        generated_count = 0

        # Fetch words from the last 30 days to avoid recent repetitions
        thirty_days_ago = target_date - timedelta(days=30)
        existing_words = list(
            DailyPuzzle.objects.filter(
                game_type='wordle',
                date__gte=thirty_days_ago
            ).values_list('puzzle_data__word', flat=True)
        )
        existing_words = [word.upper() for word in existing_words if word]

        # --- Loop through the configuration to generate each puzzle ---
        for config in games_to_generate:
            game_type = config['game_type']
            difficulty = config['difficulty']

            self.stdout.write(self.style.HTTP_INFO(f"\n--- Processing: {game_type.upper()} ({difficulty.upper()}) ---"))

            # Check if this specific puzzle already exists
            if DailyPuzzle.objects.filter(date=target_date, game_type=game_type, difficulty=difficulty).exists():
                self.stdout.write(
                    self.style.WARNING(f"Skipped: Puzzle already exists for this date, game, and difficulty.")
                )
                continue

            # Generate the puzzle within a try block to handle potential failures gracefully
            try:
                # Generate puzzle data using the AI service
                puzzle_data = ai_generator.generate_wordle_puzzle_data(
                    difficulty=difficulty,
                    existing_words=list(set(existing_words)) # Use the list of words to avoid
                )

                if not puzzle_data or 'word' not in puzzle_data:
                    raise ValueError("Failed to get valid puzzle data from the AI service.")

                # Save the new puzzle to the database
                DailyPuzzle.objects.create(
                    date=target_date,
                    game_type=game_type,
                    difficulty=difficulty,
                    puzzle_data=puzzle_data,
                    is_active=True
                )

                new_word = puzzle_data['word'].upper()
                self.stdout.write(
                    self.style.SUCCESS(
                        f"✓ Success! Generated and stored puzzle: {new_word} for {target_date} ({difficulty})"
                    )
                )
                
                # Add the newly generated word to our list to avoid using it
                # for the 'hard' puzzle if it was just generated for the 'easy' one on the same run.
                existing_words.append(new_word)
                generated_count += 1

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f"✗ Failed to generate {game_type} ({difficulty}): {e}"
                    )
                )
                # Optionally, print the full traceback for debugging
                # import traceback
                # traceback.print_exc()

        self.stdout.write(
            self.style.SUCCESS(f"\n✓ Generation complete! Created {generated_count} new puzzles for {target_date}.")
        )