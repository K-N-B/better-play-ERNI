# gameplay/views.py 

import json
import random
from datetime import datetime
from django.utils import timezone

import pytz
from django.contrib.auth.decorators import login_required
from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from django.db.models import F
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_protect
from games.models import DailyPuzzle, ErnigramPuzzle, SudokuPuzzle, WordlePuzzle
from leaderboards.services import LeaderboardAggregator
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404

from django.views.decorators.csrf import csrf_exempt

from .models import PuzzleAttempt, Submission
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Challenge
from django.db.models import Q
from users.models import User
from .serializers import (
    ChallengeSerializer,
    CreateChallengeSerializer,
)


# Import the streak utility function
from .streak_utils import update_daily_activity_streak
from .scoring_utils import calculate_speed_bonus

User = get_user_model()

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

    def post(self, request, daily_puzzle_date, puzzle_model_name, puzzle_id):
        user = request.user

        try:
            # 1. Parse and validate input data
            data = json.loads(request.body)
            new_progress_data = data.get("progress_data")
            new_time_spent = data.get("time_spent_ms")
            difficulty = data.get("difficulty", "EASY").upper()

            print(f"[SaveProgressView] Received data for user {user.username}")
            print(f"[SaveProgressView] Puzzle: {puzzle_model_name} #{puzzle_id}")
            print(f"[SaveProgressView] Time: {new_time_spent}ms")
            print(f"[SaveProgressView] Difficulty: {difficulty}")

            # Validate required fields
            if new_progress_data is None or new_time_spent is None:
                return JsonResponse(
                    {"error": "Missing progress_data or time_spent_ms."}, status=400
                )

            # Allow both dict (Wordle/ERNIgram) and list (Sudoku grid)
            if not isinstance(new_progress_data, (dict, list)):
                return JsonResponse(
                    {"error": "progress_data must be an object or array."}, status=400
                )

            # 2. Parse date and get DailyPuzzle
            try:
                puzzle_date = datetime.strptime(daily_puzzle_date, '%Y-%m-%d').date()
            except ValueError:
                return JsonResponse({"error": "Invalid date format. Use YYYY-MM-DD."}, status=400)

            daily_puzzle = get_object_or_404(DailyPuzzle, date=puzzle_date)

            # 3. Get the puzzle model
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
            print(f"[SaveProgressView] Found puzzle instance: {puzzle_instance}")

        except json.JSONDecodeError as e:
            print(f"[SaveProgressView] JSON decode error: {e}")
            return JsonResponse({"error": "Invalid JSON."}, status=400)
        except Exception as e:
            print(f"[SaveProgressView] Setup error: {e}")
            import traceback

            traceback.print_exc()
            return JsonResponse({"error": f"Invalid puzzle reference: {str(e)}"}, status=400)


        # 5. GUESS/HINT/MISTAKE LIMIT ENFORCEMENT
        limit_config = None
        current_count = None
        limit_type = None

        if hasattr(PuzzleModel, "GUESS_LIMITS"):
            limit_config = PuzzleModel.GUESS_LIMITS
            if isinstance(new_progress_data, dict):
                current_count = len(new_progress_data.get("guesses", []))
            limit_type = "guesses"
        elif hasattr(PuzzleModel, "HINT_LIMITS"):
            limit_config = PuzzleModel.HINT_LIMITS
            if isinstance(new_progress_data, dict):
                current_count = new_progress_data.get("hints_used", 0)
            limit_type = "hints"
        elif hasattr(PuzzleModel, "MISTAKE_LIMITS"):
            limit_config = PuzzleModel.MISTAKE_LIMITS
            if isinstance(new_progress_data, dict):
                current_count = new_progress_data.get("misses", 0)
            limit_type = "mistakes"

        if limit_config is not None and current_count is not None:
            max_limit = limit_config.get(difficulty)
            if max_limit is not None and current_count > max_limit:
                return JsonResponse(
                    {
                        "error": f"Maximum of {max_limit} {limit_type} for '{difficulty}' difficulty exceeded."
                    },
                    status=403,
                )

        # 6. Get or create the PuzzleAttempt
        try:
            attempt, created = PuzzleAttempt.objects.get_or_start_attempt(
                user=user, daily_puzzle=daily_puzzle, puzzle_instance=puzzle_instance
            )

            if created:
                print(f"[SaveProgressView] Created new attempt for {user.username}")
            else:
                print(f"[SaveProgressView] Found existing attempt for {user.username}")

        except Exception as e:
            print(f"[SaveProgressView] Error getting/creating attempt: {e}")
            import traceback

            traceback.print_exc()
            return JsonResponse({"error": f"Failed to get or create attempt: {str(e)}"}, status=500)

        # 7. Update the attempt's state
        try:
            # ✅ Handle different progress_data formats
            if isinstance(new_progress_data, list):
                # For Sudoku grid - wrap it and ensure it's properly serializable
                attempt.progress_data = {"grid": new_progress_data}
            elif isinstance(new_progress_data, dict):
                # For dict data (Wordle/ERNIgram or Sudoku with validation fields)
                # Merge with existing data to preserve fields
                attempt.progress_data.update(new_progress_data)
            else:
                return JsonResponse({"error": "Invalid progress_data format."}, status=400)

            attempt.time_spent_ms = new_time_spent
            attempt.save()

            print(f"[SaveProgressView] ✅ Successfully saved progress for {user.username}")

            return JsonResponse(
                {
                    "message": "Progress saved successfully.",
                    "last_saved": attempt.last_saved.isoformat(),
                },
                status=200,
            )

        except Exception as e:
            print(f"[SaveProgressView] Error saving attempt: {e}")
            import traceback

            traceback.print_exc()
            return JsonResponse({"error": f"Failed to save progress: {str(e)}"}, status=500)


# ============================================================================
# VIEW 2: GetProgressView - Retrieve Saved Game State
# ============================================================================
@method_decorator(csrf_protect, name="dispatch")
@method_decorator(login_required, name="get")
class GetProgressView(View):
    """
    Handles GET requests to retrieve a user's current PuzzleAttempt state.
    """

    def get(self, request, daily_puzzle_date, puzzle_model_name, puzzle_id):
        user = request.user

        try:
            # Parse date string to date object
            try:
                puzzle_date = datetime.strptime(daily_puzzle_date, '%Y-%m-%d').date()
            except ValueError:
                return JsonResponse({"error": "Invalid date format. Use YYYY-MM-DD."}, status=400)

            daily_puzzle = get_object_or_404(DailyPuzzle, date=puzzle_date)

            # Dynamically determine the PuzzleModel
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

        except Exception as e:
            print(f"[GetProgressView] Error: {e}")
            import traceback

            traceback.print_exc()
            return JsonResponse({"error": f"Invalid puzzle reference: {str(e)}"}, status=400)

        # Retrieve the Attempt
        try:
            attempt = PuzzleAttempt.objects.get(
                user=user,
                daily_puzzle=daily_puzzle,
                content_type=puzzle_content_type,
                object_id=puzzle_instance.pk,
            )

            print(f"[GetProgressView] ✅ Found attempt for {user.username}, puzzle {puzzle_id}")

            return JsonResponse(
                {
                    "exists": True,
                    "progress_data": attempt.progress_data,
                    "time_spent_ms": attempt.time_spent_ms,
                    "last_saved": attempt.last_saved.isoformat(),
                    "puzzle_type": puzzle_model_name_lower.replace('puzzle', ''),
                },
                status=200,
            )

        except PuzzleAttempt.DoesNotExist:
            print(f"[GetProgressView] ℹ️ No attempt found for {user.username}, puzzle {puzzle_id}")
            return JsonResponse(
                {
                    "exists": False,
                    "message": "No active attempt found. Start a new game.",
                },
                status=404,
            )


# ============================================================================
# VIEW 3: CheckSubmissionView - Check if Already Submitted
# ============================================================================
@method_decorator(csrf_protect, name='dispatch')
@method_decorator(login_required, name='get')
class CheckSubmissionView(View):
    """
    GET /api/gameplay/check-submission/{daily_puzzle_date}/{puzzle_model_name}/{puzzle_id}/
    Check if user has already submitted this puzzle
    """

    def get(self, request, daily_puzzle_date, puzzle_model_name, puzzle_id):
        user = request.user

        try:
            # Determine puzzle model
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

            # Check for existing submission
            submission = Submission.objects.filter(
                user=user, content_type=puzzle_content_type, object_id=puzzle_instance.pk
            ).first()

            if submission:
                print(
                    f"[CheckSubmissionView] ✅ Found submission for {user.username}, puzzle {puzzle_id}"
                )
                return JsonResponse(
                    {
                        'hasSubmitted': True,
                        'score': submission.points_awarded,
                        'submittedAt': submission.created_at.isoformat(),
                        'difficulty': submission.difficulty,  # ✅ FIX: Include difficulty
                        'submissionId': submission.id,  # ✅ BONUS: Also include ID
                    }
                )

            print(f"[CheckSubmissionView] ℹ️ No submission for {user.username}, puzzle {puzzle_id}")
            return JsonResponse({'hasSubmitted': False})

        except Exception as e:
            print(f"[CheckSubmissionView] Error: {e}")
            import traceback

            traceback.print_exc()
            return JsonResponse({'error': str(e)}, status=500)


@method_decorator(csrf_protect, name='dispatch')
@method_decorator(login_required, name='get')
class CheckUserSubmissionView(View):
    """
    GET /api/gameplay/check-user-submission/{daily_puzzle_date}/{puzzle_model_name}/{puzzle_id}/?user_id=<int>
    Check if a SPECIFIC user has submitted this puzzle (for challenge modal)
    """

    def get(self, request, daily_puzzle_date, puzzle_model_name, puzzle_id):
        # Get the target user ID from query params
        target_user_id = request.GET.get('user_id')
        
        if not target_user_id:
            return JsonResponse({'error': 'user_id query parameter required'}, status=400)
        
        try:
            target_user = get_object_or_404(User, pk=int(target_user_id))
        except (ValueError, User.DoesNotExist):
            return JsonResponse({'error': 'Invalid user_id'}, status=404)

        try:
            # Determine puzzle model
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

            # Check for submissions by the TARGET user, not the requester
            submission = Submission.objects.filter(
                user=target_user,
                content_type=puzzle_content_type,
                object_id=puzzle_instance.pk
            ).first()

            if submission:
                print(
                    f"[CheckUserSubmission] ✅ User {target_user.username} (ID: {target_user_id}) HAS submitted puzzle {puzzle_id}"
                )
                return JsonResponse(
                    {
                        'hasSubmitted': True,
                        'userId': target_user.id,
                        'username': target_user.username,
                        'score': submission.points_awarded,
                        'submittedAt': submission.created_at.isoformat(),
                        'difficulty': submission.difficulty,
                    }
                )

            print(
                f"[CheckUserSubmission] ℹ️ User {target_user.username} (ID: {target_user_id}) has NOT submitted puzzle {puzzle_id}"
            )
            return JsonResponse({'hasSubmitted': False, 'userId': target_user.id})

        except Exception as e:
            print(f"[CheckUserSubmission] Error: {e}")
            import traceback
            traceback.print_exc()
            return JsonResponse({'error': str(e)}, status=500)

# ============================================================================
# VIEW 4: SubmitPuzzleView - Submit Completed Puzzle
# ============================================================================
@method_decorator(csrf_protect, name="dispatch")
@method_decorator(login_required, name="post")
class SubmitPuzzleView(View):
    @transaction.atomic
    def post(self, request, daily_puzzle_date, puzzle_model_name, puzzle_id):
        user = request.user

        # 1. Setup and Validation
        try:
            try:
                puzzle_date = datetime.strptime(daily_puzzle_date, '%Y-%m-%d').date()
            except ValueError:
                return JsonResponse({"error": "Invalid date format. Use YYYY-MM-DD."}, status=400)

            daily_puzzle = get_object_or_404(DailyPuzzle, date=puzzle_date)

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

        except Exception as e:
            print(f"[SubmitPuzzleView] Error: {e}")
            import traceback
            traceback.print_exc()
            return JsonResponse({"error": "Invalid puzzle reference."}, status=400)

        # 2. Check for duplicate submission
        existing_submission = Submission.objects.filter(
            user=user, content_type=puzzle_content_type, object_id=puzzle_instance.pk
        ).first()

        if existing_submission:
            return JsonResponse(
                {
                    "error": "You have already submitted this puzzle.",
                    "points_awarded": existing_submission.points_awarded,
                    "submission_id": existing_submission.pk,
                },
                status=400,
            )

        # 3. Retrieve Attempt
        try:
            attempt = PuzzleAttempt.objects.select_for_update().get(
                user=user,
                daily_puzzle=daily_puzzle,
                content_type=puzzle_content_type,
                object_id=puzzle_instance.pk,
            )

      

            attempt.refresh_from_db()

            
            time_taken = attempt.time_spent_ms
            progress_data = attempt.progress_data

            print(f"Debugging progress_data: {progress_data}")
        except PuzzleAttempt.DoesNotExist:
            return JsonResponse({"error": "No active attempt found to submit."}, status=404)

        # Retrieve difficulty
        try:
            submission_data = json.loads(request.body)
            difficulty = submission_data.get("difficulty", "EASY").upper()
            status_from_client = submission_data.get("status", "").upper() 
        except json.JSONDecodeError:
            difficulty = "EASY"
            status_from_client = ""

        # 4. Initialize scoring variables
        points_awarded = 0
        tries = 0
        hints_used = 0
        
        # 5. CHECK GAME STATUS - ✅ FIXED: Accept both SOLVED and LOST
        # 5. CHECK GAME STATUS (Prioritize the 'Finished' state)
        db_status = progress_data.get("status", "ACTIVE").upper()
        
        # Logic: If the DB says it's done, it's done (ignore stale client data).
        # If DB is active, but Client says it's done, trust the Client.
        if db_status in ["SOLVED", "LOST"]:
            status = db_status
            print(f"[SubmitPuzzleView] Using DB status: {status}")
        elif status_from_client in ["SOLVED", "LOST"]:
            status = status_from_client
            # UPDATE: Ensure validation logic uses this new status if needed
            progress_data['status'] = status 
            print(f"[SubmitPuzzleView] Using Client status: {status}")
        else:
            status = "ACTIVE"
            print("[SubmitPuzzleView] Status is ACTIVE in both DB and Client.")
        
        # ✅ Check if game is still active (reject if not complete)

       


        if status == "ACTIVE":
            print("[SubmitPuzzleView] ❌ Submission rejected. Game is still in 'ACTIVE' state.")
            return JsonResponse(
                {"error": "Puzzle is not yet complete. Save progress instead."},
                status=400,
            )
        
        # ✅ NEW: Check if game was lost
        is_lost = status == "LOST"
        
        if is_lost:
            print("[SubmitPuzzleView] Game was lost - creating submission with 0 points")
            points_awarded = 0
            tries = progress_data.get("tries", 1)
            hints_used = progress_data.get("hints_used", 0)
        else:
            # Game was won - score it normally
            validation_data = attempt.progress_data

            # Perform Scoring and Unpacking
            try:
                if puzzle_model_name_lower == "sudokupuzzle":
                    points_awarded, hints_used = puzzle_instance.validate_and_score(validation_data, difficulty)
                    tries = 1
                else:
                    points_awarded, tries = puzzle_instance.validate_and_score(validation_data, difficulty)
                    hints_used = attempt.progress_data.get("hints_used", 0)

                print(f"[SubmitPuzzleView] Validation result: {points_awarded} points, {tries} tries, {hints_used} hints used")
                max_time_ms = PuzzleModel.TIME_LIMITS_MS.get(difficulty) # Retrieve limit again
                if max_time_ms is not None:
                    # Calculate and apply the bonus
                    speed_bonus = calculate_speed_bonus(time_taken, max_time_ms)
                    points_awarded += speed_bonus
                    print(f"[SubmitPuzzleView] Speed Bonus Applied: +{speed_bonus} points. Total: {points_awarded}")
                    # --- 🛑 NEW SPEED BONUS CALCULATION END 🛑 ---

            except AttributeError:
                return JsonResponse(
                    {"error": f"Scoring method missing for {puzzle_model_name}."},
                    status=500,
                )
            except Exception as e:
                print(f"[SubmitPuzzleView] Scoring error: {e}")
                import traceback
                traceback.print_exc()
                return JsonResponse({"error": f"Scoring failed: {str(e)}"}, status=400)

        # 7. CREATE SUBMISSION RECORD (works for both won and lost games)
        submission = Submission.objects.create(
            user=user,
            puzzle=puzzle_instance,
            content_type=puzzle_content_type,
            object_id=puzzle_instance.pk,
            difficulty=difficulty.lower(),
            points_awarded=points_awarded,
            time_taken_ms=time_taken,
            tries=tries,
            hints_used=hints_used,
            puzzle_date=daily_puzzle.date,
        )
        
        # 7.0 UPDATE USER STREAK
        streak_was_updated = update_daily_activity_streak(user)

        # 7.1 UPDATE USER STATS (only if points > 0)
        if points_awarded > 0:
            user.total_points_alltime = F('total_points_alltime') + points_awarded
            user.current_points = F('current_points') + points_awarded
            user.save(update_fields=['total_points_alltime', 'current_points'])
            user.refresh_from_db()
            
            if user.department:
                from users.models import Department
                Department.objects.filter(id=user.department.id).update(
                    total_points_alltime=F('total_points_alltime') + points_awarded
                )
                print(f"✅ Updated {user.department.name} all-time points: +{points_awarded}")

        # 9. UPDATE LEADERBOARDS (only if points > 0)
        if points_awarded > 0:
            try:
                LeaderboardAggregator.update_all_for_date(daily_puzzle.date)
                print(f"✅ Leaderboards updated for {daily_puzzle.date}")
            except Exception as e:
                print(f"⚠️ Leaderboard update failed: {e}")

        # 10. Clean up the PuzzleAttempt
        attempt.delete()

        # 10. Refresh user to get latest streak info
        user.refresh_from_db()
        
        print(f"[SubmitPuzzleView] ✅ Submitted successfully: {points_awarded} points for {user.username}")

        response_message = (
            "Puzzle submitted successfully."
            if points_awarded > 0
            else "Puzzle completed (no points awarded)."
        )

        return JsonResponse(
            {
                "message": response_message,
                "points_awarded": points_awarded,
                "submission_id": submission.pk,
                "current_streak": user.current_streak_count,
                "max_streak": user.max_streak_count,
                "last_active": user.last_active.isoformat() if user.last_active else None,
                "streak_updated_today": streak_was_updated,
            },
            status=201,
        )


# ============================================================================
# VIEW 5: GetHintView - Request Sudoku Hints
# ============================================================================


# @method_decorator(csrf_protect, name="dispatch")
# @method_decorator(login_required, name="post")
@method_decorator(csrf_exempt, name='dispatch')
class GetHintView(View):
    def post(self, request, daily_puzzle_date, puzzle_model_name, puzzle_id):
        user = request.user

        # 1. Initial Validation and Data Retrieval (outside the lock)
        try:
            data = json.loads(request.body)
            difficulty = data.get("difficulty", "EASY").upper()

            try:
                puzzle_date = datetime.strptime(daily_puzzle_date, '%Y-%m-%d').date()
            except ValueError:
                return JsonResponse({"error": "Invalid date format."}, status=400)

            daily_puzzle = get_object_or_404(DailyPuzzle, date=puzzle_date)

            if puzzle_model_name.lower() == "sudokupuzzle":
                PuzzleModel = SudokuPuzzle
            else:
                return JsonResponse(
                    {"error": "Hint request not supported for this puzzle type."},
                    status=400,
                )

            puzzle_instance = get_object_or_404(PuzzleModel, pk=puzzle_id)
            puzzle_content_type = ContentType.objects.get_for_model(puzzle_instance)

        except (ValueError, json.JSONDecodeError) as e:
            return JsonResponse({"error": f"Invalid request data: {e}"}, status=400)
        except DailyPuzzle.DoesNotExist:
            return JsonResponse({"error": "Daily puzzle not found."}, status=404)
        except PuzzleModel.DoesNotExist:
            return JsonResponse({"error": "Puzzle not found."}, status=404)
        except Exception as e:
            print(f"[GetHintView] Initial Error: {e}")
            return JsonResponse({"error": "An internal error occurred during setup."}, status=500)

        # 2. ATOMIC TRANSACTION START (CRITICAL FIX FOR RACE CONDITION)
        try:
            with transaction.atomic():
                # Lock the attempt row for the duration of this transaction
                attempt = PuzzleAttempt.objects.select_for_update().get(
                    user=user,
                    daily_puzzle=daily_puzzle,
                    content_type=puzzle_content_type,
                    object_id=puzzle_instance.pk,
                )


                # Hint Limit Check (inside the lock)
                hints_used = attempt.progress_data.get("hints_used", 0)
                max_hints = puzzle_instance.HINT_LIMITS.get(difficulty)

                if max_hints is None:
                    return JsonResponse({"error": "Difficulty config missing HINT_LIMITS."}, status=500)

                if hints_used >= max_hints:
                    return JsonResponse({"error": f"Maximum of {max_hints} hints exceeded."}, status=403)

                # Find Available Hint (RANDOMIZED)
                solution_string = puzzle_instance.solution_string

                progress_data = attempt.progress_data
                if "grid" in progress_data:
                    grid = progress_data["grid"]
                    # Simplified conversion for the current grid state
                    current_grid = "".join(str(cell.get("value", 0) or 0) for row in grid for cell in row)
                else:
                    current_grid = progress_data.get("final_grid", "0" * 81)

                empty_indices = [i for i, char in enumerate(current_grid) if char == "0"]

                if not empty_indices:
                    return JsonResponse({"error": "Puzzle appears to be complete."}, status=400)

                hint_index = random.choice(empty_indices)
                hint_value = solution_string[hint_index]

                # Record Hint Usage (Update the locked object directly)
                hints_used_new = hints_used + 1
                attempt.progress_data["hints_used"] = hints_used_new
                attempt.save(update_fields=['progress_data']) # Explicitly save the updated field

                print(
                    f"[GetHintView] ✅ Hint granted and recorded to {user.username}. New count: {hints_used_new}"
                )

                # Prepare Response
                return JsonResponse(
                    {
                        "message": "Hint granted.",
                        "hint_index": hint_index,
                        "hint_value": hint_value,
                        "hints_used_new": hints_used_new,
                    },
                    status=200,
                )

        except PuzzleAttempt.DoesNotExist:
            return JsonResponse({"error": "No attempt found for this puzzle/user."}, status=404)
        except Exception as e:
            print(f"[GetHintView] Transaction Error: {e}")
            return JsonResponse({"error": "Failed to process hint request due to internal error."}, status=500)


# ============================================================================
# VIEW 6: GetTodaySubmissionsView - Retrieve Today's Submissions
# ============================================================================
@method_decorator(csrf_protect, name='dispatch')
@method_decorator(login_required, name='get')
class GetTodaySubmissionsView(View):
    """
    GET /api/gameplay/submissions/today/
    Returns all submissions by the current user for today's date (in Asia/Manila time)
    """

    def get(self, request):
        user = request.user

        try:
            # Get today's date in Philippine Time
            pht_tz = pytz.timezone('Asia/Manila')
            now_pht = datetime.now(pht_tz)
            today_pht = now_pht.date()

            # Create timezone-aware datetime range for today
            start_of_day_pht = pht_tz.localize(datetime.combine(today_pht, datetime.min.time()))
            end_of_day_pht = pht_tz.localize(datetime.combine(today_pht, datetime.max.time()))

            print(f"[GetTodaySubmissions] Checking submissions for {user.username}")
            print(f"[GetTodaySubmissions] Date range: {start_of_day_pht} to {end_of_day_pht}")

            # Filter using datetime range instead of date comparison
            submissions = (
                Submission.objects.filter(
                    user=user, created_at__gte=start_of_day_pht, created_at__lte=end_of_day_pht
                )
                .select_related('content_type')
                .order_by('-created_at')
            )

            print(f"[GetTodaySubmissions] Found {submissions.count()} submissions")

            # Serialize the data
            submissions_data = []
            for sub in submissions:
                submission_dict = {
                    'id': sub.id,
                    'puzzle_type': sub.content_type.model,
                    'puzzle_id': sub.object_id,
                    'points_awarded': sub.points_awarded,
                    'time_taken_ms': sub.time_taken_ms,
                    'tries': sub.tries,
                    'difficulty': sub.difficulty,
                    'created_at': sub.created_at.isoformat(),
                }
                submissions_data.append(submission_dict)

            print(f"[GetTodaySubmissions] ✅ Returning {len(submissions_data)} submissions")
            return JsonResponse(submissions_data, safe=False)

        except Exception as e:
            print(f"[GetTodaySubmissions] Error: {e}")
            import traceback

            traceback.print_exc()
            return JsonResponse({'error': str(e)}, status=500)


@method_decorator(csrf_protect, name='dispatch')
@method_decorator(login_required, name='get')
class GetTodayCompletedPuzzlesView(View):
    """
    GET /api/gameplay/completed/today/
    Returns all completed puzzles (both submissions and lost attempts) for today
    """

    def get(self, request):
        user = request.user

        try:
            # Get today's date in Philippine Time
            pht_tz = pytz.timezone('Asia/Manila')
            now_pht = datetime.now(pht_tz)
            today_pht = now_pht.date()

            # Create timezone-aware datetime range for today
            start_of_day_pht = pht_tz.localize(datetime.combine(today_pht, datetime.min.time()))
            end_of_day_pht = pht_tz.localize(datetime.combine(today_pht, datetime.max.time()))

            print(f"[GetTodayCompleted] Checking for {user.username}")

            # Get all submissions (won games)
            submissions = Submission.objects.filter(
                user=user, created_at__gte=start_of_day_pht, created_at__lte=end_of_day_pht
            ).values_list('content_type__model', flat=True)

            # Get all attempts for today
            daily_puzzle = DailyPuzzle.objects.filter(date=today_pht).first()
            if not daily_puzzle:
                return JsonResponse({'completed': [], 'date': today_pht.isoformat()})

            lost_attempts = PuzzleAttempt.objects.filter(user=user, daily_puzzle=daily_puzzle)

            completed_games = set(submissions)

            # Check each attempt to see if it's a completed (lost) game
            for attempt in lost_attempts:
                progress = attempt.progress_data

                # Check if game is over
                is_game_over = progress.get('isGameOver', False)

                # Also check status field
                if not is_game_over and 'status' in progress:
                    is_game_over = progress.get('status') in ['LOST', 'SOLVED']

                if is_game_over:
                    # Get the puzzle type from content_type
                    puzzle_type = attempt.content_type.model
                    completed_games.add(puzzle_type)

            # Return list of completed puzzle types (normalized)
            completed = []
            if 'wordlepuzzle' in completed_games:
                completed.append('wordle')
            if 'sudokupuzzle' in completed_games:
                completed.append('sudoku')
            if 'ernigrampuzzle' in completed_games:
                completed.append('ernigram')

            print(f"[GetTodayCompleted] ✅ Completed games: {completed}")

            return JsonResponse({'completed': completed, 'date': today_pht.isoformat()})

        except Exception as e:
            print(f"[GetTodayCompleted] Error: {e}")
            import traceback

            traceback.print_exc()
            return JsonResponse({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_streak_data(request):
    user = request.user

    data = {
        'current_streak': user.current_streak_count,
        'max_streak': user.max_streak_count,
        'last_active_timestamp': user.last_active,  # Frontend can use this for display
        'display_message': f"You are currently on a {user.current_streak_count}-day streak!",
    }

    return Response(data)


@method_decorator(csrf_protect, name='dispatch')
@method_decorator(login_required, name='get')
class SearchUsersView(View):
    """
    GET /api/challenges/search-users/?q=<query>
    Search for users to challenge by username or email
    """

    def get(self, request):
        query = request.GET.get('q', '').strip()

        if len(query) < 2:
            return JsonResponse(
                {'error': 'Search query must be at least 2 characters.'}, status=400
            )

        try:
            # Search by username or email (case-insensitive)
            users = (
                User.objects.filter(Q(username__icontains=query) | Q(email__icontains=query))
                .exclude(id=request.user.id)  # Exclude current user
                .values('id', 'username', 'email')[:10]
            )  # Limit to 10 results

            users_list = list(users)
            print(f"[SearchUsers] Found {len(users_list)} users for query '{query}'")

            return JsonResponse(users_list, safe=False)

        except Exception as e:
            print(f"[SearchUsers] Error: {e}")
            import traceback

            traceback.print_exc()
            return JsonResponse({'error': str(e)}, status=500)


@method_decorator(csrf_protect, name='dispatch')
@method_decorator(login_required, name='get')
class PendingChallengesView(View):
    """
    GET /api/challenges/pending/
    Get all pending challenges where the current user is EITHER the recipient OR the challenger
    This allows users to see:
    - Challenges they need to complete (as recipient)
    - Challenges they're waiting on (as challenger)
    """

    def get(self, request):
        user = request.user

        try:
            # Get challenges where user is EITHER recipient OR challenger, and status is PENDING
            challenges = (
                Challenge.objects.filter(
                    Q(recipient=user) | Q(challenger=user),  # ✅ CHANGED: Include both
                    status=Challenge.Status.PENDING
                )
                .select_related(
                    'challenger',
                    'recipient',
                    'challenger_submission',
                    'challenger_submission__content_type',
                )
                .order_by('-created_at')
            )

            serializer = ChallengeSerializer(challenges, many=True)

            print(f"[PendingChallenges] Found {challenges.count()} pending for {user.username}")
            print(f"[PendingChallenges] - As recipient: {challenges.filter(recipient=user).count()}")
            print(f"[PendingChallenges] - As challenger: {challenges.filter(challenger=user).count()}")

            return JsonResponse(serializer.data, safe=False)

        except Exception as e:
            print(f"[PendingChallenges] Error: {e}")
            import traceback

            traceback.print_exc()
            return JsonResponse({'error': str(e)}, status=500)


@method_decorator(csrf_protect, name='dispatch')
@method_decorator(login_required, name='get')
class CompletedChallengesView(View):
    """
    GET /api/challenges/completed/
    Get all completed challenges involving the current user
    """

    def get(self, request):
        user = request.user

        try:
            # Get completed challenges where user is either challenger or recipient
            challenges = (
                Challenge.objects.filter(
                    Q(challenger=user) | Q(recipient=user), status=Challenge.Status.COMPLETED
                )
                .select_related(
                    'challenger',
                    'recipient',
                    'challenger_submission',
                    'recipient_submission',
                    'winner',
                    'challenger_submission__content_type',
                )
                .order_by('-created_at')
            )

            serializer = ChallengeSerializer(challenges, many=True)

            print(f"[CompletedChallenges] Found {challenges.count()} completed for {user.username}")

            return JsonResponse(serializer.data, safe=False)

        except Exception as e:
            print(f"[CompletedChallenges] Error: {e}")
            import traceback

            traceback.print_exc()
            return JsonResponse({'error': str(e)}, status=500)


@method_decorator(login_required, name='post')
class SendChallengeView(View):
    """
    POST /api/challenges/send/
    Create a new challenge
    Body: {"recipient_id": <int>, "submission_id": <int>}
    """

    @method_decorator(csrf_exempt)
    @transaction.atomic
    def post(self, request):
        user = request.user

        try:
            data = json.loads(request.body)

            print("[SendChallenge] ========== START ==========")
            print(f"[SendChallenge] Received data: {data}")
            print(f"[SendChallenge] User: {user.username} (ID: {user.id})")
            print(f"[SendChallenge] User authenticated: {user.is_authenticated}")

            # ✅ Simplified: Pass the Django request directly
            serializer = CreateChallengeSerializer(data=data, context={'request': request})

            print("[SendChallenge] About to validate...")
            is_valid = serializer.is_valid()
            print(f"[SendChallenge] Validation result: {is_valid}")
            print(f"[SendChallenge] Validation errors: {serializer.errors}")

            if not is_valid:
                print("[SendChallenge] ❌ Validation FAILED")
                return JsonResponse(
                    {'error': 'Validation failed', 'errors': serializer.errors}, status=400
                )

            print("[SendChallenge] ✅ Validation PASSED, continuing...")

            recipient_id = serializer.validated_data['recipient_id']
            submission_id = serializer.validated_data['submission_id']

            # Get objects
            recipient = User.objects.get(pk=recipient_id)
            submission = Submission.objects.get(pk=submission_id)

            # ✅ NEW: Check if this submission has already been used for a challenge
            existing_challenge = Challenge.objects.filter(
                challenger_submission=submission
            ).first()
            
            if existing_challenge:
                return JsonResponse(
                    {
                        'error': 'You have already created a challenge with this submission. Please complete a new puzzle to challenge someone else.'
                    },
                    status=400,
                )

            # ✅ Check if recipient has already submitted this puzzle
            recipient_submission = Submission.objects.filter(
                user=recipient, 
                content_type=submission.content_type, 
                object_id=submission.object_id
            ).first()

            if recipient_submission:
                return JsonResponse(
                    {
                        'error': f'{recipient.username} has already completed this puzzle. You cannot challenge them on it.'
                    },
                    status=400,
                )

            # Create the challenge
            challenge = Challenge.objects.create(
                challenger=user,
                recipient=recipient,
                challenger_submission=submission,
                status=Challenge.Status.PENDING,
            )

            # Increment challenges_made_count
            user.challenges_made_count = F('challenges_made_count') + 1
            user.save(update_fields=['challenges_made_count'])
            user.refresh_from_db()

            # Serialize response
            response_serializer = ChallengeSerializer(challenge)

            print(f"[SendChallenge] ✅ Challenge created: {user.username} -> {recipient.username}")

            return JsonResponse(response_serializer.data, status=201)

        except User.DoesNotExist:
            return JsonResponse({'error': 'Recipient not found.'}, status=404)
        except Submission.DoesNotExist:
            return JsonResponse({'error': 'Submission not found.'}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON.'}, status=400)
        except Exception as e:
            print(f"[SendChallenge] Error: {e}")
            import traceback
            traceback.print_exc()
            return JsonResponse({'error': str(e)}, status=500)


@method_decorator(login_required, name='post')
class CompleteChallengeView(View):
    """
    POST /api/challenges/<challenge_id>/complete/
    Complete a challenge as the recipient
    Body: {"submission_id": <int>}
    """

    @method_decorator(csrf_exempt)
    @transaction.atomic
    def post(self, request, challenge_id):
        user = request.user

        try:
            data = json.loads(request.body)

            print("\n[CompleteChallenge] ========== START ==========")
            print(f"[CompleteChallenge] Challenge ID: {challenge_id}")
            print(f"[CompleteChallenge] User: {user.username} (ID: {user.id})")
            print(f"[CompleteChallenge] Data: {data}")

            # Get the challenge with SELECT FOR UPDATE to lock the row
            challenge = (
                Challenge.objects.select_for_update()
                .select_related('challenger', 'recipient', 'challenger_submission')
                .get(pk=challenge_id)
            )

            print("[CompleteChallenge] Found challenge:")
            print(f"  - Status BEFORE: '{challenge.status}'")
            print(f"  - Challenger: {challenge.challenger.username}")
            print(f"  - Recipient: {challenge.recipient.username}")

            if challenge.is_expired():
                print("[CompleteChallenge] ❌ Challenge has expired")
                # Update status to expired
                challenge.status = Challenge.Status.EXPIRED
                challenge.save(update_fields=['status'])
                
                return JsonResponse({
                    'error': 'This challenge has expired. Challenges must be completed on the same day they were sent.'
                }, status=400)

            # Verify user is the recipient
            if challenge.recipient != user:
                print("[CompleteChallenge] ❌ User is not recipient")
                return JsonResponse(
                    {'error': 'You are not the recipient of this challenge.'}, status=403
                )

            # Verify challenge is still pending
            if challenge.status != Challenge.Status.PENDING:
                print(f"[CompleteChallenge] ❌ Challenge not pending (status: {challenge.status})")
                return JsonResponse({'error': 'This challenge is no longer pending.'}, status=400)

            # Validate submission_id
            submission_id = data.get('submission_id')
            if not submission_id:
                print("[CompleteChallenge] ❌ Missing submission_id")
                return JsonResponse({'error': 'submission_id is required'}, status=400)

            # Get the submission
            try:
                submission = Submission.objects.get(pk=submission_id)
            except Submission.DoesNotExist:
                print(f"[CompleteChallenge] ❌ Submission {submission_id} not found")
                return JsonResponse({'error': 'Submission not found.'}, status=404)

            print(f"[CompleteChallenge] Found submission #{submission_id}")
            print(f"  - User: {submission.user.username}")
            print(f"  - Points: {submission.points_awarded}")

            # Verify submission belongs to recipient
            if submission.user != user:
                print("[CompleteChallenge] ❌ Submission doesn't belong to user")
                return JsonResponse({'error': 'Submission must belong to you.'}, status=400)

            # Verify the submission is for the same puzzle
            if (
                submission.content_type != challenge.challenger_submission.content_type
                or submission.object_id != challenge.challenger_submission.object_id
            ):
                print("[CompleteChallenge] ❌ Submission puzzle mismatch")
                return JsonResponse(
                    {'error': 'Submission must be for the same puzzle as the challenge.'},
                    status=400,
                )

            # ✅ UPDATE CHALLENGE - This is the critical part
            print("[CompleteChallenge] Updating challenge...")

            challenge.recipient_submission = submission
            challenge.status = Challenge.Status.COMPLETED
            challenge.completed_at = timezone.now() 

            # Determine winner based on points
            challenger_points = challenge.challenger_submission.points_awarded
            recipient_points = submission.points_awarded

            print("[CompleteChallenge] Comparing scores:")
            print(f"  - Challenger: {challenger_points} pts")
            print(f"  - Recipient: {recipient_points} pts")

            if recipient_points > challenger_points:
                challenge.winner = challenge.recipient
                print("[CompleteChallenge] → Recipient won!")
            elif recipient_points < challenger_points:
                challenge.winner = challenge.challenger
                print("[CompleteChallenge] → Challenger won!")
            else:
                challenge.winner = None  # Tie
                print("[CompleteChallenge] → Tie!")

            # ✅ CRITICAL: SAVE THE CHALLENGE
            print("[CompleteChallenge] About to save challenge...")
            print(f"[CompleteChallenge] Status field value: '{challenge.status}'")
            print(
                f"[CompleteChallenge] Status is COMPLETED: {challenge.status == Challenge.Status.COMPLETED}"
            )

            challenge.save()

            print("[CompleteChallenge] ✅ Challenge.save() called successfully")

            # ✅ VERIFY IT SAVED - Refresh from database
            challenge.refresh_from_db()
            print(f"[CompleteChallenge] Status AFTER save: '{challenge.status}'")

            if challenge.status != Challenge.Status.COMPLETED:
                print("[CompleteChallenge] ❌❌❌ CRITICAL: Status did NOT save!")
                print(f"[CompleteChallenge] Expected: 'COMPLETED', Got: '{challenge.status}'")
                return JsonResponse(
                    {'error': 'Database update failed - status not changed'}, status=500
                )

            # Double-check in raw SQL
            from django.db import connection

            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT status FROM gameplay_challenge WHERE id = %s", [challenge.id]
                )
                raw_status = cursor.fetchone()[0]
                print(f"[CompleteChallenge] Raw SQL status: '{raw_status}'")

                if raw_status != 'COMPLETED':
                    print(
                        f"[CompleteChallenge] ❌❌❌ CRITICAL: SQL shows status is still '{raw_status}'"
                    )
                    return JsonResponse(
                        {'error': 'Database update failed at SQL level'}, status=500
                    )

            print("[CompleteChallenge] ✅✅✅ VERIFIED: Status is COMPLETED in database")
            print("[CompleteChallenge] ========== END ==========\n")

            # Serialize response
            response_serializer = ChallengeSerializer(challenge)

            return JsonResponse(response_serializer.data, status=200)

        except Challenge.DoesNotExist:
            print(f"[CompleteChallenge] ❌ Challenge {challenge_id} not found")
            return JsonResponse({'error': 'Challenge not found.'}, status=404)
        except json.JSONDecodeError:
            print("[CompleteChallenge] ❌ Invalid JSON")
            return JsonResponse({'error': 'Invalid JSON.'}, status=400)
        except Exception as e:
            print(f"[CompleteChallenge] ❌ Unexpected error: {e}")
            import traceback

            traceback.print_exc()
            return JsonResponse({'error': str(e)}, status=500)

@method_decorator(csrf_protect, name='dispatch')
@method_decorator(login_required, name='get')
class ListAllUsersView(View):
    """
    GET /api/challenges/list-users/
    Get all users except the current user (for challenge modal)
    """

    def get(self, request):
        try:
            # Get all users except the current user, ordered alphabetically
            users = (
                User.objects.exclude(id=request.user.id)
                .values('id', 'username', 'email')
                .order_by('username')
            )

            users_list = list(users)
            print(f"[ListAllUsers] Returning {len(users_list)} users")

            return JsonResponse(users_list, safe=False)

        except Exception as e:
            print(f"[ListAllUsers] Error: {e}")
            import traceback
            traceback.print_exc()
            return JsonResponse({'error': str(e)}, status=500)