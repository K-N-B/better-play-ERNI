# games/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.utils import timezone
from django.db import transaction
from datetime import date, timedelta
import pytz

from .models import WordlePuzzle, DailyPuzzle, SudokuPuzzle, ErnigramPuzzle
from .serializers import (
    WordlePuzzleSerializer, 
    WordlePuzzleDetailSerializer, 
    DailyPuzzleSerializer
)
from gameplay.models import PuzzleAttempt, Submission
from gameplay.serializers import (
    PuzzleAttemptSerializer, 
    SubmissionSerializer,
    SubmissionCreateSerializer
)
from gameplay.scoring import WordleScorer


class DailyPuzzlesView(APIView):
    """
    GET /api/games/daily/
    GET /api/games/daily/?date=2025-01-28
    
    Returns all daily puzzles (Wordle, Sudoku, Ernigram) for a specific date.
    If no date provided, returns today's puzzles.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Get date from query params or use today
        date_str = request.query_params.get('date')
        
        try:
            if date_str:
                target_date = date.fromisoformat(date_str)
            else:
                # Get today in Philippine Time
                pht_tz = pytz.timezone('Asia/Manila')
                target_date = timezone.now().astimezone(pht_tz).date()
        except ValueError:
            return Response(
                {'error': 'Invalid date format. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Try to get DailyPuzzle set
        try:
            daily_puzzle = DailyPuzzle.objects.get(date=target_date)
            serializer = DailyPuzzleSerializer(daily_puzzle)
            return Response(serializer.data)
        except DailyPuzzle.DoesNotExist:
            # If DailyPuzzle doesn't exist, try to get individual puzzles
            # This is a fallback for when you only have Wordle implemented
            try:
                wordle = WordlePuzzle.objects.get(date_to_be_used=target_date)
                
                # Build response manually
                response_data = {
                    'date': target_date.isoformat(),
                    'wordle': WordlePuzzleSerializer(wordle).data,
                    'sudoku': None,  # Not implemented yet
                    'ernigram': None  # Not implemented yet
                }
                
                return Response(response_data)
            
            except WordlePuzzle.DoesNotExist:
                return Response(
                    {'error': f'No puzzles available for {target_date}'},
                    status=status.HTTP_404_NOT_FOUND
                )


class MockDailyPuzzlesGenerateView(APIView):
    """
    POST /api/games/mock-generate/
    
    DEVELOPMENT ONLY: Manually trigger puzzle generation for testing.
    
    Body (optional):
    {
        "date": "2025-01-28"
    }
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        from .services import generate_daily_puzzles
        
        date_str = request.data.get('date')
        
        try:
            if date_str:
                target_date = date.fromisoformat(date_str)
            else:
                pht_tz = pytz.timezone('Asia/Manila')
                target_date = timezone.now().astimezone(pht_tz).date()
        except ValueError:
            return Response(
                {'error': 'Invalid date format. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            daily_puzzle = generate_daily_puzzles(target_date)
            
            return Response({
                'success': True,
                'message': f'Puzzles generated for {target_date}',
                'puzzle': DailyPuzzleSerializer(daily_puzzle).data
            }, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            return Response(
                {'error': f'Failed to generate puzzles: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class WordleGameViewSet(viewsets.ViewSet):
    """ViewSet for Wordle game operations"""
    permission_classes = [IsAuthenticated]
    
    def _get_today_pht(self):
        """Get current date in Philippine Time"""
        pht_tz = pytz.timezone('Asia/Manila')
        now_pht = timezone.now().astimezone(pht_tz)
        return now_pht.date()
    
    @action(detail=False, methods=['get'], url_path='today')
    def get_today_puzzle(self, request):
        """
        GET /api/wordle/today/
        
        Returns today's Wordle puzzle.
        - If user already submitted: Return "already_played" status
        - If user has saved progress: Return saved attempt
        - Otherwise: Return fresh puzzle
        """
        user = request.user
        today = self._get_today_pht()
        
        # Check if puzzle exists for today
        try:
            puzzle = WordlePuzzle.objects.get(date_to_be_used=today)
        except WordlePuzzle.DoesNotExist:
            return Response(
                {'error': 'No puzzle available for today. Please contact administrator.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user already submitted today
        existing_submission = Submission.objects.filter(
            user=user,
            puzzle_type='wordle',
            puzzle_date=today
        ).first()
        
        if existing_submission:
            # User already played today
            return Response({
                'status': 'already_played',
                'message': 'You already played Wordle today. Come back tomorrow!',
                'submission': SubmissionSerializer(existing_submission).data,
                'puzzle': WordlePuzzleDetailSerializer(puzzle).data  # Include solution
            })
        
        # Check for saved progress
        saved_attempt = PuzzleAttempt.objects.filter(
            user=user,
            puzzle_type='wordle',
            puzzle_id=puzzle.id,
            completed=False
        ).first()
        
        response_data = {
            'status': 'available',
            'puzzle': WordlePuzzleSerializer(puzzle).data,  # NO solution
        }
        
        if saved_attempt:
            response_data['saved_attempt'] = PuzzleAttemptSerializer(saved_attempt).data
        
        return Response(response_data)
    
    @action(detail=False, methods=['post'], url_path='save-progress')
    def save_progress(self, request):
        """
        POST /api/wordle/save-progress/
        
        Saves current game state for resume later.
        
        Body:
        {
            "puzzle_id": 123,
            "progress_data": {...},
            "time_spent_ms": 45000
        }
        """
        user = request.user
        puzzle_id = request.data.get('puzzle_id')
        progress_data = request.data.get('progress_data', {})
        time_spent_ms = request.data.get('time_spent_ms', 0)
        
        if not puzzle_id:
            return Response(
                {'error': 'puzzle_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify puzzle exists
        try:
            puzzle = WordlePuzzle.objects.get(id=puzzle_id)
        except WordlePuzzle.DoesNotExist:
            return Response(
                {'error': 'Invalid puzzle_id'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Update or create attempt
        attempt, created = PuzzleAttempt.objects.update_or_create(
            user=user,
            puzzle_type='wordle',
            puzzle_id=puzzle_id,
            defaults={
                'progress_data': progress_data,
                'time_spent_ms': time_spent_ms,
                'completed': False
            }
        )
        
        return Response({
            'message': 'Progress saved',
            'attempt': PuzzleAttemptSerializer(attempt).data
        })
    
    @action(detail=False, methods=['post'], url_path='submit')
    @transaction.atomic
    def submit_puzzle(self, request):
        """
        POST /api/wordle/submit/
        
        Submit completed Wordle puzzle for scoring.
        
        Body:
        {
            "puzzle_id": 123,
            "difficulty": "easy",
            "time_taken_ms": 95000,
            "tries": 4,
            "final_state": {...}
        }
        """
        user = request.user
        serializer = SubmissionCreateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        puzzle_id = data['puzzle_id']
        difficulty = data['difficulty']
        time_taken_ms = data['time_taken_ms']
        tries = data['tries']
        final_state = data.get('final_state', {})
        
        # Verify puzzle exists
        try:
            puzzle = WordlePuzzle.objects.get(id=puzzle_id)
        except WordlePuzzle.DoesNotExist:
            return Response(
                {'error': 'Invalid puzzle_id'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        puzzle_date = puzzle.date_to_be_used
        
        # Check if already submitted
        if Submission.objects.filter(user=user, puzzle_type='wordle', puzzle_date=puzzle_date).exists():
            return Response(
                {'error': 'You already submitted this puzzle'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate score
        points = WordleScorer.calculate_score(difficulty, tries, time_taken_ms, user)
        
        # Update streak
        current_streak, is_new_record = WordleScorer.update_user_streak(user, puzzle_date)
        
        # Create submission
        submission = Submission.objects.create(
            user=user,
            puzzle_type='wordle',
            puzzle_id=puzzle_id,
            puzzle_date=puzzle_date,
            difficulty=difficulty,
            points_awarded=points,
            time_taken_ms=time_taken_ms,
            tries=tries,
            final_state=final_state
        )
        
        # Update user total points
        user.total_points_alltime += points
        user.save(update_fields=['total_points_alltime'])
        
        # Mark any saved attempt as completed
        PuzzleAttempt.objects.filter(
            user=user,
            puzzle_type='wordle',
            puzzle_id=puzzle_id
        ).update(completed=True)
        
        # Return response with solution
        return Response({
            'message': 'Puzzle submitted successfully!',
            'submission': SubmissionSerializer(submission).data,
            'puzzle': WordlePuzzleDetailSerializer(puzzle).data,
            'points_awarded': points,
            'current_streak': current_streak,
            'is_new_streak_record': is_new_record,
            'total_points': user.total_points_alltime
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'], url_path='validate-guess')
    def validate_guess(self, request):
        """
        POST /api/wordle/validate-guess/
        
        Validates a single guess and returns color hints.
        
        Body:
        {
            "puzzle_id": 123,
            "guess": "REACT"
        }
        """
        puzzle_id = request.data.get('puzzle_id')
        guess = request.data.get('guess', '').upper()
        
        if not puzzle_id or not guess:
            return Response(
                {'error': 'puzzle_id and guess are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get puzzle
        try:
            puzzle = WordlePuzzle.objects.get(id=puzzle_id)
        except WordlePuzzle.DoesNotExist:
            return Response(
                {'error': 'Invalid puzzle_id'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        solution = puzzle.solution_word.upper()
        
        # Validate guess length
        if len(guess) != len(solution):
            return Response(
                {'error': f'Guess must be {len(solution)} letters'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate color hints
        hints = self._calculate_hints(guess, solution)
        
        return Response({
            'guess': guess,
            'hints': hints,
            'is_correct': guess == solution
        })
    
    def _calculate_hints(self, guess: str, solution: str) -> list:
        """
        Calculate Wordle color hints.
        
        Returns list of hints: ['correct', 'present', 'absent', ...]
        """
        hints = ['absent'] * len(guess)
        solution_chars = list(solution)
        
        # First pass: Mark correct positions
        for i, char in enumerate(guess):
            if char == solution[i]:
                hints[i] = 'correct'
                solution_chars[i] = None  # Mark as used
        
        # Second pass: Mark present characters
        for i, char in enumerate(guess):
            if hints[i] == 'absent' and char in solution_chars:
                hints[i] = 'present'
                solution_chars[solution_chars.index(char)] = None  # Mark as used
        
        return hints