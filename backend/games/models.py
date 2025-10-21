# games/models.py
from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.utils import timezone
from authentication.models import User
import json
from datetime import date, timedelta


class DailyPuzzle(models.Model):
    """Stores one puzzle per day per game type"""
    GAME_TYPES = [
        ('wordle', 'Wordle'),
        ('hangman', 'Hangman'),
        ('crossword', 'Crossword'),
    ]
    
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('hard', 'Hard'),
    ]
    
    date = models.DateField(db_index=True)
    game_type = models.CharField(max_length=20, choices=GAME_TYPES)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES)
    puzzle_data = models.JSONField(help_text="Encrypted puzzle content from AI")
    # Example structure:
    # {
    #   "word": "CRANE",
    #   "hints": ["hint1", "hint2", "hint3"],
    #   "theme": "Nature",
    #   "definition": "...",
    #   "ai_metadata": {...}
    # }
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'daily_puzzles'
        unique_together = ['date', 'game_type', 'difficulty']
        ordering = ['-date']
        indexes = [
            models.Index(fields=['date', 'game_type']),
            models.Index(fields=['is_active', 'date']),
        ]
    
    def __str__(self):
        return f"{self.game_type.title()} - {self.date} ({self.difficulty})"
    
    @classmethod
    def get_today_puzzle(cls, game_type, difficulty='easy'):
        """Get today's puzzle for a specific game"""
        today = timezone.now().date()
        return cls.objects.filter(
            date=today,
            game_type=game_type,
            difficulty=difficulty,
            is_active=True
        ).first()
    
    def get_hint(self, hint_number):
        """Get a specific hint (1, 2, or 3)"""
        hints = self.puzzle_data.get('hints', [])
        if 0 <= hint_number - 1 < len(hints):
            return hints[hint_number - 1]
        return None


class UserPuzzleAttempt(models.Model):
    """Tracks individual puzzle attempts by users"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='puzzle_attempts')
    puzzle = models.ForeignKey(DailyPuzzle, on_delete=models.CASCADE, related_name='attempts')
    
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    time_taken_seconds = models.IntegerField(null=True, blank=True, help_text="Time to complete in seconds")
    
    # Scoring
    base_score = models.IntegerField(default=0, help_text="100 for easy, 200 for hard")
    hints_used = ArrayField(
        models.IntegerField(),
        default=list,
        blank=True,
        help_text="List of hint numbers used [1, 2, 3]"
    )
    hint_penalties = models.IntegerField(default=0, help_text="Total points deducted for hints")
    bonus_points = models.IntegerField(default=0, help_text="Extra points from streaks, etc.")
    final_score = models.IntegerField(default=0, help_text="Final calculated score")
    
    # Game-specific data
    attempts_data = models.JSONField(default=dict, blank=True, help_text="Game-specific attempt data")
    # For Wordle: {"guesses": ["CRANE", "STALE", ...], "guess_count": 3}
    
    is_completed = models.BooleanField(default=False)
    is_successful = models.BooleanField(default=False, help_text="True if puzzle solved, False if gave up")
    
    class Meta:
        db_table = 'user_puzzle_attempts'
        unique_together = ['user', 'puzzle']
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['user', '-started_at']),
            models.Index(fields=['puzzle', 'is_completed']),
        ]
    
    def __str__(self):
        status = "Completed" if self.is_completed else "In Progress"
        return f"{self.user.username} - {self.puzzle} - {status}"
    
    def calculate_score(self):
        """Calculate final score based on base, penalties, and bonuses"""
        # Base score
        if self.puzzle.difficulty == 'easy':
            self.base_score = 100
        else:
            self.base_score = 200
        
        # Calculate hint penalties
        hint_cost = 20 if self.puzzle.difficulty == 'easy' else 40
        self.hint_penalties = len(self.hints_used) * hint_cost
        
        # Calculate final score (can't go below 0)
        self.final_score = max(0, self.base_score - self.hint_penalties + self.bonus_points)
        
        return self.final_score
    
    def use_hint(self, hint_number):
        """Mark a hint as used"""
        if hint_number not in self.hints_used and 1 <= hint_number <= 3:
            self.hints_used.append(hint_number)
            self.save()
            return True
        return False


class UserDailyProgress(models.Model):
    """Tracks user's daily completion status"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='daily_progress')
    date = models.DateField(db_index=True)
    
    puzzles_completed = models.IntegerField(default=0, help_text="Count of puzzles completed today")
    total_daily_score = models.IntegerField(default=0, help_text="Total points earned today")
    
    daily_completion_bonus = models.IntegerField(default=0, help_text="Bonus for completing all puzzles")
    is_complete = models.BooleanField(default=False, help_text="All 3 puzzles completed")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_daily_progress'
        unique_together = ['user', 'date']
        ordering = ['-date']
        indexes = [
            models.Index(fields=['user', '-date']),
            models.Index(fields=['date', 'is_complete']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.date} - {self.puzzles_completed}/3 puzzles"
    
    @classmethod
    def get_or_create_today(cls, user):
        """Get or create today's progress for user"""
        today = timezone.now().date()
        progress, created = cls.objects.get_or_create(
            user=user,
            date=today,
            defaults={'puzzles_completed': 0, 'total_daily_score': 0}
        )
        return progress
    
    def check_completion_bonus(self):
        """Award bonus if all 3 puzzles completed"""
        if self.puzzles_completed >= 3 and not self.is_complete:
            self.is_complete = True
            self.daily_completion_bonus = 20
            self.total_daily_score += 20
            self.save()
            
            # Also update user's total points
            self.user.total_points += 20
            self.user.save()
            
            return True
        return False


class UserStreak(models.Model):
    """Tracks user's consecutive day streaks"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='streak')
    
    current_streak = models.IntegerField(default=0, help_text="Current consecutive days")
    longest_streak = models.IntegerField(default=0, help_text="All-time longest streak")
    last_completion_date = models.DateField(null=True, blank=True)
    
    # Streak milestone bonuses
    three_day_bonus_count = models.IntegerField(default=0)
    seven_day_bonus_count = models.IntegerField(default=0)
    thirty_day_bonus_count = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_streaks'
    
    def __str__(self):
        return f"{self.user.username} - {self.current_streak} day streak"
    
    def update_streak(self):
        """Update streak when user completes daily puzzles"""
        today = timezone.now().date()
        
        if self.last_completion_date is None:
            # First time completing
            self.current_streak = 1
            self.last_completion_date = today
        elif self.last_completion_date == today:
            # Already completed today
            return self.current_streak
        elif self.last_completion_date == today - timedelta(days=1):
            # Consecutive day
            self.current_streak += 1
            self.last_completion_date = today
        else:
            # Streak broken
            self.current_streak = 1
            self.last_completion_date = today
        
        # Update longest streak
        if self.current_streak > self.longest_streak:
            self.longest_streak = self.current_streak
        
        # Award milestone bonuses
        bonus = self.check_milestone_bonus()
        
        self.save()
        return bonus
    
    def check_milestone_bonus(self):
        """Award bonus points for streak milestones"""
        bonus = 0
        
        # 3-day streak bonus (once per streak)
        if self.current_streak == 3:
            bonus = 50
            self.three_day_bonus_count += 1
            self.user.total_points += bonus
        
        # 7-day streak bonus
        elif self.current_streak == 7:
            bonus = 100
            self.seven_day_bonus_count += 1
            self.user.total_points += bonus
        
        # 30-day streak bonus
        elif self.current_streak == 30:
            bonus = 500
            self.thirty_day_bonus_count += 1
            self.user.total_points += bonus
        
        if bonus > 0:
            self.user.save()
        
        return bonus


class Leaderboard(models.Model):
    """Materialized view for leaderboards - updated periodically"""
    PERIOD_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('all_time', 'All Time'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='leaderboard_entries')
    period = models.CharField(max_length=20, choices=PERIOD_CHOICES)
    period_start = models.DateField(help_text="Start date of period")
    period_end = models.DateField(help_text="End date of period")
    
    rank = models.IntegerField(db_index=True)
    total_points = models.IntegerField(default=0)
    puzzles_completed = models.IntegerField(default=0)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'leaderboards'
        unique_together = ['user', 'period', 'period_start']
        ordering = ['period', 'rank']
        indexes = [
            models.Index(fields=['period', 'rank']),
            models.Index(fields=['period', 'period_start']),
        ]
    
    def __str__(self):
        return f"{self.period.title()} - Rank {self.rank}: {self.user.username} ({self.total_points}pts)"
    
    @classmethod
    def calculate_leaderboard(cls, period='daily'):
        """Calculate and update leaderboard for given period"""
        from django.db.models import Sum, Count
        
        today = timezone.now().date()
        
        # Determine date range based on period
        if period == 'daily':
            start_date = today
            end_date = today
        elif period == 'weekly':
            # Current week (Monday to Sunday)
            start_date = today - timedelta(days=today.weekday())
            end_date = start_date + timedelta(days=6)
        elif period == 'monthly':
            # Current month
            start_date = today.replace(day=1)
            # Last day of month
            next_month = today.replace(day=28) + timedelta(days=4)
            end_date = next_month - timedelta(days=next_month.day)
        else:  # all_time
            start_date = date(2000, 1, 1)
            end_date = today
        
        # Query user scores for period
        if period == 'all_time':
            # Use User.total_points for all-time
            user_scores = User.objects.filter(
                is_active=True
            ).values('id', 'username', 'total_points').order_by('-total_points')
        else:
            # Aggregate from daily progress
            user_scores = UserDailyProgress.objects.filter(
                date__range=[start_date, end_date]
            ).values('user').annotate(
                total_points=Sum('total_daily_score'),
                puzzles_completed=Sum('puzzles_completed')
            ).order_by('-total_points')
        
        # Delete old entries for this period
        cls.objects.filter(period=period, period_start=start_date).delete()
        
        # Create new leaderboard entries
        leaderboard_entries = []
        for rank, entry in enumerate(user_scores, start=1):
            if period == 'all_time':
                user_id = entry['id']
                points = entry['total_points']
                puzzles = 0  # Not tracked for all-time
            else:
                user_id = entry['user']
                points = entry['total_points'] or 0
                puzzles = entry['puzzles_completed'] or 0
            
            leaderboard_entries.append(cls(
                user_id=user_id,
                period=period,
                period_start=start_date,
                period_end=end_date,
                rank=rank,
                total_points=points,
                puzzles_completed=puzzles
            ))
        
        # Bulk create
        cls.objects.bulk_create(leaderboard_entries)
        
        return len(leaderboard_entries)