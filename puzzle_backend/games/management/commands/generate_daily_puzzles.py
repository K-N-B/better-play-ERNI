# games/management/commands/generate_daily_puzzles.py
from datetime import date, timedelta

import pytz
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from games.models import WordlePuzzle
from games.utils.word_selector import WordSelector


class Command(BaseCommand):
    help = 'Generates daily puzzles for Wordle (and eventually other games)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--date',
            type=str,
            help='Generate puzzle for specific date (YYYY-MM-DD). Defaults to tomorrow.',
        )
        parser.add_argument(
            '--days-ahead',
            type=int,
            default=1,
            help='Generate puzzles for N days ahead (default: 1)',
        )

    def handle(self, *args, **options):
        word_selector = WordSelector()

        # Determine target date(s)
        if options['date']:
            # Specific date provided
            target_date = date.fromisoformat(options['date'])
            dates_to_generate = [target_date]
            self.stdout.write(f"Generating puzzle for {target_date}...")
        else:
            # Generate for N days ahead
            pht_tz = pytz.timezone('Asia/Manila')
            now_pht = timezone.now().astimezone(pht_tz)
            today_pht = now_pht.date()

            days_ahead = options['days_ahead']
            dates_to_generate = [today_pht + timedelta(days=i) for i in range(1, days_ahead + 1)]
            self.stdout.write(f"Generating puzzles for next {days_ahead} day(s)...")

        # Generate puzzles
        created_count = 0
        skipped_count = 0

        for target_date in dates_to_generate:
            created = self._generate_puzzle_for_date(target_date, word_selector)
            if created:
                created_count += 1
            else:
                skipped_count += 1

        # Summary
        self.stdout.write(self.style.SUCCESS("\n✅ Generation complete!"))
        self.stdout.write(f"  Created: {created_count}")
        self.stdout.write(f"  Skipped (already exist): {skipped_count}")

    @transaction.atomic
    def _generate_puzzle_for_date(self, target_date: date, word_selector: WordSelector) -> bool:
        """Generate puzzle for a specific date. Returns True if created, False if exists."""

        # Check if Wordle puzzle already exists
        if WordlePuzzle.objects.filter(date_to_be_used=target_date).exists():
            self.stdout.write(
                self.style.WARNING(f"  ⚠ Wordle puzzle already exists for {target_date}")
            )
            return False

        # Generate Wordle word
        word = word_selector.get_word_for_date(target_date)

        self.stdout.write(
            self.style.SUCCESS(f"  ✓ Created Wordle puzzle for {target_date}: {word}")
        )

        # Note: DailyPuzzle creation is commented out for now since we only have Wordle
        # Uncomment when Sudoku and Ernigram are ready

        # # Create DailyPuzzle entry (links all puzzle types)
        # daily_puzzle = DailyPuzzle.objects.create(
        #     date=target_date,
        #     wordle=wordle_puzzle,
        #     # sudoku=sudoku_puzzle,  # TODO: Add when Sudoku is implemented
        #     # ernigram=ernigram_puzzle,  # TODO: Add when Ernigram is implemented
        # )

        return True
