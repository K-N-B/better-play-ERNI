# /leaderboards/views.py
from rest_framework import generics, permissions
from django.utils import timezone
from datetime import timedelta, date
from .models import (
    DailyIndividualScore, WeeklyIndividualScore, MonthlyIndividualScore,
    DailyDepartmentScore, WeeklyDepartmentScore, MonthlyDepartmentScore
)
from users.models import User, Department # Import User/Department for All-Time
from .serializers import (
    DailyIndividualScoreSerializer, WeeklyIndividualScoreSerializer, MonthlyIndividualScoreSerializer,
    DailyDepartmentScoreSerializer, WeeklyDepartmentScoreSerializer, MonthlyDepartmentScoreSerializer,
    UserAllTimeSerializer, DepartmentAllTimeSerializer # Import All-Time serializers
)

# Helper function to get the start of the current/target week (Sunday)
def get_sunday(target_date):
    days_since_sunday = (target_date.weekday() + 1) % 7
    return target_date - timedelta(days=days_since_sunday)

class GetLeaderboardView(generics.ListAPIView):
    """
    API endpoint for fetching leaderboard data.
    Uses query parameters:
    - type ('individual' or 'department')
    - period ('daily', 'weekly', 'monthly', 'alltime')
    - date (YYYY-MM-DD, optional, for archives)
    """
    permission_classes = [permissions.IsAuthenticated]

    # Dynamically determine serializer based on type and period
    def get_serializer_class(self):
        lb_type = self.request.query_params.get('type', 'individual')
        period = self.request.query_params.get('period', 'weekly')

        if lb_type == 'individual':
            if period == 'daily': return DailyIndividualScoreSerializer
            if period == 'weekly': return WeeklyIndividualScoreSerializer
            if period == 'monthly': return MonthlyIndividualScoreSerializer
            if period == 'alltime': return UserAllTimeSerializer # Use User model serializer
        elif lb_type == 'department':
            if period == 'daily': return DailyDepartmentScoreSerializer
            if period == 'weekly': return WeeklyDepartmentScoreSerializer
            if period == 'monthly': return MonthlyDepartmentScoreSerializer
            if period == 'alltime': return DepartmentAllTimeSerializer # Use Department model serializer

        # Fallback (should ideally validate params earlier)
        return WeeklyIndividualScoreSerializer

    # Dynamically determine queryset based on type, period, and date
    def get_queryset(self):
        lb_type = self.request.query_params.get('type', 'individual')
        period = self.request.query_params.get('period', 'weekly')
        date_str = self.request.query_params.get('date', None)

        target_date = None
        if date_str:
            try:
                target_date = date.fromisoformat(date_str)
            except ValueError:
                target_date = None # Ignore invalid date format

        # --- All-Time ---
        if period == 'alltime':
            if lb_type == 'individual':
                # Order User model directly by all-time points
                return User.objects.filter(is_active=True).order_by('-total_points_alltime')
            elif lb_type == 'department':
                # Order Department model directly
                return Department.objects.all().order_by('-total_points_alltime')

        # --- Periodic Scores ---
        if lb_type == 'individual':
            if period == 'daily':
                filter_date = target_date if target_date else timezone.now().date() - timedelta(days=1) # Default to yesterday
                return DailyIndividualScore.objects.filter(date=filter_date).select_related('user')
            if period == 'weekly':
                week_start = get_sunday(target_date if target_date else timezone.now().date())
                return WeeklyIndividualScore.objects.filter(week_start_date=week_start).select_related('user')
            if period == 'monthly':
                month_start = (target_date if target_date else timezone.now().date()).replace(day=1)
                return MonthlyIndividualScore.objects.filter(month_start_date=month_start).select_related('user')

        elif lb_type == 'department':
            if period == 'daily':
                filter_date = target_date if target_date else timezone.now().date() - timedelta(days=1)
                return DailyDepartmentScore.objects.filter(date=filter_date).select_related('department')
            if period == 'weekly':
                week_start = get_sunday(target_date if target_date else timezone.now().date())
                return WeeklyDepartmentScore.objects.filter(week_start_date=week_start).select_related('department')
            if period == 'monthly':
                month_start = (target_date if target_date else timezone.now().date()).replace(day=1)
                return MonthlyDepartmentScore.objects.filter(month_start_date=month_start).select_related('department')

        # Fallback queryset (empty)
        return DailyIndividualScore.objects.none()