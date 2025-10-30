from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.utils import timezone
from datetime import timedelta, date
from django.db.models import Sum, Q
from .models import (
    DailyIndividualScore, WeeklyIndividualScore, MonthlyIndividualScore,
    DailyDepartmentScore, WeeklyDepartmentScore, MonthlyDepartmentScore
)
from users.models import User, Department
from .serializers import (
    DailyIndividualScoreSerializer, WeeklyIndividualScoreSerializer, MonthlyIndividualScoreSerializer,
    DailyDepartmentScoreSerializer, WeeklyDepartmentScoreSerializer, MonthlyDepartmentScoreSerializer,
)


def get_week_start(target_date):
    """Get Monday of the week containing target_date"""
    days_since_monday = target_date.weekday()
    return target_date - timedelta(days=days_since_monday)


class GetLeaderboardView(generics.ListAPIView):
    """
    API endpoint for fetching leaderboard data.
    Query params:
    - type: 'individual' or 'department'
    - period: 'daily', 'weekly', 'monthly', 'all_time'
    - date: optional ISO date string
    """
    permission_classes = [AllowAny]
    
    def get_serializer_class(self):
        """Dynamically determine serializer based on type and period"""
        lb_type = self.request.query_params.get('type', 'individual')
        period = self.request.query_params.get('period', 'weekly')

        if lb_type == 'individual':
            if period == 'daily':
                return DailyIndividualScoreSerializer
            elif period == 'weekly':
                return WeeklyIndividualScoreSerializer
            elif period == 'monthly':
                return MonthlyIndividualScoreSerializer
            elif period == 'all_time':
                from rest_framework import serializers
                
                class UserAllTimeSerializer(serializers.ModelSerializer):
                    score = serializers.IntegerField(source='total_points_alltime')
                    user = serializers.SerializerMethodField()
                    
                    class Meta:
                        model = User
                        fields = ['user', 'score']
                    
                    def get_user(self, obj):
                        return {
                            'id': obj.id,
                            'username': obj.username
                        }
                
                return UserAllTimeSerializer
                
        elif lb_type == 'department':
            if period == 'daily':
                return DailyDepartmentScoreSerializer
            elif period == 'weekly':
                return WeeklyDepartmentScoreSerializer
            elif period == 'monthly':
                return MonthlyDepartmentScoreSerializer
            elif period == 'all_time':
                from rest_framework import serializers
                
                class DepartmentAllTimeSerializer(serializers.ModelSerializer):
                    score = serializers.IntegerField(source='total_points_alltime')
                    department = serializers.SerializerMethodField()
                    
                    class Meta:
                        model = Department
                        fields = ['department', 'score']
                    
                    def get_department(self, obj):
                        return {
                            'id': obj.id,
                            'name': obj.name
                        }
                
                return DepartmentAllTimeSerializer

        return WeeklyIndividualScoreSerializer

    def get_queryset(self):
        """Dynamically determine queryset based on type, period, and date"""
        lb_type = self.request.query_params.get('type', 'individual')
        period = self.request.query_params.get('period', 'weekly')
        date_str = self.request.query_params.get('date', None)

        target_date = None
        if date_str:
            try:
                target_date = date.fromisoformat(date_str)
            except ValueError:
                target_date = None

        # --- All-Time ---
        if period == 'all_time':
            if lb_type == 'individual':
                return User.objects.filter(is_active=True).order_by('-total_points_alltime')
            elif lb_type == 'department':
                return Department.objects.all().order_by('-total_points_alltime')

        # --- Periodic Scores ---
        if lb_type == 'individual':
            if period == 'daily':
                filter_date = target_date if target_date else timezone.now().date()
                return DailyIndividualScore.objects.filter(date=filter_date).select_related('user')
            
            elif period == 'weekly':
                week_start = get_week_start(target_date if target_date else timezone.now().date())
                return WeeklyIndividualScore.objects.filter(week_start_date=week_start).select_related('user')
            
            elif period == 'monthly':
                month_start = (target_date if target_date else timezone.now().date()).replace(day=1)
                return MonthlyIndividualScore.objects.filter(month_start_date=month_start).select_related('user')

        elif lb_type == 'department':
            if period == 'daily':
                filter_date = target_date if target_date else timezone.now().date()
                return DailyDepartmentScore.objects.filter(date=filter_date).select_related('department')
            
            elif period == 'weekly':
                week_start = get_week_start(target_date if target_date else timezone.now().date())
                return WeeklyDepartmentScore.objects.filter(week_start_date=week_start).select_related('department')
            
            elif period == 'monthly':
                month_start = (target_date if target_date else timezone.now().date()).replace(day=1)
                return MonthlyDepartmentScore.objects.filter(month_start_date=month_start).select_related('department')

        return DailyIndividualScore.objects.none()

    def list(self, request, *args, **kwargs):
        """Override list to return plain array"""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        # Debug logging
        print(f"[GetLeaderboardView] Type: {request.query_params.get('type')}, Period: {request.query_params.get('period')}")
        print(f"[GetLeaderboardView] Queryset count: {queryset.count()}")
        print(f"[GetLeaderboardView] Serialized data length: {len(serializer.data)}")
        
        # ✅ CRITICAL: Return plain array, not wrapped object
        return Response(serializer.data)