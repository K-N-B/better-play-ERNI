from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction
from django.contrib.auth import get_user_model
from datetime import timedelta

from .models import (
    Puzzle, UserProgress, Submission, DailyCompletionStatus, 
    ActivityFeed, Streak
)
from .serializers import (
    UserProgressSerializer, SaveProgressSerializer,
    SubmitPuzzleSerializer, SubmissionSerializer,
    HintsSerializer, UserBasicSerializer
)
from .services.points_calculator import PointsCalculator
from .services.leaderboard_service import LeaderboardService
from .services.streak_service import StreakService

User = get_user_model()


# ============================================
# 1. GET DAILY PUZZLES
# ============================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_daily_puzzles(request):
    """
    GET /api/puzzles/daily/
    
    Returns today's puzzles for ALL game types.
    Query params: difficulty (optional): 'easy' or 'hard' (defaults to 'easy')
    """
    today = timezone.now().date()
    difficulty = request.GET.get('difficulty', 'easy')
    
    try:
        # Fetch today's puzzles
        wordle = Puzzle.objects.get(
            puzzle_type='wordle',
            puzzle_date=today,
            difficulty=difficulty,
            is_active=True
        )
        
        sudoku = Puzzle.objects.get(
            puzzle_type='sudoku',
            puzzle_date=today,
            difficulty=difficulty,
            is_active=True
        )
        
        ernigram = Puzzle.objects.get(
            puzzle_type='ernigram',
            puzzle_date=today,
            difficulty=difficulty,
            is_active=True
        )
        
        # Build response (WITHOUT solutions)
        response_data = {
            'date': str(today),
            'wordle': {'id': wordle.id},
            'sudoku': {
                'id': sudoku.id,
                'puzzle_string': sudoku.puzzle_string,
                'difficulty': sudoku.difficulty.upper()
            },
            'ernigram': {
                'id': ernigram.id,
                'clue': ernigram.clue
            }
        }
        
        return Response(response_data)
    
    except Puzzle.DoesNotExist:
        return Response(
            {'error': 'Daily puzzles not yet generated. Please try again later.'},
            status=status.HTTP_404_NOT_FOUND
        )


# ============================================
# 2. GET PUZZLE HINTS
# ============================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_puzzle_hints(request, puzzle_id):
    """
    GET /api/puzzles/<puzzle_id>/hints/
    Returns AI-generated hints for a puzzle (Wordle only).
    """
    puzzle = get_object_or_404(Puzzle, id=puzzle_id)
    
    if puzzle.puzzle_type != 'wordle':
        return Response(
            {'error': 'Hints only available for Wordle puzzles'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    return Response(puzzle.hints)


# ============================================
# 3. GET SAVED PROGRESS
# ============================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_saved_progress(request, puzzle_type):
    """
    GET /api/progress/<puzzle_type>/
    Loads saved game progress for today's puzzle.
    """
    today = timezone.now().date()
    
    try:
        progress = UserProgress.objects.filter(
            user=request.user,
            puzzle_type=puzzle_type,
            puzzle__puzzle_date=today
        ).select_related('puzzle').first()
        
        if progress:
            serializer = UserProgressSerializer(progress)
            return Response(serializer.data)
        else:
            return Response(None)
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ============================================
# 4. SAVE PROGRESS (Auto-save)
# ============================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_progress(request):
    """
    POST /api/progress/save/
    Auto-saves game progress (called every 2 seconds).
    """
    serializer = SaveProgressSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    puzzle = get_object_or_404(Puzzle, id=serializer.validated_data['puzzle_id'])
    
    # Update or create progress
    progress, created = UserProgress.objects.update_or_create(
        user=request.user,
        puzzle=puzzle,
        defaults={
            'puzzle_type': serializer.validated_data['puzzle_type'],
            'progress_data': serializer.validated_data['progress_data'],
            'time_spent_ms': serializer.validated_data['time_spent_ms']
        }
    )
    
    response_serializer = UserProgressSerializer(progress)
    return Response(response_serializer.data)


# ============================================
# 5. SUBMIT PUZZLE (Final Submission)
# ============================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_puzzle(request):
    """
    POST /api/submissions/submit/
    Submits completed puzzle and calculates points.
    """
    serializer = SubmitPuzzleSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    puzzle = get_object_or_404(Puzzle, id=serializer.validated_data['puzzle_id'])
    
    # Check if already submitted
    if Submission.objects.filter(user=request.user, puzzle=puzzle).exists():
        return Response(
            {'error': 'Puzzle already submitted'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    with transaction.atomic():
        # 1. Calculate points
        points = PointsCalculator.calculate_points(
            puzzle_type=serializer.validated_data['puzzle_type'],
            difficulty=puzzle.difficulty,
            tries=serializer.validated_data['tries'],
            time_ms=serializer.validated_data['time_taken_ms']
        )
        
        # 2. Create submission
        submission = Submission.objects.create(
            user=request.user,
            puzzle=puzzle,
            puzzle_type=serializer.validated_data['puzzle_type'],
            tries=serializer.validated_data['tries'],
            time_taken_ms=serializer.validated_data['time_taken_ms'],
            points_awarded=points
        )
        
        # 3. Delete saved progress
        UserProgress.objects.filter(user=request.user, puzzle=puzzle).delete()
        
        # 4. Update daily completion status
        today = timezone.now().date()
        daily_status, created = DailyCompletionStatus.objects.get_or_create(
            user=request.user,
            completion_date=today,
            defaults={'puzzles_completed_count': 0, 'points_earned_today': 0}
        )
        
        puzzle_type = serializer.validated_data['puzzle_type']
        if puzzle_type == 'wordle':
            daily_status.wordle_completed = True
        elif puzzle_type == 'sudoku':
            daily_status.sudoku_completed = True
        elif puzzle_type == 'ernigram':
            daily_status.ernigram_completed = True
        
        daily_status.puzzles_completed_count += 1
        daily_status.points_earned_today += points
        daily_status.save()
        
        # 5. Check if all puzzles completed
        if daily_status.is_all_completed():
            StreakService.update_streak(request.user, today)
            bonus = PointsCalculator.get_daily_completion_bonus(3)
            points += bonus
        
        # 6. Update user points
        LeaderboardService.update_user_points(request.user, points)
        
        # 7. Add to activity feed
        ActivityFeed.objects.create(
            user=request.user,
            event_type='puzzle_completed',
            puzzle_type=puzzle_type,
            points=points,
            tries=serializer.validated_data['tries']
        )
        
        # 8. Refresh leaderboards
        LeaderboardService.refresh_all_leaderboards()
        
        # 9. Update last active
        request.user.last_active = timezone.now()
        request.user.save(update_fields=['last_active'])
    
    return Response({'score': points})


# ============================================
# 6. GET TODAY'S SUBMISSIONS
# ============================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_today_submissions(request):
    """
    GET /api/submissions/today/
    Returns puzzles user completed today.
    """
    today = timezone.now().date()
    
    submissions = Submission.objects.filter(
        user=request.user,
        created_at__date=today
    ).select_related('user').order_by('created_at')
    
    serializer = SubmissionSerializer(submissions, many=True)
    return Response(serializer.data)


# ============================================
# 7. GET LEADERBOARD
# ============================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_leaderboard(request, period, leaderboard_type):
    """
    GET /api/leaderboards/<period>/<type>/
    Returns leaderboard rankings.
    """
    if leaderboard_type != 'individual':
        return Response(
            {'error': 'Only individual leaderboards supported'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    valid_periods = ['daily', 'weekly', 'monthly', 'alltime']
    if period not in valid_periods:
        return Response(
            {'error': f'Invalid period. Must be one of: {valid_periods}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    limit = int(request.GET.get('limit', 100))
    
    # Get cached leaderboard
    leaderboard = LeaderboardService.get_leaderboard(period, limit)
    
    data = []
    for entry in leaderboard:
        data.append({
            'user': {
                'id': entry.user.id,
                'username': entry.user.username,
                'avatar_url': entry.user.avatar_url
            },
            'rank': entry.rank,
            'score': entry.score,
            'previous_rank': entry.previous_rank
        })
    
    return Response(data)


# ============================================
# 8. GET ACTIVITY FEED
# ============================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_activity_feed(request):
    """
    GET /api/activity-feed/
    Returns recent puzzle completions.
    """
    limit = int(request.GET.get('limit', 50))
    
    activities = ActivityFeed.objects.select_related('user').order_by('-created_at')[:limit]
    
    data = []
    for activity in activities:
        data.append({
            'id': activity.id,
            'user': {
                'id': activity.user.id,
                'username': activity.user.username,
                'avatar_url': activity.user.avatar_url
            },
            'event_type': activity.event_type,
            'puzzle_type': activity.puzzle_type,
            'points': activity.points,
            'tries': activity.tries,
            'metadata': activity.metadata,
            'created_at': activity.created_at.isoformat(),
            'time_ago': activity.time_ago
        })
    
    return Response(data)


# ============================================
# 9. GET USER STATS
# ============================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_stats(request):
    """
    GET /api/users/stats/
    Returns user statistics.
    """
    user = request.user
    today = timezone.now().date()
    
    try:
        daily_status = DailyCompletionStatus.objects.get(
            user=user,
            completion_date=today
        )
        puzzles_today = daily_status.puzzles_completed_count
    except DailyCompletionStatus.DoesNotExist:
        puzzles_today = 0
    
    total_submissions = Submission.objects.filter(user=user).count()
    
    stats = {
        'total_points_daily': user.total_points_daily,
        'total_points_weekly': user.total_points_weekly,
        'total_points_monthly': user.total_points_monthly,
        'total_points_alltime': user.total_points_alltime,
        'current_streak': user.current_streak_count,
        'max_streak': user.max_streak_count,
        'puzzles_completed_today': puzzles_today,
        'total_submissions': total_submissions,
    }
    
    return Response(stats)


# ============================================
# 10. GET WHO'S ONLINE
# ============================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_whos_online(request):
    """
    GET /api/users/online/
    Returns users active in last 5 minutes.
    """
    five_minutes_ago = timezone.now() - timedelta(minutes=5)
    
    online_users = User.objects.filter(
        last_active__gte=five_minutes_ago
    ).exclude(id=request.user.id)[:20]
    
    serializer = UserBasicSerializer(online_users, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_wordle_guess(request):
    """
    POST /api/puzzles/validate-guess/
    
    Validates a Wordle guess and returns tile colors.
    This allows frontend to show colored tiles without exposing the solution.
    
    Request body:
    {
        "puzzle_id": 1,
        "guess": "HOUSE"
    }
    
    Response:
    {
        "statuses": ["correct", "present", "absent", "correct", "correct"],
        "is_correct": true,
        "letter_statuses": {"H": "correct", "O": "present", ...}
    }
    """
    puzzle_id = request.data.get('puzzle_id')
    guess = request.data.get('guess', '').upper()
    
    if not puzzle_id or not guess:
        return Response(
            {'error': 'puzzle_id and guess are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if len(guess) != 5:
        return Response(
            {'error': 'Guess must be 5 letters'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    puzzle = get_object_or_404(Puzzle, id=puzzle_id)
    
    if puzzle.puzzle_type != 'wordle':
        return Response(
            {'error': 'This endpoint is only for Wordle puzzles'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    solution = puzzle.solution_word.upper()
    
    # Calculate tile statuses (same logic as frontend would use)
    statuses = ['absent'] * 5
    sol_chars = list(solution)
    
    # First pass: mark correct (green)
    for i in range(5):
        if guess[i] == sol_chars[i]:
            statuses[i] = 'correct'
            sol_chars[i] = ' '  # Mark as used
    
    # Second pass: mark present (yellow)
    for i in range(5):
        if statuses[i] != 'correct' and guess[i] in sol_chars:
            statuses[i] = 'present'
            sol_chars[sol_chars.index(guess[i])] = ' '  # Mark as used
    
    # Calculate letter statuses for keyboard
    letter_statuses = {}
    for i, char in enumerate(guess):
        current_status = letter_statuses.get(char, 'default')
        new_status = statuses[i]
        
        # Priority: correct > present > absent
        if new_status == 'correct':
            letter_statuses[char] = 'correct'
        elif new_status == 'present' and current_status != 'correct':
            letter_statuses[char] = 'present'
        elif new_status == 'absent' and current_status == 'default':
            letter_statuses[char] = 'absent'
    
    is_correct = guess == solution
    
    return Response({
        'statuses': statuses,
        'is_correct': is_correct,
        'letter_statuses': letter_statuses
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_wordle_guess(request):
    """
    POST /api/puzzles/validate-guess/
    Validates a Wordle guess and returns tile colors.
    """
    puzzle_id = request.data.get('puzzle_id')
    guess = request.data.get('guess', '').upper()
    
    # Validation
    if not puzzle_id:
        return Response(
            {'error': 'puzzle_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not guess:
        return Response(
            {'error': 'guess is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if len(guess) != 5:
        return Response(
            {'error': 'Guess must be exactly 5 letters'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get puzzle
    puzzle = get_object_or_404(Puzzle, id=puzzle_id)
    
    if puzzle.puzzle_type != 'wordle':
        return Response(
            {'error': 'This endpoint is only for Wordle puzzles'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    solution = puzzle.solution_word.upper()
    
    # Calculate tile statuses (Wordle algorithm)
    statuses = ['absent'] * 5
    sol_chars = list(solution)
    
    # First pass: mark correct positions (green)
    for i in range(5):
        if guess[i] == sol_chars[i]:
            statuses[i] = 'correct'
            sol_chars[i] = ' '  # Mark as used
    
    # Second pass: mark present but wrong position (yellow)
    for i in range(5):
        if statuses[i] != 'correct' and guess[i] in sol_chars:
            statuses[i] = 'present'
            sol_chars[sol_chars.index(guess[i])] = ' '  # Mark as used
    
    # Calculate keyboard letter statuses
    letter_statuses = {}
    for i, char in enumerate(guess):
        current_status = letter_statuses.get(char, 'default')
        new_status = statuses[i]
        
        # Priority: correct > present > absent
        if new_status == 'correct':
            letter_statuses[char] = 'correct'
        elif new_status == 'present' and current_status != 'correct':
            letter_statuses[char] = 'present'
        elif new_status == 'absent' and current_status == 'default':
            letter_statuses[char] = 'absent'
    
    is_correct = guess == solution
    
    return Response({
        'statuses': statuses,
        'is_correct': is_correct,
        'letter_statuses': letter_statuses
    })