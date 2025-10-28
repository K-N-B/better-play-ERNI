# /gameplay/views.py (Assuming you have a way to authenticate the user)
from django.views import View
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
import json
from .models import PuzzleAttempt, Submission
# Assuming 'games' is another app and you have your puzzle models and DailyPuzzle
from games.models import DailyPuzzle, WordlePuzzle, SudokuPuzzle, ErnigramPuzzle # Example imports
from django.contrib.contenttypes.models import ContentType
from django.views.decorators.csrf import csrf_protect

from django.utils.decorators import method_decorator
from django.contrib.auth.decorators import login_required



# @method_decorator(csrf_protect, name='dispatch')
# @method_decorator(login_required, name='post')
class SaveProgressView(View):
    def post(self, request, daily_puzzle_id, puzzle_model_name, puzzle_id):
        # NOTE: request.user must be the authenticated user
        user = request.user 

        # 1. Input Validation and Setup
        try:
            data = json.loads(request.body)
            new_progress_data = data.get('progress_data')
            new_time_spent = data.get('time_spent_ms') # Time reported by the client

            # --- CRITICAL: Get the difficulty level from the request ---
            difficulty = data.get('difficulty', 'EASY').upper() 
            # ---------------------------------------------------------
            
            if not isinstance(new_progress_data, dict) or new_time_spent is None:
                return JsonResponse({"error": "Invalid data format."}, status=400)

            # Get DailyPuzzle instance
            daily_puzzle = get_object_or_404(DailyPuzzle, pk=daily_puzzle_id)
            
            # Dynamically get the specific puzzle model instance (e.g., WordlePuzzle)
            if puzzle_model_name.lower() == 'wordlepuzzle':
                PuzzleModel = WordlePuzzle
            elif puzzle_model_name.lower() == 'sudokupuzzle':
                PuzzleModel = SudokuPuzzle
            elif puzzle_model_name.lower() == 'ernigrampuzzle':
                PuzzleModel = ErnigramPuzzle
            else:
                return JsonResponse({"error": "Unknown puzzle type."}, status=400)

            puzzle_instance = get_object_or_404(PuzzleModel, pk=puzzle_id)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON."}, status=400)
        except Exception:
            return JsonResponse({"error": "Invalid puzzle reference."}, status=400)
        
        # ------------------------------------------------------------
        # --- NEW: TIME LIMIT ENFORCEMENT ---
        # ------------------------------------------------------------
        if hasattr(PuzzleModel, 'TIME_LIMITS_MS'):
            time_limits = PuzzleModel.TIME_LIMITS_MS
            max_time_ms = time_limits.get(difficulty)

            if max_time_ms is None:
                return JsonResponse({"error": f"Invalid difficulty '{difficulty}' for time limit check."}, status=400)

            if new_time_spent > max_time_ms:
                # Convert ms back to minutes for a user-friendly error message
                max_time_minutes = max_time_ms / 60000 
                return JsonResponse(
                    {"error": f"Time limit of {int(max_time_minutes)} minutes for '{difficulty}' difficulty exceeded. Game state not saved."}, 
                    status=403 # Forbidden
                )
        

        # ------------------------------------------------------------
        # This check should only run if the model has GUESS_LIMITS defined
        # ------------------------------------------------------------
        # --- GUESS/HINT LIMIT ENFORCEMENT ---
        # ------------------------------------------------------------
        limit_config = None
        limit_type = None

        # If it's a Wordle-type puzzle
        if hasattr(PuzzleModel, 'GUESS_LIMITS'):
            limit_config = PuzzleModel.GUESS_LIMITS
            current_count = len(new_progress_data.get('guesses', []))
            limit_type = 'guesses'
            
        # If it's a Sudoku-type puzzle
        elif hasattr(PuzzleModel, 'HINT_LIMITS'): 
            limit_config = PuzzleModel.HINT_LIMITS
            # CRITICAL: Ensure 'hints_used' is the key being checked
            current_count = new_progress_data.get('hints_used', 0) 
            limit_type = 'hints'

        # --- NEW: Check for Ernigram Mistake Limits ---
        elif hasattr(PuzzleModel, 'MISTAKE_LIMITS'):
            limit_config = PuzzleModel.MISTAKE_LIMITS
            current_count = new_progress_data.get('misses', 0)
            limit_type = 'mistakes'
            
        # Apply the enforcement logic using the determined limits
        if limit_config is not None:
            max_limit = limit_config.get(difficulty)
            
            if max_limit is None:
                return JsonResponse({"error": f"Invalid difficulty '{difficulty}' for this puzzle's limit check."}, status=400)
            
            # **The Enforcement Logic:**
            if current_count > max_limit:
                return JsonResponse(
                    {"error": f"Maximum of {max_limit} {limit_type} for '{difficulty}' difficulty exceeded."}, 
                    status=403 # Forbidden
                )

        # --- 3. Get or Start the Attempt ---
        attempt, created = PuzzleAttempt.objects.get_or_start_attempt(
            user=user,
            daily_puzzle=daily_puzzle,
            puzzle_instance=puzzle_instance
        )

        # 3. Update the Attempt's state
        attempt.progress_data.update(new_progress_data) 
        
        # The server accepts the client's total accumulated time
        attempt.time_spent_ms = new_time_spent 

        attempt.save()

        return JsonResponse({
            "message": "Progress saved successfully.",
            "last_saved": attempt.last_saved.isoformat()
        })
    


# /gameplay/views.py (within the same file as SaveProgressView)
# @method_decorator(csrf_protect, name='dispatch')
# @method_decorator(login_required, name='post')
class SubmitPuzzleView(View):
    def post(self, request, daily_puzzle_id, puzzle_model_name, puzzle_id):
        user = request.user 
        
        # -----------------------------------------------------------
        # 1. Setup and Validation (Copied from SaveProgressView)
        # -----------------------------------------------------------
        try:
            # Note: We don't need the JSON body here, but we check the URL keys.
            daily_puzzle = get_object_or_404(DailyPuzzle, pk=daily_puzzle_id)
            
            puzzle_model_name_lower = puzzle_model_name.lower()
            if puzzle_model_name_lower == 'wordlepuzzle':
                PuzzleModel = WordlePuzzle
            elif puzzle_model_name_lower == 'sudokupuzzle':
                PuzzleModel = SudokuPuzzle
            elif puzzle_model_name_lower == 'ernigrampuzzle':
                PuzzleModel = ErnigramPuzzle
            else:
                return JsonResponse({"error": "Unknown puzzle type."}, status=400)

            puzzle_instance = get_object_or_404(PuzzleModel, pk=puzzle_id)
            puzzle_content_type = ContentType.objects.get_for_model(puzzle_instance)

        except Exception:
            return JsonResponse({"error": "Invalid puzzle reference."}, status=400)
        
       # -----------------------------------------------------------
        # 2. Retrieve Attempt and Process Data
        # -----------------------------------------------------------
        try:
            attempt = PuzzleAttempt.objects.get(
                user=user,
                daily_puzzle=daily_puzzle,
                content_type=puzzle_content_type,
                object_id=puzzle_instance.pk,
            )
            time_taken = attempt.time_spent_ms # Get time from the attempt, not client payload
        except PuzzleAttempt.DoesNotExist:
            return JsonResponse({"error": "No active attempt found to submit."}, status=404)

        # Retrieve client-sent difficulty (required for Submission model)
        try:
            submission_data = json.loads(request.body)
            difficulty = submission_data.get('difficulty', 'EASY').upper()
        except json.JSONDecodeError:
            difficulty = 'EASY'

        
        # -----------------------------------------------------------
        # 3a. CRITICAL: TIME LIMIT ENFORCEMENT ON FINAL SUBMISSION
        # -----------------------------------------------------------
        if hasattr(PuzzleModel, 'TIME_LIMITS_MS'):
            time_limits = PuzzleModel.TIME_LIMITS_MS
            max_time_ms = time_limits.get(difficulty)

            if max_time_ms is not None and time_taken > max_time_ms:
                max_time_minutes = max_time_ms / 60000
                return JsonResponse(
                    {"error": f"Submission failed: Time limit of {int(max_time_minutes)} minutes for '{difficulty}' difficulty was exceeded."}, 
                    status=403 # Forbidden, due to game rule violation
                )
       # -----------------------------------------------------------
        # 3b. --- UNIFIED SCORING CALL ---
        # -----------------------------------------------------------
        try:
            # UNIFIED SCORING CALL: Pass difficulty to all scoring methods.
            # This works because both Wordle and Sudoku now require it for base point lookup.
            points_awarded, tries = puzzle_instance.validate_and_score(
                attempt.progress_data,
                difficulty 
            )
        
        except AttributeError:
            return JsonResponse({"error": f"Scoring method missing for {puzzle_model_name}."}, status=500)
        except Exception as e:
            return JsonResponse({"error": f"Scoring failed: {str(e)}"}, status=400)

        # Handle unsolved/failed puzzles (score is 0)
        if points_awarded <= 0:
            return JsonResponse({"error": "Puzzle was not successfully solved or achieved zero points."}, status=400)
        
        # -----------------------------------------------------------
        # 4. Create the Submission Record
        # -----------------------------------------------------------
        submission = Submission.objects.create(
            user=user,
            puzzle=puzzle_instance, # GenericForeignKey is set automatically
            content_type=puzzle_content_type,
            object_id=puzzle_instance.pk,
            difficulty=difficulty,
            points_awarded=points_awarded, # Server-verified score
            time_taken_ms=time_taken,      # Server-verified time
            tries=tries                    # Server-verified guess count
        )

        # 5. Clean up the PuzzleAttempt
        attempt.delete() 

        return JsonResponse({
            "message": "Puzzle submitted successfully.",
            "points_awarded": points_awarded,
            "submission_id": submission.pk
        }, status=201)



# @method_decorator(csrf_protect, name='dispatch')
# @method_decorator(login_required, name='get')
class GetProgressView(View):
    """
    Handles GET requests to retrieve a user's current PuzzleAttempt state for a specific puzzle.
    """
    def get(self, request, daily_puzzle_id, puzzle_model_name, puzzle_id):
        user = request.user

        # 1. Setup and Validation (Reuses logic from Save/Submit views)
        try:
            daily_puzzle = get_object_or_404(DailyPuzzle, pk=daily_puzzle_id)
            
            # Dynamically determine the PuzzleModel
            if puzzle_model_name.lower() == 'wordlepuzzle':
                PuzzleModel = WordlePuzzle
            elif puzzle_model_name.lower() == 'sudokupuzzle':
                PuzzleModel = SudokuPuzzle
            elif puzzle_model_name.lower() == 'ernigrampuzzle':
                PuzzleModel = ErnigramPuzzle
            else:
                return JsonResponse({"error": "Unknown puzzle type."}, status=400)
            
            puzzle_instance = get_object_or_404(PuzzleModel, pk=puzzle_id)
            puzzle_content_type = ContentType.objects.get_for_model(puzzle_instance)

        except Exception:
            # Catch errors like invalid date format or non-existent puzzle IDs
            return JsonResponse({"error": "Invalid puzzle reference in URL."}, status=400)

        # 2. Retrieve the Attempt
        try:
            # Use the GFK components to uniquely find the attempt
            attempt = PuzzleAttempt.objects.get(
                user=user,
                daily_puzzle=daily_puzzle,
                content_type=puzzle_content_type,
                object_id=puzzle_instance.pk,
            )
            
            # 3. Success: Return the saved data
            return JsonResponse({
                "exists": True,
                "progress_data": attempt.progress_data,
                "time_spent_ms": attempt.time_spent_ms,
                "last_saved": attempt.last_saved.isoformat()
            }, status=200)

        except PuzzleAttempt.DoesNotExist:
            # 4. Not Found: Return a clean 'not found' signal (New Game)
            return JsonResponse({
                "exists": False,
                "message": "No active attempt found. Start a new game."
            }, status=200) # Use 200 to signal a successful check, but the attempt doesn't exist

