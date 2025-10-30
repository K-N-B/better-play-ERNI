# gameplay/scoring.py
from datetime import date, timedelta
from django.utils import timezone
from users.models import User

class WordleScorer:
    """Calculates scores for Wordle puzzles"""
    
    # Base points by difficulty
    BASE_POINTS = {
        'easy': 100,
        'hard': 200,
    }
    
    # Maximum guesses allowed
    MAX_GUESSES = {
        'easy': 6,
        'hard': 4,
    }
    
    # Points per remaining guess
    GUESS_BONUS = 20
    
    # Time bonus (points per second under threshold)
    TIME_BONUS_THRESHOLD = 120  # 2 minutes
    TIME_BONUS_PER_SECOND = 1
    
    # Streak bonus
    STREAK_BONUS_PER_DAY = 10
    
    @classmethod
    def calculate_score(cls, difficulty: str, tries: int, time_taken_ms: int, user: User) -> int:
        """
        Calculate total score for a Wordle submission.
        
        Args:
            difficulty: 'easy' or 'hard'
            tries: Number of guesses used
            time_taken_ms: Time in milliseconds
            user: User instance (for streak bonus)
        
        Returns:
            Total points awarded
        """
        # 1. Base points
        base = cls.BASE_POINTS.get(difficulty, 100)
        
        # 2. Guess bonus (remaining guesses)
        max_guesses = cls.MAX_GUESSES.get(difficulty, 6)
        remaining_guesses = max(0, max_guesses - tries)
        guess_bonus = remaining_guesses * cls.GUESS_BONUS
        
        # 3. Time bonus (faster = more points)
        time_seconds = time_taken_ms / 1000
        if time_seconds < cls.TIME_BONUS_THRESHOLD:
            time_bonus = int((cls.TIME_BONUS_THRESHOLD - time_seconds) * cls.TIME_BONUS_PER_SECOND)
            time_bonus = max(0, time_bonus)  # Can't be negative
        else:
            time_bonus = 0
        
        # 4. Streak bonus
        streak_bonus = user.current_streak_count * cls.STREAK_BONUS_PER_DAY
        
        # Total
        total = base + guess_bonus + time_bonus + streak_bonus
        
        return max(0, total)  # Never negative
    
    @classmethod
    def update_user_streak(cls, user: User, puzzle_date: date) -> tuple[int, bool]:
        """
        Update user's streak based on submission.
        
        Returns:
            (current_streak, is_new_record)
        """
        from gameplay.models import Submission
        
        # Get user's last submission before today
        last_submission = Submission.objects.filter(
            user=user,
            puzzle_date__lt=puzzle_date
        ).order_by('-puzzle_date').first()
        
        if last_submission:
            last_date = last_submission.puzzle_date
            days_diff = (puzzle_date - last_date).days
            
            if days_diff == 1:
                # Consecutive day - increment streak
                user.current_streak_count += 1
            elif days_diff > 1:
                # Streak broken - reset to 1
                user.current_streak_count = 1
            # If days_diff == 0, it's same day (shouldn't happen with unique constraint)
        else:
            # First submission ever
            user.current_streak_count = 1
        
        # Check if new max streak
        is_new_record = False
        if user.current_streak_count > user.max_streak_count:
            user.max_streak_count = user.current_streak_count
            is_new_record = True
        
        user.save(update_fields=['current_streak_count', 'max_streak_count'])
        
        return user.current_streak_count, is_new_record