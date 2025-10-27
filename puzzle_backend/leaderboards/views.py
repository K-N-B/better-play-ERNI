# leaderboards/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from datetime import date, timedelta
from django.utils import timezone

from .models import (
    DailyIndividualScore, WeeklyIndividualScore, MonthlyIndividualScore,
    DailyDepartmentScore, WeeklyDepartmentScore, MonthlyDepartmentScore
)
from .serializers import (
    DailyIndividualScoreSerializer, WeeklyIndividualScoreSerializer, 
    MonthlyIndividualScoreSerializer,
    DailyDepartmentScoreSerializer, WeeklyDepartmentScoreSerializer,
    MonthlyDepartmentScoreSerializer
)
from .services import get_week_start, get_month_start


class GetLeaderboardView(APIView):
    """
    GET /api/leaderboard/?scope=individual&period=daily&date=2025-01-15
    GET /api/leaderboard/?scope=department&period=weekly
    GET /api/leaderboard/?scope=individual&period=monthly&date=2025-01-01
    
    Query Parameters:
    - scope: 'individual' or 'department' (required)
    - period: 'daily', 'weekly', or 'monthly' (required)
    - date: YYYY-MM-DD format (optional, defaults to today)
    - limit: number of top entries to return (optional, defaults to 100)
    """
    
    def get(self, request):
        # Parse query parameters
        scope = request.query_params.get('scope')
        period = request.query_params.get('period')
        date_str = request.query_params.get('date')
        limit = request.query_params.get('limit', 100)
        
        # Validate required parameters
        if not scope or scope not in ['individual', 'department']:
            return Response(
                {'error': "scope parameter is required and must be 'individual' or 'department'"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not period or period not in ['daily', 'weekly', 'monthly']:
            return Response(
                {'error': "period parameter is required and must be 'daily', 'weekly', or 'monthly'"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Parse date or use today
        try:
            if date_str:
                target_date = date.fromisoformat(date_str)
            else:
                target_date = timezone.now().date()
        except ValueError:
            return Response(
                {'error': 'Invalid date format. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Parse limit
        try:
            limit = int(limit)
            if limit <= 0:
                limit = 100
        except (ValueError, TypeError):
            limit = 100
        
        # Route to appropriate handler
        try:
            if scope == 'individual':
                data = self._get_individual_leaderboard(period, target_date, limit)
            else:
                data = self._get_department_leaderboard(period, target_date, limit)
            
            return Response(data, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response(
                {'error': f'Failed to retrieve leaderboard: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _get_individual_leaderboard(self, period, target_date, limit):
        """Retrieve individual leaderboard for the given period"""
        
        if period == 'daily':
            scores = DailyIndividualScore.objects.filter(date=target_date)[:limit]
            serializer = DailyIndividualScoreSerializer(scores, many=True)
            reference_date = target_date
        
        elif period == 'weekly':
            week_start = get_week_start(target_date)
            scores = WeeklyIndividualScore.objects.filter(week_start_date=week_start)[:limit]
            serializer = WeeklyIndividualScoreSerializer(scores, many=True)
            reference_date = week_start
        
        else:  # monthly
            month_start = get_month_start(target_date)
            scores = MonthlyIndividualScore.objects.filter(month_start_date=month_start)[:limit]
            serializer = MonthlyIndividualScoreSerializer(scores, many=True)
            reference_date = month_start
        
        return {
            'scope': 'individual',
            'period': period,
            'reference_date': reference_date.isoformat(),
            'count': len(serializer.data),
            'leaderboard': serializer.data
        }
    
    def _get_department_leaderboard(self, period, target_date, limit):
        """Retrieve department leaderboard for the given period"""
        
        if period == 'daily':
            scores = DailyDepartmentScore.objects.filter(date=target_date)[:limit]
            serializer = DailyDepartmentScoreSerializer(scores, many=True)
            reference_date = target_date
        
        elif period == 'weekly':
            week_start = get_week_start(target_date)
            scores = WeeklyDepartmentScore.objects.filter(week_start_date=week_start)[:limit]
            serializer = WeeklyDepartmentScoreSerializer(scores, many=True)
            reference_date = week_start
        
        else:  # monthly
            month_start = get_month_start(target_date)
            scores = MonthlyDepartmentScore.objects.filter(month_start_date=month_start)[:limit]
            serializer = MonthlyDepartmentScoreSerializer(scores, many=True)
            reference_date = month_start
        
        return {
            'scope': 'department',
            'period': period,
            'reference_date': reference_date.isoformat(),
            'count': len(serializer.data),
            'leaderboard': serializer.data
        }