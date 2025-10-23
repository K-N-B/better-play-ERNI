from datetime import timedelta
from django.utils import timezone
from django.db import transaction
from ..models import Streak, DailyCompletionStatus


class StreakService:
    """Service for managing user streaks"""
    
    @staticmethod
    def update_streak(user, completion_date):
        """
        Update user's streak after completing all daily puzzles.
        
        Args:
            user: User instance
            completion_date: Date of completion (date object)
        
        Returns:
            Updated Streak instance
        """
        with transaction.atomic():
            # Get or create streak record
            streak, created = Streak.objects.get_or_create(user=user)
            
            if created or not streak.last_completion_date:
                # First completion ever
                streak.current_streak_count = 1
                streak.max_streak_count = 1
                streak.last_completion_date = completion_date
                streak.save()
                
                # Update user model
                user.current_streak_count = 1
                user.max_streak_count = 1
                user.save(update_fields=['current_streak_count', 'max_streak_count'])
                
                return streak
            
            # Check if this is consecutive
            expected_date = streak.last_completion_date + timedelta(days=1)
            
            if completion_date == expected_date:
                # ✅ Consecutive day - increment streak
                streak.current_streak_count += 1
                
                # Update max streak if needed
                if streak.current_streak_count > streak.max_streak_count:
                    streak.max_streak_count = streak.current_streak_count
                
                streak.last_completion_date = completion_date
                streak.save()
                
                # Update user model
                user.current_streak_count = streak.current_streak_count
                user.max_streak_count = streak.max_streak_count
                user.save(update_fields=['current_streak_count', 'max_streak_count'])
            
            elif completion_date == streak.last_completion_date:
                # Same day - no change (already completed)
                pass
            
            else:
                # ❌ Streak broken - reset to 1
                streak.current_streak_count = 1
                streak.last_completion_date = completion_date
                streak.save()
                
                # Update user model (max streak stays the same)
                user.current_streak_count = 1
                user.save(update_fields=['current_streak_count'])
            
            return streak
    
    @staticmethod
    def check_and_break_streaks():
        """
        Check all users and break streaks if they missed yesterday.
        Should run daily at 6 AM.
        
        Returns:
            Number of streaks broken
        """
        yesterday = timezone.now().date() - timedelta(days=1)
        streaks_broken = 0
        
        # Get all active streaks
        active_streaks = Streak.objects.filter(current_streak_count__gt=0)
        
        for streak in active_streaks:
            # Check if user completed all puzzles yesterday
            try:
                daily_status = DailyCompletionStatus.objects.get(
                    user=streak.user,
                    completion_date=yesterday
                )
                
                if not daily_status.is_all_completed():
                    # User didn't complete all puzzles - break streak
                    streak.current_streak_count = 0
                    streak.save()
                    
                    # Update user model
                    streak.user.current_streak_count = 0
                    streak.user.save(update_fields=['current_streak_count'])
                    
                    streaks_broken += 1
            
            except DailyCompletionStatus.DoesNotExist:
                # No record = didn't play at all - break streak
                streak.current_streak_count = 0
                streak.save()
                
                streak.user.current_streak_count = 0
                streak.user.save(update_fields=['current_streak_count'])
                
                streaks_broken += 1
        
        return streaks_broken
    
    @staticmethod
    def get_streak_stats(user):
        """
        Get comprehensive streak statistics for a user.
        
        Args:
            user: User instance
        
        Returns:
            Dictionary with streak information
        """
        try:
            streak = Streak.objects.get(user=user)
            
            return {
                'current_streak': streak.current_streak_count,
                'max_streak': streak.max_streak_count,
                'last_completion': streak.last_completion_date,
                'is_active': streak.current_streak_count > 0,
            }
        
        except Streak.DoesNotExist:
            return {
                'current_streak': 0,
                'max_streak': 0,
                'last_completion': None,
                'is_active': False,
            }