# gameplay/views.py - COMPLETE VERSION WITH ALL VIEWS

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
from datetime import datetime
import pytz

from .models import PuzzleAttempt, Submission
from games.models import DailyPuzzle, WordlePuzzle, SudokuPuzzle, ErnigramPuzzle
from leaderboards.services import LeaderboardAggregator
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

# Import the streak utility function
from .streak_utils import update_daily_activity_streak

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
                return JsonResponse({"error": "Missing progress_data or time_spent_ms."}, status=400)
            
            # Allow both dict (Wordle/ERNIgram) and list (Sudoku grid)
            if not isinstance(new_progress_data, (dict, list)):
                return JsonResponse({"error": "progress_data must be an object or array."}, status=400)

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

        # 4. TIME LIMIT ENFORCEMENT
        if hasattr(PuzzleModel, "TIME_LIMITS_MS"):
            time_limits = PuzzleModel.TIME_LIMITS_MS
            max_time_ms = time_limits.get(difficulty)

            if max_time_ms is not None and new_time_spent > max_time_ms:
                max_time_minutes = max_time_ms / 60000
                return JsonResponse(
                    {"error": f"Time limit of {int(max_time_minutes)} minutes for '{difficulty}' difficulty exceeded."},
                    status=403,
                )

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
                    {"error": f"Maximum of {max_limit} {limit_type} for '{difficulty}' difficulty exceeded."},
                    status=403,
                )

        # 6. Get or create the PuzzleAttempt
        try:
            attempt, created = PuzzleAttempt.objects.get_or_start_attempt(
                user=user,
                daily_puzzle=daily_puzzle,
                puzzle_instance=puzzle_instance
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

            return JsonResponse({
                "message": "Progress saved successfully.",
                "last_saved": attempt.last_saved.isoformat(),
            }, status=200)

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

            return JsonResponse({
                "exists": True,
                "progress_data": attempt.progress_data,
                "time_spent_ms": attempt.time_spent_ms,
                "last_saved": attempt.last_saved.isoformat(),
                "puzzle_type": puzzle_model_name_lower.replace('puzzle', ''),
            }, status=200)

        except PuzzleAttempt.DoesNotExist:
            print(f"[GetProgressView] ℹ️ No attempt found for {user.username}, puzzle {puzzle_id}")
            return JsonResponse({
                "exists": False,
                "message": "No active attempt found. Start a new game.",
            }, status=404)


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
                user=user,
                content_type=puzzle_content_type,
                object_id=puzzle_instance.pk
            ).first()
            
            if submission:
                print(f"[CheckSubmissionView] ✅ Found submission for {user.username}, puzzle {puzzle_id}")
                return JsonResponse({
                    'hasSubmitted': True,
                    'score': submission.points_awarded,
                    'submittedAt': submission.created_at.isoformat()
                })
            
            print(f"[CheckSubmissionView] ℹ️ No submission for {user.username}, puzzle {puzzle_id}")
            return JsonResponse({'hasSubmitted': False})
            
        except Exception as e:
            print(f"[CheckSubmissionView] Error: {e}")
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
            user=user,
            content_type=puzzle_content_type,
            object_id=puzzle_instance.pk
        ).first()
        
        if existing_submission:
            return JsonResponse({
                "error": "You have already submitted this puzzle.",
                "points_awarded": existing_submission.points_awarded,
                "submission_id": existing_submission.pk
            }, status=400)

        # 3. Retrieve Attempt
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

        # 4. TIME LIMIT ENFORCEMENT
        if hasattr(PuzzleModel, "TIME_LIMITS_MS"):
            time_limits = PuzzleModel.TIME_LIMITS_MS
            max_time_ms = time_limits.get(difficulty)

            if max_time_ms is not None and time_taken > max_time_ms:
                max_time_minutes = max_time_ms / 60000
                return JsonResponse(
                    {"error": f"Time limit of {int(max_time_minutes)} minutes for '{difficulty}' difficulty was exceeded."},
                    status=403,
                )

        # 5. SCORING
        try:
            progress_data = attempt.progress_data
            
            if puzzle_model_name_lower == "sudokupuzzle":
                if "grid" in progress_data:
                    validation_data = progress_data["grid"]
                else:
                    validation_data = progress_data
            else:
                validation_data = progress_data
            
            points_awarded, tries = puzzle_instance.validate_and_score(
                validation_data, difficulty
            )
            
            print(f"[SubmitPuzzleView] Validation result: {points_awarded} points, {tries} tries")
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

        # 6. CREATE SUBMISSION RECORD (even for 0 points)
        submission = Submission.objects.create(
            user=user,
            puzzle=puzzle_instance,
            content_type=puzzle_content_type,
            object_id=puzzle_instance.pk,
            difficulty=difficulty.lower(),
            points_awarded=points_awarded,
            time_taken_ms=time_taken,
            tries=tries,
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

        # 8. UPDATE LEADERBOARDS (only if points > 0)
        if points_awarded > 0:
            try:
                LeaderboardAggregator.update_all_for_date(daily_puzzle.date)
                print(f"✅ Leaderboards updated for {daily_puzzle.date}")
            except Exception as e:
                print(f"⚠️ Leaderboard update failed: {e}")

        # 9. Clean up the PuzzleAttempt
        attempt.delete()

        # 10  Refresh user to get latest streak info
        user.refresh_from_db()
        print(f"[SubmitPuzzleView] ✅ Submitted successfully: {points_awarded} points for {user.username}")

        # ✅ Return complete response with all streak fields
        response_message = "Puzzle submitted successfully." if points_awarded > 0 else "Puzzle submitted (no points awarded)."
        
        return JsonResponse({
            "message": response_message,
            "points_awarded": points_awarded,
            "submission_id": submission.pk,
            # ✅ Add streak information (set to 0 for now, you can implement proper streak logic later)
            # ⭐️ Use the live values from the refreshed user instance ⭐️
            "current_streak": user.current_streak_count,
            "max_streak": user.max_streak_count,
            "last_active": user.last_active.isoformat() if user.last_active else None,
            "streak_updated_today": streak_was_updated, # Use the boolean return value
        }, status=201)


# ============================================================================
# VIEW 5: GetHintView - Request Sudoku Hints
# ============================================================================
@method_decorator(csrf_protect, name="dispatch")
@method_decorator(login_required, name="post")
class GetHintView(View):
    def post(self, request, daily_puzzle_date, puzzle_model_name, puzzle_id):
        user = request.user

        # 1. Validation and Data Retrieval
        try:
            data = json.loads(request.body)
            difficulty = data.get("difficulty", "EASY").upper()

            # Parse date string to date object
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

            attempt = PuzzleAttempt.objects.get(
                user=user,
                daily_puzzle=daily_puzzle,
                content_type=puzzle_content_type,
                object_id=puzzle_instance.pk,
            )

        except (SudokuPuzzle.DoesNotExist, PuzzleAttempt.DoesNotExist, json.JSONDecodeError) as e:
            print(f"[GetHintView] Error: {e}")
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
        
        # ✅ Handle grid format (wrapped in {"grid": ...})
        progress_data = attempt.progress_data
        if "grid" in progress_data:
            # Convert grid to string format
            grid = progress_data["grid"]
            current_grid = ""
            for row in grid:
                for cell in row:
                    current_grid += str(cell.get("value", 0) or 0)
        else:
            current_grid = progress_data.get("final_grid", "0" * 81)

        empty_indices = [i for i, char in enumerate(current_grid) if char == "0"]

        if not empty_indices:
            return JsonResponse({"error": "Puzzle appears to be complete."}, status=400)

        hint_index = random.choice(empty_indices)
        hint_value = solution_string[hint_index]

        # 4. Prepare Response
        hints_used_new = hints_used + 1

        print(f"[GetHintView] ✅ Hint granted to {user.username}: index {hint_index}, value {hint_value}")

        return JsonResponse({
            "message": "Hint granted.",
            "hint_index": hint_index,
            "hint_value": hint_value,
            "hints_used_new": hints_used_new,
        }, status=200)


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
            submissions = Submission.objects.filter(
                user=user,
                created_at__gte=start_of_day_pht,
                created_at__lte=end_of_day_pht
            ).select_related('content_type').order_by('-created_at')
            
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
                    'created_at': sub.created_at.isoformat()
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
                user=user,
                created_at__gte=start_of_day_pht,
                created_at__lte=end_of_day_pht
            ).values_list('content_type__model', flat=True)
            
            # Get all attempts for today
            daily_puzzle = DailyPuzzle.objects.filter(date=today_pht).first()
            if not daily_puzzle:
                return JsonResponse({'completed': [], 'date': today_pht.isoformat()})
            
            lost_attempts = PuzzleAttempt.objects.filter(
                user=user,
                daily_puzzle=daily_puzzle
            )
            
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
            
            return JsonResponse({
                'completed': completed,
                'date': today_pht.isoformat()
            })
            
        except Exception as e:
            print(f"[GetTodayCompleted] Error: {e}")
            import traceback
            traceback.print_exc()
            return JsonResponse({'error': str(e)}, status=500)
        



from rest_framework.permissions import AllowAny

@api_view(['GET'])
@permission_classes([IsAuthenticated])

def get_user_streak_data(request):
    user = request.user
    
    data = {
        'current_streak': user.current_streak_count,
        'max_streak': user.max_streak_count,
        'last_active_timestamp': user.last_active, # Frontend can use this for display
        'display_message': f"You are currently on a {user.current_streak_count}-day streak!"
    }
    
    return Response(data)