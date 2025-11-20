# gameplay/scoring_utils.py

def calculate_speed_bonus(time_spent_ms: int, max_time_ms: int) -> int:
    """Calculates tiered speed bonus points."""
    if max_time_ms <= 0 or time_spent_ms < 0:
        return 0

    time_ratio = time_spent_ms / max_time_ms

    if time_ratio <= 0.25:
        return 100
    elif time_ratio <= 0.50:
        return 50
    elif time_ratio <= 0.75:
        return 25
    elif time_ratio <= 1.0:
        return 10  
    else:
        return 0