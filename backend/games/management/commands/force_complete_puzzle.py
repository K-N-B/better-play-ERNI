from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from django.utils import timezone
from games.models import DailyPuzzle, UserPuzzleAttempt

User = get_user_model()

class Command(BaseCommand):
    help = "Force complete a puzzle for a given user (for testing streaks and leaderboards)."

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username of the user')
        parser.add_argument('puzzle_id', type=int, help='ID of the puzzle to mark complete')

    def handle(self, *args, **options):
        username = options['username']
        puzzle_id = options['puzzle_id']

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise CommandError(f"User '{username}' does not exist.")

        try:
            puzzle = DailyPuzzle.objects.get(id=puzzle_id)
        except DailyPuzzle.DoesNotExist:
            raise CommandError(f"Puzzle with ID {puzzle_id} not found.")

        attempt, created = UserPuzzleAttempt.objects.get_or_create(
            user=user,
            puzzle=puzzle,
            defaults={'started_at': timezone.now()}
        )

        # Mark as completed
        attempt.completed = True
        attempt.completed_at = timezone.now()
        attempt.is_successful = True
        attempt.save()

        # Optional: trigger streak/leaderboard logic
        if hasattr(user, 'update_streak'):
            user.update_streak()

        self.stdout.write(self.style.SUCCESS(
            f"✅ Puzzle {puzzle_id} force-completed for user '{username}'."
        ))
