# leaderboards/admin.py
from django.contrib import admin

from .models import (
    DailyDepartmentScore,
    DailyIndividualScore,
    MonthlyDepartmentScore,
    MonthlyIndividualScore,
    WeeklyDepartmentScore,
    WeeklyIndividualScore,
)


@admin.register(DailyIndividualScore)
class DailyIndividualScoreAdmin(admin.ModelAdmin):
    list_display = ('user', 'score', 'date')
    list_filter = ('date',)
    search_fields = ('user__username',)
    ordering = ('-date', '-score')


@admin.register(WeeklyIndividualScore)
class WeeklyIndividualScoreAdmin(admin.ModelAdmin):
    list_display = ('user', 'score', 'week_start_date')
    list_filter = ('week_start_date',)
    search_fields = ('user__username',)
    ordering = ('-week_start_date', '-score')


@admin.register(MonthlyIndividualScore)
class MonthlyIndividualScoreAdmin(admin.ModelAdmin):
    list_display = ('user', 'score', 'month_start_date')
    list_filter = ('month_start_date',)
    search_fields = ('user__username',)
    ordering = ('-month_start_date', '-score')


@admin.register(DailyDepartmentScore)
class DailyDepartmentScoreAdmin(admin.ModelAdmin):
    list_display = ('department', 'score', 'date')
    list_filter = ('date',)
    search_fields = ('department__name',)
    ordering = ('-date', '-score')


@admin.register(WeeklyDepartmentScore)
class WeeklyDepartmentScoreAdmin(admin.ModelAdmin):
    list_display = ('department', 'score', 'week_start_date')
    list_filter = ('week_start_date',)
    search_fields = ('department__name',)
    ordering = ('-week_start_date', '-score')


@admin.register(MonthlyDepartmentScore)
class MonthlyDepartmentScoreAdmin(admin.ModelAdmin):
    list_display = ('department', 'score', 'month_start_date')
    list_filter = ('month_start_date',)
    search_fields = ('department__name',)
    ordering = ('-month_start_date', '-score')
