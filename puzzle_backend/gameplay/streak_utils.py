# gameplay/streak_utils.py

from django.utils import timezone
from datetime import timedelta

def update_daily_activity_streak(user):
    """
    Updates the user's streak based on the current submission date.
    Returns True if the streak was reset or incremented, False if it was a same-day submission.
    """
    now = timezone.now()
    today = now.date()
    yesterday = today - timedelta(days=1)
    
    # 1. Check Previous Activity Date (Use .date() for calendar day comparison)
    # Ensure last_active is treated as a date object, or None if it hasn't been set.
    last_active_date = user.last_active.date() if user.last_active else None
    
    streak_changed = False

    # Case 1: First activity ever or streak was previously broken (missed day)
    if last_active_date is None or last_active_date < yesterday:
        user.current_streak_count = 1
        streak_changed = True
        
    # Case 2: Streak Continuation (First submission of a new consecutive day)
    elif last_active_date == yesterday:
        # Crucial check: Ensure the last_active timestamp isn't ALREADY from today 
        # (even if the date logic missed it).
        if user.last_active.date() != today:
            user.current_streak_count += 1
            streak_changed = True
            
    # Case 3: Same Day Submission (Do nothing, streak already counted today)
    elif last_active_date == today:
        # Streak logic already fulfilled for today.
        return False
        
    # 2. Finalize and Save (Only save if logic determines a change or if we pass the same-day check)
    if streak_changed or last_active_date is None or last_active_date != today:
        user.last_active = now # Set to current timestamp
        user.max_streak_count = max(user.max_streak_count, user.current_streak_count)
        
        # Save only the necessary fields for efficiency
        user.save(
            update_fields=['current_streak_count', 'max_streak_count', 'last_active']
        )
        return True # Streak was started, reset, or incremented
    
    return False # Default return for Case 3 (Same day submission)