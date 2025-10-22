# games/views.py
from datetime import date, timedelta
from django.utils.timezone import now
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db.models import Sum, Count, Q
from datetime import datetime, timedelta
from rest_framework.permissions import IsAdminUser

from .models import (
    DailyPuzzle, UserPuzzleAttempt, UserDailyProgress, 
    UserStreak, Leaderboard
)
from .serializers import (
    DailyPuzzleSerializer, UserPuzzleAttemptSerializer,
    LeaderboardSerializer, UserProgressSerializer
)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_daily_puzzle(request, game_type):
    """
    Get today's puzzle for a specific game type
    Does NOT reveal the answer, only puzzle metadata and hints structure
    """
    difficulty = request.query_params.get('difficulty', 'easy')
    
    puzzle = DailyPuzzle.get_today_puzzle(game_type, difficulty)
    
    if not puzzle:
        return Response({
            'error': f'No puzzle available for {game_type} today'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Check if user already attempted/completed this puzzle
    existing_attempt = UserPuzzleAttempt.objects.filter(
        user=request.user,
        puzzle=puzzle
    ).first()
    
    # Prepare puzzle data (hide the answer!)
    puzzle_data = {
        'puzzle_id': puzzle.id,
        'game_type': puzzle.game_type,
        'difficulty': puzzle.difficulty,
        'date': puzzle.date,
        'theme': puzzle.puzzle_data.get('theme', 'General'),
        'hints_available': 3,
        'base_score': 100 if difficulty == 'easy' else 200,
        'hint_cost': 20 if difficulty == 'easy' else 40,
    }
    
    # If already attempted, include attempt data
    if existing_attempt:
        puzzle_data['attempt_id'] = existing_attempt.id
        puzzle_data['is_completed'] = existing_attempt.is_completed
        puzzle_data['hints_used'] = existing_attempt.hints_used
        puzzle_data['current_score'] = existing_attempt.final_score
        
        # If completed, reveal the answer
        if existing_attempt.is_completed:
            puzzle_data['answer'] = puzzle.puzzle_data['word']
            puzzle_data['definition'] = puzzle.puzzle_data.get('definition')
    
    return Response(puzzle_data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_puzzle(request, puzzle_id):
    """
    Start a new puzzle attempt
    Creates UserPuzzleAttempt record
    """
    try:
        puzzle = DailyPuzzle.objects.get(id=puzzle_id, is_active=True)
    except DailyPuzzle.DoesNotExist:
        return Response({
            'error': 'Puzzle not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Check if already attempted
    existing_attempt = UserPuzzleAttempt.objects.filter(
        user=request.user,
        puzzle=puzzle
    ).first()
    
    if existing_attempt:
        return Response({
            'error': 'Puzzle already started',
            'attempt_id': existing_attempt.id,
            'is_completed': existing_attempt.is_completed
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Create new attempt
    attempt = UserPuzzleAttempt.objects.create(
        user=request.user,
        puzzle=puzzle,
        base_score=100 if puzzle.difficulty == 'easy' else 200
    )
    
    return Response({
        'attempt_id': attempt.id,
        'puzzle_id': puzzle.id,
        'started_at': attempt.started_at,
        'base_score': attempt.base_score
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_guess(request, attempt_id):
    """
    Submit a guess for Wordle
    Returns feedback without revealing if guess is completely correct
    """
    try:
        attempt = UserPuzzleAttempt.objects.get(
            id=attempt_id,
            user=request.user
        )
    except UserPuzzleAttempt.DoesNotExist:
        return Response({
            'error': 'Attempt not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    if attempt.is_completed:
        return Response({
            'error': 'Puzzle already completed'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    guess = request.data.get('guess', '').upper()
    
    if len(guess) != 5:
        return Response({
            'error': 'Guess must be 5 letters'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Get the answer
    answer = attempt.puzzle.puzzle_data['word'].upper()
    
    # Calculate feedback
    feedback = []
    for i, letter in enumerate(guess):
        if letter == answer[i]:
            feedback.append('correct')
        elif letter in answer:
            feedback.append('present')
        else:
            feedback.append('absent')
    
    # Store guess in attempts_data
    if 'guesses' not in attempt.attempts_data:
        attempt.attempts_data['guesses'] = []
    
    attempt.attempts_data['guesses'].append({
        'word': guess,
        'feedback': feedback
    })
    
    # Check if won
    is_correct = guess == answer
    guess_count = len(attempt.attempts_data['guesses'])
    
    # Save attempt
    attempt.save()
    
    response_data = {
        'guess': guess,
        'feedback': feedback,
        'guess_number': guess_count,
        'is_correct': is_correct
    }
    
    # If won or max guesses reached, complete the puzzle
    if is_correct or guess_count >= 6:
        attempt.is_completed = True
        attempt.is_successful = is_correct
        attempt.completed_at = timezone.now()
        
        # Calculate time taken
        time_delta = attempt.completed_at - attempt.started_at
        attempt.time_taken_seconds = int(time_delta.total_seconds())
        
        # Calculate final score
        if is_correct:
            attempt.calculate_score()
        else:
            # Failed puzzle gets minimal points
            attempt.final_score = 10
        
        attempt.save()
        
        # Update user's total points
        request.user.total_points += attempt.final_score
        request.user.save()
        
        # Update daily progress
        daily_progress = UserDailyProgress.get_or_create_today(request.user)
        daily_progress.puzzles_completed += 1
        daily_progress.total_daily_score += attempt.final_score
        daily_progress.save()
        
        # Check for daily completion bonus (all 3 puzzles done)
        daily_progress.check_completion_bonus()
        
        # Update streak
        streak, created = UserStreak.objects.get_or_create(user=request.user)
        streak_bonus = streak.update_streak()
        
        response_data.update({
            'completed': True,
            'successful': is_correct,
            'final_score': attempt.final_score,
            'time_taken': attempt.time_taken_seconds,
            'streak_bonus': streak_bonus,
            'current_streak': streak.current_streak,
            'answer': answer,
            'definition': attempt.puzzle.puzzle_data.get('definition')
        })
    
    return Response(response_data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_hint(request, attempt_id):
    """
    Request a hint for the puzzle
    Deducts points and returns the hint
    """
    try:
        attempt = UserPuzzleAttempt.objects.get(
            id=attempt_id,
            user=request.user
        )
    except UserPuzzleAttempt.DoesNotExist:
        return Response({
            'error': 'Attempt not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    if attempt.is_completed:
        return Response({
            'error': 'Puzzle already completed'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check how many hints already used
    hints_used_count = len(attempt.hints_used)
    
    if hints_used_count >= 3:
        return Response({
            'error': 'All hints already used'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Get next hint number
    next_hint_number = hints_used_count + 1
    
    # Get the hint from puzzle data
    hint_text = attempt.puzzle.get_hint(next_hint_number)
    
    if not hint_text:
        return Response({
            'error': 'Hint not available'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # Mark hint as used
    attempt.use_hint(next_hint_number)
    
    # Recalculate score
    attempt.calculate_score()
    attempt.save()
    
    return Response({
        'hint': hint_text,
        'hint_number': next_hint_number,
        'hints_remaining': 3 - next_hint_number,
        'current_score': attempt.final_score,
        'hint_cost': 20 if attempt.puzzle.difficulty == 'easy' else 40
    })

from rest_framework.permissions import AllowAny

@api_view(['GET'])
@permission_classes([AllowAny]) 
def get_leaderboard(request, period):
    """
    Get leaderboard for a specified period (daily, weekly, monthly, all_time)
    Returns data formatted for the frontend.
    """

    if period not in ['daily', 'weekly', 'monthly', 'all_time']:
        return Response({
            'error': 'Invalid period. Use: daily, weekly, monthly, or all_time'
        }, status=status.HTTP_400_BAD_REQUEST)

    today = now().date()

    #  Compute the correct start date for each period
    if period == 'daily':
        start_date = today
    elif period == 'weekly':
        start_date = today - timedelta(days=today.weekday())  # Monday as start of week
    elif period == 'monthly':
        start_date = date(today.year, today.month, 1)  # first day of current month
    else:  # all_time
        start_date = None

    # 🔍 Fetch leaderboard entries
    leaderboard_entries = (
        Leaderboard.objects
        .filter(period=period)
        .select_related('user')
        .order_by('-total_points')[:100]
    )

    # 🧩 Transform data to frontend format
    leaderboard_data = []
    for entry in leaderboard_entries:
        base_data = {
            "user": {
                "id": entry.user.id,
                "username": entry.user.username,
            },
            "score": entry.total_points,
        }

        # Add the appropriate start date field
        if period == 'daily':
            base_data["date"] = start_date.isoformat()
        elif period == 'weekly':
            base_data["week_start_date"] = start_date.isoformat()
        elif period == 'monthly':
            base_data["month_start_date"] = start_date.isoformat()

        leaderboard_data.append(base_data)

    # ✅ Response format matches frontend expectations
    return Response({
        "period": period,
        "leaderboard": leaderboard_data,
        "mode": "individual",  # constant for now
        "updated_at": today.isoformat()
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_top3(request, period):
    """
    Get top 3 players for podium display
    """
    if period not in ['daily', 'weekly', 'monthly', 'all_time']:
        return Response({
            'error': 'Invalid period'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    top3 = Leaderboard.objects.filter(
        period=period,
        rank__lte=3
    ).select_related('user').order_by('rank')
    
    podium = []
    for entry in top3:
        podium.append({
            'rank': entry.rank,
            'username': entry.user.username,
            'display_name': entry.user.display_name or entry.user.username,
            'total_points': entry.total_points
        })
    
    return Response({
        'period': period,
        'top3': podium
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_dashboard(request):
    """
    Get complete dashboard data for user
    """
    user = request.user
    today = timezone.now().date()
    
    # Get today's progress
    daily_progress = UserDailyProgress.get_or_create_today(user)
    
    # Get streak info
    streak, _ = UserStreak.objects.get_or_create(user=user)
    
    # Get today's puzzle completion status
    today_puzzles = DailyPuzzle.objects.filter(
        date=today,
        is_active=True
    ).values_list('id', 'game_type', 'difficulty')
    
    puzzle_status = []
    for puzzle_id, game_type, difficulty in today_puzzles:
        attempt = UserPuzzleAttempt.objects.filter(
            user=user,
            puzzle_id=puzzle_id
        ).first()
        
        puzzle_status.append({
            'game_type': game_type,
            'difficulty': difficulty,
            'completed': attempt.is_completed if attempt else False,
            'score': attempt.final_score if attempt and attempt.is_completed else 0,
            'puzzle_id': puzzle_id
        })
    
    # Get recent scores (last 7 days)
    week_ago = today - timedelta(days=7)
    recent_progress = UserDailyProgress.objects.filter(
        user=user,
        date__gte=week_ago
    ).order_by('date').values('date', 'total_daily_score', 'puzzles_completed')
    
    # Get user's current ranks
    ranks = {}
    for period in ['daily', 'weekly', 'monthly', 'all_time']:
        entry = Leaderboard.objects.filter(
            user=user,
            period=period
        ).first()
        ranks[period] = {
            'rank': entry.rank if entry else None,
            'points': entry.total_points if entry else 0
        }
    
    return Response({
        'user': {
            'username': user.username,
            'display_name': user.display_name or user.username,
            'total_points': user.total_points
        },
        'today': {
            'puzzles_completed': daily_progress.puzzles_completed,
            'total_score': daily_progress.total_daily_score,
            'is_complete': daily_progress.is_complete,
            'puzzles': puzzle_status
        },
        'streak': {
            'current': streak.current_streak,
            'longest': streak.longest_streak,
            'last_completion': streak.last_completion_date
        },
        'recent_activity': list(recent_progress),
        'ranks': ranks
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_stats(request):
    """
    Get detailed user statistics
    """
    user = request.user
    
    # Total puzzles completed
    total_completed = UserPuzzleAttempt.objects.filter(
        user=user,
        is_completed=True
    ).count()
    
    # Success rate
    total_attempts = UserPuzzleAttempt.objects.filter(user=user).count()
    successful = UserPuzzleAttempt.objects.filter(
        user=user,
        is_successful=True
    ).count()
    success_rate = (successful / total_attempts * 100) if total_attempts > 0 else 0
    
    # Average score
    avg_score = UserPuzzleAttempt.objects.filter(
        user=user,
        is_completed=True
    ).aggregate(avg=Sum('final_score'))['avg'] or 0
    
    # Average time
    avg_time = UserPuzzleAttempt.objects.filter(
        user=user,
        is_completed=True,
        time_taken_seconds__isnull=False
    ).aggregate(avg=Sum('time_taken_seconds'))['avg'] or 0
    
    # By game type
    by_game = UserPuzzleAttempt.objects.filter(
        user=user,
        is_completed=True
    ).values('puzzle__game_type').annotate(
        count=Count('id'),
        total_score=Sum('final_score')
    )
    
    # Streak info
    streak = UserStreak.objects.filter(user=user).first()
    
    return Response({
        'total_puzzles_completed': total_completed,
        'total_attempts': total_attempts,
        'success_rate': round(success_rate, 1),
        'average_score': round(avg_score, 1),
        'average_time_seconds': round(avg_time, 1),
        'by_game_type': list(by_game),
        'streak': {
            'current': streak.current_streak if streak else 0,
            'longest': streak.longest_streak if streak else 0,
            'three_day_bonuses': streak.three_day_bonus_count if streak else 0,
            'seven_day_bonuses': streak.seven_day_bonus_count if streak else 0,
            'thirty_day_bonuses': streak.thirty_day_bonus_count if streak else 0
        }
    })