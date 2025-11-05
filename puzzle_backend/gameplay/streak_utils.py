# gameplay/streak_utils.py

from django.utils import timezone
from datetime import timedelta, time
from games.utils.timezone_helpers import get_local_now, MANILA_TZ

def update_daily_activity_streak(user):
    """
    Updates the user's streak based on the current submission date.
    Returns True if the streak was reset or incremented, False if it was a same-day submission.
    """
    # 1. Determine the effective "Streak Day" (Starts at 6 AM Manila Time)
    now_manila = get_local_now("Asia/Manila")
    
    # Define the 6 AM cutoff time
    CUTOFF_TIME = time(6, 0, 0) # 6 AM
    
    # If current time is BEFORE 6 AM, the streak counts toward the previous calendar day.
    if now_manila.time() < CUTOFF_TIME:
        effective_today = now_manila.date() - timedelta(days=1)
    else:
        # If current time is 6 AM or later, the streak counts toward the current calendar day.
        effective_today = now_manila.date()
        
    effective_yesterday = effective_today - timedelta(days=1)
    
    # 2. Retrieve last active date (in Manila's calendar date)
    # Convert last_active (stored in UTC) to the Manila calendar date it falls on.
    last_active_date = None
    if user.last_active:
        last_active_date = user.last_active.astimezone(MANILA_TZ).date()

    streak_changed = False
    
    # --- The Core Logic Remains the Same, but uses effective_today/yesterday ---
    
    # Case 1: First activity ever or streak was previously broken (missed day)
    if last_active_date is None or last_active_date < effective_yesterday:
        user.current_streak_count = 1
        streak_changed = True
        
    # Case 2: Streak Continuation (First submission of a new consecutive streak day)
    elif last_active_date == effective_yesterday:
        user.current_streak_count += 1
        streak_changed = True
            
    # Case 3: Same Streak Day Submission (Do nothing, streak already counted today)
    elif last_active_date == effective_today:
        return False
        
    # 3. Finalize and Save
    if streak_changed or last_active_date is None or last_active_date != effective_today:
        # Save the current UTC timestamp
        user.last_active = timezone.now() 
        user.max_streak_count = max(user.max_streak_count, user.current_streak_count)
        
        user.save(
            update_fields=['current_streak_count', 'max_streak_count', 'last_active']
        )
        return True
        
    return False