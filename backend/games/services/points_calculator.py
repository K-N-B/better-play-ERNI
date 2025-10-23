"""
Points calculation service for all puzzle types.

SCORING FORMULA:
Base Points = 100
Time Bonus = max(50 - (seconds / 10), 0)
Tries Penalty = (tries_used - 1) * 10
Difficulty Multiplier = 1.5x if Hard mode

Final Score = (Base + Time Bonus - Tries Penalty) * Multiplier
Max Possible: ~225 pts (Hard mode, 1 try, under 30 seconds)
"""


class PointsCalculator:
    """Calculate points awarded for puzzle completion"""
    
    # Base points per puzzle type
    BASE_POINTS = {
        'wordle': 100,
        'sudoku': 100,
        'ernigram': 100,
    }
    
    # Difficulty multipliers
    DIFFICULTY_MULTIPLIERS = {
        'easy': 1.0,
        'hard': 1.5,
    }
    
    # ============================================
    # WORDLE SCORING
    # ============================================
    @classmethod
    def calculate_wordle_points(cls, tries: int, time_ms: int, difficulty: str) -> int:
        """
        Calculate points for Wordle completion.
        
        Args:
            tries: Number of guesses used (1-6 for easy, 1-5 for hard)
            time_ms: Time taken in milliseconds
            difficulty: 'easy' or 'hard'
        
        Returns:
            Points awarded (integer)
        """
        base = cls.BASE_POINTS['wordle']
        
        # Time bonus (faster = more points)
        seconds = time_ms / 1000
        time_bonus = max(50 - (seconds / 10), 0)
        
        # Tries penalty (fewer tries = more points)
        tries_penalty = (tries - 1) * 10
        
        # Calculate raw score
        raw_score = base + time_bonus - tries_penalty
        
        # Apply difficulty multiplier
        multiplier = cls.DIFFICULTY_MULTIPLIERS.get(difficulty, 1.0)
        final_score = int(raw_score * multiplier)
        
        # Ensure minimum score of 10
        return max(final_score, 10)
    
    # ============================================
    # SUDOKU SCORING
    # ============================================
    @classmethod
    def calculate_sudoku_points(cls, time_ms: int, difficulty: str, errors: int = 0) -> int:
        """
        Calculate points for Sudoku completion.
        
        Args:
            time_ms: Time taken in milliseconds
            difficulty: 'easy' or 'hard'
            errors: Number of incorrect cells filled (if tracked)
        
        Returns:
            Points awarded (integer)
        """
        base = cls.BASE_POINTS['sudoku']
        
        # Time bonus (faster = more points, max 5 minutes for full bonus)
        seconds = time_ms / 1000
        # Full bonus if under 5 minutes, decreases linearly
        time_bonus = max(100 - (seconds / 3), 0)
        
        # Error penalty
        error_penalty = errors * 5
        
        # Calculate raw score
        raw_score = base + time_bonus - error_penalty
        
        # Apply difficulty multiplier
        multiplier = cls.DIFFICULTY_MULTIPLIERS.get(difficulty, 1.0)
        final_score = int(raw_score * multiplier)
        
        return max(final_score, 10)
    
    # ============================================
    # ERNIGRAM SCORING
    # ============================================
    @classmethod
    def calculate_ernigram_points(cls, tries: int, max_tries: int, time_ms: int, difficulty: str) -> int:
        """
        Calculate points for ERNIgram completion.
        
        Args:
            tries: Number of incorrect guesses used
            max_tries: Maximum allowed incorrect guesses
            time_ms: Time taken in milliseconds
            difficulty: 'easy' or 'hard'
        
        Returns:
            Points awarded (integer)
        """
        base = cls.BASE_POINTS['ernigram']
        
        # Attempts bonus (more remaining attempts = more points)
        remaining_attempts = max_tries - tries
        attempts_bonus = remaining_attempts * 15
        
        # Time bonus
        seconds = time_ms / 1000
        time_bonus = max(50 - (seconds / 10), 0)
        
        # Calculate raw score
        raw_score = base + attempts_bonus + time_bonus
        
        # Apply difficulty multiplier
        multiplier = cls.DIFFICULTY_MULTIPLIERS.get(difficulty, 1.0)
        final_score = int(raw_score * multiplier)
        
        return max(final_score, 10)
    
    # ============================================
    # GENERIC CALCULATOR (Auto-detects puzzle type)
    # ============================================
    @classmethod
    def calculate_points(cls, puzzle_type: str, difficulty: str, **kwargs) -> int:
        """
        Generic point calculation dispatcher.
        
        Args:
            puzzle_type: 'wordle', 'sudoku', or 'ernigram'
            difficulty: 'easy' or 'hard'
            **kwargs: Additional parameters specific to puzzle type
        
        Returns:
            Points awarded
        """
        if puzzle_type == 'wordle':
            return cls.calculate_wordle_points(
                tries=kwargs.get('tries'),
                time_ms=kwargs.get('time_ms'),
                difficulty=difficulty
            )
        
        elif puzzle_type == 'sudoku':
            return cls.calculate_sudoku_points(
                time_ms=kwargs.get('time_ms'),
                difficulty=difficulty,
                errors=kwargs.get('errors', 0)
            )
        
        elif puzzle_type == 'ernigram':
            return cls.calculate_ernigram_points(
                tries=kwargs.get('tries'),
                max_tries=kwargs.get('max_tries', 10),
                time_ms=kwargs.get('time_ms'),
                difficulty=difficulty
            )
        
        else:
            raise ValueError(f"Unknown puzzle type: {puzzle_type}")
    
    # ============================================
    # STREAK BONUSES
    # ============================================
    @staticmethod
    def get_streak_bonus(streak_count: int) -> int:
        """
        Calculate bonus points for maintaining a streak.
        
        Args:
            streak_count: Current consecutive days
        
        Returns:
            Bonus points
        """
        if streak_count >= 30:
            return 200  # 1 month streak
        elif streak_count >= 14:
            return 100  # 2 weeks
        elif streak_count >= 7:
            return 50   # 1 week
        elif streak_count >= 3:
            return 20   # 3 days
        else:
            return 0
    
    # ============================================
    # DAILY COMPLETION BONUS
    # ============================================
    @staticmethod
    def get_daily_completion_bonus(puzzles_completed: int) -> int:
        """
        Bonus for completing all daily puzzles.
        
        Args:
            puzzles_completed: Number of puzzles completed today (0-3)
        
        Returns:
            Bonus points
        """
        if puzzles_completed == 3:
            return 50  # All puzzles completed
        else:
            return 0