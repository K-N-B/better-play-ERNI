# leaderboards/services.py
from django.db.models import Sum, F
from django.db import transaction
from datetime import date, timedelta
from .models import (
    DailyIndividualScore, WeeklyIndividualScore, MonthlyIndividualScore,
    DailyDepartmentScore, WeeklyDepartmentScore, MonthlyDepartmentScore
)
from gameplay.models import Submission
from users.models import User, Department


def get_week_start(target_date: date) -> date:
    """Get Monday of the week containing target_date"""
    days_since_monday = target_date.weekday()  # Monday = 0
    return target_date - timedelta(days=days_since_monday)


def get_month_start(target_date: date) -> date:
    """Get first day of the month containing target_date"""
    return target_date.replace(day=1)


class LeaderboardAggregator:
    """Service for aggregating scores into leaderboards"""
    
    @staticmethod
    @transaction.atomic
    def update_daily_scores(submission_date: date):
        """
        Aggregate all submissions for a specific date into daily leaderboards.
        Called after each submission or by scheduled task.
        """
        print(f"[LeaderboardAggregator] Updating daily scores for {submission_date}...")
        
        # --- Individual Daily Scores ---
        submissions = Submission.objects.filter(puzzle_date=submission_date)
        
        # Group by user and sum points
        user_scores = submissions.values('user').annotate(
            total_score=Sum('points_awarded')
        )
        
        for user_score in user_scores:
            user_id = user_score['user']
            score = user_score['total_score']
            
            DailyIndividualScore.objects.update_or_create(
                user_id=user_id,
                date=submission_date,
                defaults={'score': score}
            )
        
        print(f"  ✓ Updated {len(user_scores)} individual daily scores")
        
        # --- Department Daily Scores ---
        # Aggregate all user scores by department
        department_submissions = submissions.select_related('user__department').exclude(
            user__department__isnull=True
        )
        
        dept_scores = {}
        for submission in department_submissions:
            dept_id = submission.user.department.id
            if dept_id not in dept_scores:
                dept_scores[dept_id] = 0
            dept_scores[dept_id] += submission.points_awarded
        
        for dept_id, score in dept_scores.items():
            DailyDepartmentScore.objects.update_or_create(
                department_id=dept_id,
                date=submission_date,
                defaults={'score': score}
            )
            
            # Also update department's all-time total
            dept = Department.objects.get(id=dept_id)
            dept.total_points_alltime = F('total_points_alltime') + 0  # Recalculate
            dept.save()
        
        print(f"  ✓ Updated {len(dept_scores)} department daily scores")
    
    @staticmethod
    @transaction.atomic
    def update_weekly_scores(week_start: date):
        """
        Aggregate daily scores for a week into weekly leaderboards.
        Week starts on Monday.
        """
        week_end = week_start + timedelta(days=6)  # Sunday
        print(f"[LeaderboardAggregator] Updating weekly scores for {week_start} to {week_end}...")
        
        # --- Individual Weekly Scores ---
        daily_scores = DailyIndividualScore.objects.filter(
            date__gte=week_start,
            date__lte=week_end
        )
        
        user_weekly_scores = daily_scores.values('user').annotate(
            total_score=Sum('score')
        )
        
        for user_score in user_weekly_scores:
            WeeklyIndividualScore.objects.update_or_create(
                user_id=user_score['user'],
                week_start_date=week_start,
                defaults={'score': user_score['total_score']}
            )
        
        print(f"  ✓ Updated {len(user_weekly_scores)} individual weekly scores")
        
        # --- Department Weekly Scores ---
        dept_daily_scores = DailyDepartmentScore.objects.filter(
            date__gte=week_start,
            date__lte=week_end
        )
        
        dept_weekly_scores = dept_daily_scores.values('department').annotate(
            total_score=Sum('score')
        )
        
        for dept_score in dept_weekly_scores:
            WeeklyDepartmentScore.objects.update_or_create(
                department_id=dept_score['department'],
                week_start_date=week_start,
                defaults={'score': dept_score['total_score']}
            )
        
        print(f"  ✓ Updated {len(dept_weekly_scores)} department weekly scores")
    
    @staticmethod
    @transaction.atomic
    def update_monthly_scores(month_start: date):
        """
        Aggregate daily scores for a month into monthly leaderboards.
        """
        # Get last day of the month
        if month_start.month == 12:
            next_month = month_start.replace(year=month_start.year + 1, month=1, day=1)
        else:
            next_month = month_start.replace(month=month_start.month + 1, day=1)
        month_end = next_month - timedelta(days=1)
        
        print(f"[LeaderboardAggregator] Updating monthly scores for {month_start} to {month_end}...")
        
        # --- Individual Monthly Scores ---
        daily_scores = DailyIndividualScore.objects.filter(
            date__gte=month_start,
            date__lte=month_end
        )
        
        user_monthly_scores = daily_scores.values('user').annotate(
            total_score=Sum('score')
        )
        
        for user_score in user_monthly_scores:
            MonthlyIndividualScore.objects.update_or_create(
                user_id=user_score['user'],
                month_start_date=month_start,
                defaults={'score': user_score['total_score']}
            )
        
        print(f"  ✓ Updated {len(user_monthly_scores)} individual monthly scores")
        
        # --- Department Monthly Scores ---
        dept_daily_scores = DailyDepartmentScore.objects.filter(
            date__gte=month_start,
            date__lte=month_end
        )
        
        dept_monthly_scores = dept_daily_scores.values('department').annotate(
            total_score=Sum('score')
        )
        
        for dept_score in dept_monthly_scores:
            MonthlyDepartmentScore.objects.update_or_create(
                department_id=dept_score['department'],
                month_start_date=month_start,
                defaults={'score': dept_score['total_score']}
            )
        
        print(f"  ✓ Updated {len(dept_monthly_scores)} department monthly scores")
    
    @staticmethod
    def update_all_for_date(submission_date: date):
        """
        Convenience method to update all leaderboards for a given date.
        Called after each submission.
        """
        week_start = get_week_start(submission_date)
        month_start = get_month_start(submission_date)
        
        LeaderboardAggregator.update_daily_scores(submission_date)
        LeaderboardAggregator.update_weekly_scores(week_start)
        LeaderboardAggregator.update_monthly_scores(month_start)