from datetime import timedelta
from django.utils import timezone
from django.db import transaction
from django.db.models import Sum
from ..models import LeaderboardCache, Submission
from django.contrib.auth import get_user_model

User = get_user_model()


class LeaderboardService:
    """Service for calculating and caching leaderboard rankings"""
    
    @staticmethod
    def calculate_daily_leaderboard():
        """
        Calculate daily leaderboard (today's points).
        
        Returns:
            List of (user, score) tuples
        """
        today = timezone.now().date()
        
        # Get all submissions from today
        leaderboard = Submission.objects.filter(
            created_at__date=today
        ).values('user').annotate(
            total_score=Sum('points_awarded')
        ).order_by('-total_score')
        
        return [(item['user'], item['total_score']) for item in leaderboard]
    
    @staticmethod
    def calculate_weekly_leaderboard():
        """
        Calculate weekly leaderboard (this week's points, Monday-Sunday).
        
        Returns:
            List of (user, score) tuples
        """
        today = timezone.now().date()
        # Get Monday of current week
        start_of_week = today - timedelta(days=today.weekday())
        
        leaderboard = Submission.objects.filter(
            created_at__date__gte=start_of_week
        ).values('user').annotate(
            total_score=Sum('points_awarded')
        ).order_by('-total_score')
        
        return [(item['user'], item['total_score']) for item in leaderboard]
    
    @staticmethod
    def calculate_monthly_leaderboard():
        """
        Calculate monthly leaderboard (this month's points).
        
        Returns:
            List of (user, score) tuples
        """
        today = timezone.now().date()
        start_of_month = today.replace(day=1)
        
        leaderboard = Submission.objects.filter(
            created_at__date__gte=start_of_month
        ).values('user').annotate(
            total_score=Sum('points_awarded')
        ).order_by('-total_score')
        
        return [(item['user'], item['total_score']) for item in leaderboard]
    
    @staticmethod
    def calculate_alltime_leaderboard():
        """
        Calculate all-time leaderboard.
        Can use denormalized total_points_alltime for faster queries.
        
        Returns:
            List of (user, score) tuples
        """
        users = User.objects.filter(
            total_points_alltime__gt=0
        ).order_by('-total_points_alltime').values_list('id', 'total_points_alltime')
        
        return list(users)
    
    @classmethod
    def refresh_all_leaderboards(cls):
        """
        Recalculate and cache all leaderboard periods.
        Should run periodically (every 5-10 minutes or after each submission).
        
        Returns:
            Dictionary with counts of entries updated per period
        """
        periods = {
            'daily': cls.calculate_daily_leaderboard,
            'weekly': cls.calculate_weekly_leaderboard,
            'monthly': cls.calculate_monthly_leaderboard,
            'alltime': cls.calculate_alltime_leaderboard,
        }
        
        results = {}
        
        with transaction.atomic():
            for period_name, calculator_func in periods.items():
                # Get rankings
                rankings = calculator_func()
                
                # Clear old cache for this period
                LeaderboardCache.objects.filter(period=period_name).delete()
                
                # Create new cache entries
                cache_entries = []
                for rank, (user_id, score) in enumerate(rankings, start=1):
                    cache_entries.append(LeaderboardCache(
                        period=period_name,
                        user_id=user_id,
                        rank=rank,
                        score=score
                    ))
                
                # Bulk create
                LeaderboardCache.objects.bulk_create(cache_entries)
                results[period_name] = len(cache_entries)
        
        return results
    
    @staticmethod
    def get_leaderboard(period: str, limit: int = 100):
        """
        Get cached leaderboard for a specific period.
        
        Args:
            period: 'daily', 'weekly', 'monthly', or 'alltime'
            limit: Maximum number of entries to return
        
        Returns:
            QuerySet of LeaderboardCache entries
        """
        return LeaderboardCache.objects.filter(
            period=period
        ).select_related('user').order_by('rank')[:limit]
    
    @staticmethod
    def get_user_rank(user, period: str):
        """
        Get a specific user's rank for a period.
        
        Args:
            user: User instance
            period: Leaderboard period
        
        Returns:
            LeaderboardCache entry or None
        """
        try:
            return LeaderboardCache.objects.get(user=user, period=period)
        except LeaderboardCache.DoesNotExist:
            return None
    
    @staticmethod
    def update_user_points(user, points_to_add: int):
        """
        Update user's denormalized point totals.
        Called after each submission.
        
        Args:
            user: User instance
            points_to_add: Points from latest submission
        """
        user.total_points_daily += points_to_add
        user.total_points_weekly += points_to_add
        user.total_points_monthly += points_to_add
        user.total_points_alltime += points_to_add
        user.save(update_fields=[
            'total_points_daily',
            'total_points_weekly',
            'total_points_monthly',
            'total_points_alltime'
        ])
    
    @staticmethod
    def reset_daily_points():
        """
        Reset daily points for all users.
        Runs at 6 AM daily.
        """
        User.objects.all().update(total_points_daily=0)
    
    @staticmethod
    def reset_weekly_points():
        """
        Reset weekly points for all users.
        Runs every Monday at 6 AM.
        """
        User.objects.all().update(total_points_weekly=0)
    
    @staticmethod
    def reset_monthly_points():
        """
        Reset monthly points for all users.
        Runs on 1st of each month at 6 AM.
        """
        User.objects.all().update(total_points_monthly=0)