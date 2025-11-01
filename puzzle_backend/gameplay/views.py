# gameplay/views.py - COMPLETE VERSION WITH ALL 4 VIEWS

from django.views import View
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect
from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from django.db.models import F
import json
import random

from .models import PuzzleAttempt, Submission
from games.models import DailyPuzzle, WordlePuzzle, SudokuPuzzle, ErnigramPuzzle
from leaderboards.services import LeaderboardAggregator


# ============================================================================
# VIEW 1: SaveProgressView - Save/Update Game State
# ============================================================================
@method_decorator(csrf_protect, name="dispatch")
@method_decorator(login_required, name="post")
class SaveProgressView(View):
    """
    Handles POST requests to save or update a user's progress for a specific puzzle attempt.
    Also handles validation for time limits and game-specific move/hint/mistake limits.
    """

    def post(self, request, daily_puzzle_id, puzzle_model_name, puzzle_id):
        user = request.user

        # 1. Input Validation and Setup
        try:
            data = json.loads(request.body)
            new_progress_data = data.get("progress_data")
            new_time_spent = data.get("time_spent_ms")
            difficulty = data.get("difficulty", "EASY").upper()

            if not isinstance(new_progress_data, dict) or new_time_spent is None:
                return JsonResponse({"error": "Invalid data format."}, status=400)

            daily_puzzle = get_object_or_404(DailyPuzzle, pk=daily_puzzle_id)

            # Dynamically get the puzzle model
            puzzle_model_name_lower = puzzle_model_name.lower()
            if puzzle_model_name_lower == "wordlepuzzle":
                PuzzleModel = WordlePuzzle
            elif puzzle_model_name_lower == "sudokupuzzle":
                PuzzleModel = SudokuPuzzle
            elif puzzle_model_name_lower == "ernigrampuzzle":
                PuzzleModel = ErnigramPuzzle
            else:
                return JsonResponse({"error": "Unknown puzzle type."}, status=400)

            puzzle_instance = get_object_or_404(PuzzleModel, pk=puzzle_id)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON."}, status=400)
        except Exception as e:
            return JsonResponse({"error": f"Invalid puzzle reference: {e}"}, status=400)

        # 2. TIME LIMIT ENFORCEMENT
        if hasattr(PuzzleModel, "TIME_LIMITS_MS"):
            time_limits = PuzzleModel.TIME_LIMITS_MS
            max_time_ms = time_limits.get(difficulty)

            if max_time_ms is None:
                return JsonResponse(
                    {"error": f"Invalid difficulty '{difficulty}' for time limit check."},
                    status=400,
                )

            if new_time_spent > max_time_ms:
                max_time_minutes = max_time_ms / 60000
                return JsonResponse(
                    {
                        "error": f"Time limit of {int(max_time_minutes)} minutes for '{difficulty}' difficulty exceeded."
                    },
                    status=403,
                )

        # 3. GUESS/HINT/MISTAKE LIMIT ENFORCEMENT
        limit_config = None
        current_count = None
        limit_type = None

        if hasattr(PuzzleModel, "GUESS_LIMITS"):
            limit_config = PuzzleModel.GUESS_LIMITS
            current_count = len(new_progress_data.get("guesses", []))
            limit_type = "guesses"

        elif hasattr(PuzzleModel, "HINT_LIMITS"):
            limit_config = PuzzleModel.HINT_LIMITS
            current_count = new_progress_data.get("hints_used", 0)
            limit_type = "hints"

        elif hasattr(PuzzleModel, "MISTAKE_LIMITS"):
            limit_config = PuzzleModel.MISTAKE_LIMITS
            current_count = new_progress_data.get("misses", 0)
            limit_type = "mistakes"

        if limit_config is not None and current_count is not None:
            max_limit = limit_config.get(difficulty)

            if max_limit is None:
                return JsonResponse(
                    {"error": f"Invalid difficulty '{difficulty}' for move limit check."},
                    status=400,
                )

            if current_count > max_limit:
                return JsonResponse(
                    {"error": f"Maximum of {max_limit} {limit_type} for '{difficulty}' difficulty exceeded."},
                    status=403,
                )

        # 4. Get or Start the Attempt (UPSERT)
        attempt, created = PuzzleAttempt.objects.get_or_start_attempt(
            user=user, daily_puzzle=daily_puzzle, puzzle_instance=puzzle_instance
        )

        # 5. Update the Attempt's state
        attempt.progress_data.update(new_progress_data)
        attempt.time_spent_ms = new_time_spent
        attempt.save()

        return JsonResponse(
            {
                "message": "Progress saved successfully.",
                "last_saved": attempt.last_saved.isoformat(),
            }
        )


# ============================================================================
# VIEW 2: GetProgressView - Retrieve Saved Game State
# ============================================================================
@method_decorator(csrf_protect, name="dispatch")
@method_decorator(login_required, name="get")
class GetProgressView(View):
    """
    Handles GET requests to retrieve a user's current PuzzleAttempt state.
    """

    def get(self, request, daily_puzzle_id, puzzle_model_name, puzzle_id):
        user = request.user

        try:
            daily_puzzle = get_object_or_404(DailyPuzzle, pk=daily_puzzle_id)

            # Dynamically determine the PuzzleModel
            if puzzle_model_name.lower() == "wordlepuzzle":
                PuzzleModel = WordlePuzzle
            elif puzzle_model_name.lower() == "sudokupuzzle":
                PuzzleModel = SudokuPuzzle
            elif puzzle_model_name.lower() == "ernigrampuzzle":
                PuzzleModel = ErnigramPuzzle
            else:
                return JsonResponse({"error": "Unknown puzzle type."}, status=400)

            puzzle_instance = get_object_or_404(PuzzleModel, pk=puzzle_id)
            puzzle_content_type = ContentType.objects.get_for_model(puzzle_instance)

        except Exception:
            return JsonResponse({"error": "Invalid puzzle reference."}, status=400)

        # Retrieve the Attempt
        try:
            attempt = PuzzleAttempt.objects.get(
                user=user,
                daily_puzzle=daily_puzzle,
                content_type=puzzle_content_type,
                object_id=puzzle_instance.pk,
            )

            return JsonResponse(
                {
                    "exists": True,
                    "progress_data": attempt.progress_data,
                    "time_spent_ms": attempt.time_spent_ms,
                    "last_saved": attempt.last_saved.isoformat(),
                },
                status=200,
            )

        except PuzzleAttempt.DoesNotExist:
            return JsonResponse(
                {
                    "exists": False,
                    "message": "No active attempt found. Start a new game.",
                },
                status=200,
            )


# ============================================================================
# VIEW 3: SubmitPuzzleView - Submit Completed Puzzle (WITH LEADERBOARD UPDATE)
# ============================================================================
@method_decorator(csrf_protect, name="dispatch")
@method_decorator(login_required, name="post")
class SubmitPuzzleView(View):
    @transaction.atomic
    def post(self, request, daily_puzzle_id, puzzle_model_name, puzzle_id):
        user = request.user

        # 1. Setup and Validation
        try:
            daily_puzzle = get_object_or_404(DailyPuzzle, pk=daily_puzzle_id)

            puzzle_model_name_lower = puzzle_model_name.lower()
            if puzzle_model_name_lower == "wordlepuzzle":
                PuzzleModel = WordlePuzzle
            elif puzzle_model_name_lower == "sudokupuzzle":
                PuzzleModel = SudokuPuzzle
            elif puzzle_model_name_lower == "ernigrampuzzle":
                PuzzleModel = ErnigramPuzzle
            else:
                return JsonResponse({"error": "Unknown puzzle type."}, status=400)

            puzzle_instance = get_object_or_404(PuzzleModel, pk=puzzle_id)
            puzzle_content_type = ContentType.objects.get_for_model(puzzle_instance)

        except Exception:
            return JsonResponse({"error": "Invalid puzzle reference."}, status=400)

        # 2. Retrieve Attempt
        try:
            attempt = PuzzleAttempt.objects.get(
                user=user,
                daily_puzzle=daily_puzzle,
                content_type=puzzle_content_type,
                object_id=puzzle_instance.pk,
            )
            time_taken = attempt.time_spent_ms
        except PuzzleAttempt.DoesNotExist:
            return JsonResponse({"error": "No active attempt found to submit."}, status=404)

        # Retrieve difficulty
        try:
            submission_data = json.loads(request.body)
            difficulty = submission_data.get("difficulty", "EASY").upper()
        except json.JSONDecodeError:
            difficulty = "EASY"

        # 3. TIME LIMIT ENFORCEMENT
        if hasattr(PuzzleModel, "TIME_LIMITS_MS"):
            time_limits = PuzzleModel.TIME_LIMITS_MS
            max_time_ms = time_limits.get(difficulty)

            if max_time_ms is not None and time_taken > max_time_ms:
                max_time_minutes = max_time_ms / 60000
                return JsonResponse(
                    {
                        "error": f"Time limit of {int(max_time_minutes)} minutes for '{difficulty}' difficulty was exceeded."
                    },
                    status=403,
                )

        # 4. SCORING
        try:
            points_awarded, tries = puzzle_instance.validate_and_score(
                attempt.progress_data, difficulty
            )
        except AttributeError:
            return JsonResponse(
                {"error": f"Scoring method missing for {puzzle_model_name}."},
                status=500,
            )
        except Exception as e:
            return JsonResponse({"error": f"Scoring failed: {str(e)}"}, status=400)

        if points_awarded <= 0:
            return JsonResponse(
                {"error": "Puzzle was not successfully solved or achieved zero points."},
                status=400,
            )

        # 5. CREATE SUBMISSION RECORD (WITH puzzle_date)
        submission = Submission.objects.create(
            user=user,
            puzzle=puzzle_instance,
            content_type=puzzle_content_type,
            object_id=puzzle_instance.pk,
            difficulty=difficulty.lower(),
            points_awarded=points_awarded,
            time_taken_ms=time_taken,
            tries=tries,
            puzzle_date=daily_puzzle.date,  # ✅ CRITICAL FIX
        )

        # 6. UPDATE USER STATS
        user.total_points_alltime = F('total_points_alltime') + points_awarded
        user.current_points = F('current_points') + points_awarded
        user.save(update_fields=['total_points_alltime', 'current_points'])
        user.refresh_from_db()

        # 7. UPDATE LEADERBOARDS IN REAL-TIME
        try:
            LeaderboardAggregator.update_all_for_date(daily_puzzle.date)
            print(f"✅ Leaderboards updated for {daily_puzzle.date}")
        except Exception as e:
            print(f"⚠️ Leaderboard update failed: {e}")

        # 8. Clean up the PuzzleAttempt
        attempt.delete()

        return JsonResponse(
            {
                "message": "Puzzle submitted successfully.",
                "points_awarded": points_awarded,
                "submission_id": submission.pk,
            },
            status=201,
        )


# ============================================================================
# VIEW 4: GetHintView - Request Sudoku Hints
# ============================================================================
@method_decorator(csrf_protect, name="dispatch")
@method_decorator(login_required, name="post")
class GetHintView(View):
    def post(self, request, daily_puzzle_id, puzzle_model_name, puzzle_id):
        user = request.user

        # 1. Validation and Data Retrieval
        try:
            data = json.loads(request.body)
            difficulty = data.get("difficulty", "EASY").upper()

            daily_puzzle = get_object_or_404(DailyPuzzle, pk=daily_puzzle_id)

            if puzzle_model_name.lower() == "sudokupuzzle":
                PuzzleModel = SudokuPuzzle
            else:
                return JsonResponse(
                    {"error": "Hint request not supported for this puzzle type."},
                    status=400,
                )

            puzzle_instance = get_object_or_404(PuzzleModel, pk=puzzle_id)
            puzzle_content_type = ContentType.objects.get_for_model(puzzle_instance)

            attempt = PuzzleAttempt.objects.get(
                user=user,
                daily_puzzle=daily_puzzle,
                content_type=puzzle_content_type,
                object_id=puzzle_instance.pk,
            )

        except (SudokuPuzzle.DoesNotExist, PuzzleAttempt.DoesNotExist, json.JSONDecodeError):
            return JsonResponse({"error": "Invalid game state or puzzle reference."}, status=400)

        # 2. Hint Limit Check
        hints_used = attempt.progress_data.get("hints_used", 0)
        max_hints = puzzle_instance.HINT_LIMITS.get(difficulty)

        if max_hints is None:
            return JsonResponse({"error": "Difficulty config missing HINT_LIMITS."}, status=500)

        if hints_used >= max_hints:
            return JsonResponse({"error": f"Maximum of {max_hints} hints exceeded."}, status=403)

        # 3. Find Available Hint (RANDOMIZED)
        solution_string = puzzle_instance.solution_string
        current_grid = attempt.progress_data.get("final_grid", "0" * 81)

        empty_indices = [i for i, char in enumerate(current_grid) if char == "0"]

        if not empty_indices:
            return JsonResponse({"error": "Puzzle appears to be complete."}, status=400)

        hint_index = random.choice(empty_indices)
        hint_value = solution_string[hint_index]

        # 4. Prepare Response
        hints_used_new = hints_used + 1

        return JsonResponse(
            {
                "message": "Hint granted.",
                "hint_index": hint_index,
                "hint_value": hint_value,
                "hints_used_new": hints_used_new,
            },
            status=200,
        )