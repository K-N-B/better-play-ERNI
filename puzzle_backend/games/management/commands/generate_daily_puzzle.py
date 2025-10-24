from django.core.management.base import BaseCommand
from datetime import date
from games.models import WordlePuzzle, SudokuPuzzle, ErnigramPuzzle, DailyPuzzle

class Command(BaseCommand):
    help = 'Create daily puzzles for a given date (or today) - for testing'

    def add_arguments(self, parser):
        parser.add_argument('--date', type=str, help='YYYY-MM-DD')

    def handle(self, *args, **options):
        d = options['date']
        if d:
            d = date.fromisoformat(d)
        else:
            d = date.today()

        # For testing, we create simple placeholder puzzles
        wp, _ = WordlePuzzle.objects.get_or_create(date_to_be_used=d, defaults={'solution_word': 'APPLE'})
        sp, _ = SudokuPuzzle.objects.get_or_create(date_to_be_used=d, defaults={'puzzle_string':'...','solution_string':'...','difficulty':'easy'})
        ep, _ = ErnigramPuzzle.objects.get_or_create(date_to_be_used=d, defaults={'solution_phrase':'HELLO','clue':'greeting'})

        dp, created = DailyPuzzle.objects.get_or_create(date=d, defaults={'wordle': wp, 'sudoku': sp, 'ernigram': ep})
        if not created:
            dp.wordle = wp; dp.sudoku = sp; dp.ernigram = ep; dp.save()

        self.stdout.write(self.style.SUCCESS(f'Daily puzzle created for {d}'))
