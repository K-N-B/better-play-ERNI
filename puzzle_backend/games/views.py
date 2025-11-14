# games/views.py
import datetime
from django.utils import timezone
from games.utils.timezone_helpers import get_local_today
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .services import generate_daily_puzzles

from .models import DailyPuzzle

from .serializers import DailyPuzzleSerializer
import os
from django.http import HttpRequest, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.http import JsonResponse
from django.views import View
from .models import SudokuPuzzle

# Import your new service function
# from .services import generate_daily_puzzles


class DailyPuzzlesView(APIView):
    """
    API endpoint to retrieve the set of daily puzzles for a given date.
    If no date is provided, it defaults to today.
    """

    # permission_classes = [IsAuthenticated] # Uncomment this for production
    # For dev convenience, remove/change for production
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        date_param = request.query_params.get("date", None)
        print("Django timezone now():", timezone.now())
        print("Django timezone date():", timezone.now().date())

        if date_param:
            try:
                target_date = datetime.date.fromisoformat(date_param)
            except ValueError:
                return Response(
                    {"detail": "Invalid date format. Use YYYY-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            target_date = get_local_today()
        try:
            daily_puzzle_set = DailyPuzzle.objects.select_related(
                "wordle_easy", "wordle_hard", "sudoku", "ernigram"
            ).get(date=target_date)
            serializer = DailyPuzzleSerializer(daily_puzzle_set)
            return Response(serializer.data)
        except DailyPuzzle.DoesNotExist:
            return Response(
                {"detail": f"Daily puzzles for {target_date} not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

       


@csrf_exempt
def cron_generate_puzzles_view(request: HttpRequest):

    # 1. SECURITY CHECK: Validate the secret key
    expected_secret = os.environ.get('FASTCRON_SECRET')
    provided_secret = request.GET.get('secret')

    # If the secret is missing or incorrect, deny access.
    if not provided_secret or provided_secret != expected_secret:
        return HttpResponse("Unauthorized Access", status=401)

    # 2. METHOD CHECK: Ensure it's a GET request (as FastCron uses GET by default)
    if request.method != 'GET':
        return HttpResponse("Method Not Allowed", status=405)

    try:
        # 3. EXECUTE THE TASK
        # Call your main puzzle generation function
        generate_daily_puzzles()

        return HttpResponse("Daily puzzles generated successfully.", status=200)

    except Exception as e:
        # 4. ERROR HANDLING: Return a server error if the task fails
        print(f"CRON JOB ERROR: {e}")
        return HttpResponse(f"Internal Server Error during task execution: {e}", status=500)


@method_decorator(csrf_exempt, name="dispatch")
class GetSudokuHintLimitsView(View):
    """Return Sudoku hint limits from backend"""

    def get(self, request):
        return JsonResponse({
            "HINT_LIMITS": SudokuPuzzle.HINT_LIMITS
        })
