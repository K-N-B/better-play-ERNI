from django.contrib import admin
from .models import (
    Puzzle, UserProgress, Submission, DailyCompletionStatus,
    Streak, LeaderboardCache, ActivityFeed
)


# ============================================
# PUZZLE ADMIN
# ============================================
@admin.register(Puzzle)
class PuzzleAdmin(admin.ModelAdmin):
    list_display = ['id', 'puzzle_type', 'difficulty', 'puzzle_date', 'is_active', 'created_at']
    list_filter = ['puzzle_type', 'difficulty', 'puzzle_date', 'is_active']
    search_fields = ['solution_word', 'solution_phrase']
    ordering = ['-puzzle_date', 'puzzle_type']
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('puzzle_type', 'difficulty', 'puzzle_date', 'is_active')
        }),
        ('Wordle', {
            'fields': ('solution_word',),
            'classes': ('collapse',)
        }),
        ('Sudoku', {
            'fields': ('puzzle_string', 'solution_string'),
            'classes': ('collapse',)
        }),
        ('ERNIgram', {
            'fields': ('solution_phrase', 'clue'),
            'classes': ('collapse',)
        }),
        ('Hints', {
            'fields': ('hints',),
        }),
        ('Metadata', {
            'fields': ('created_at',),
        }),
    )


# ============================================
# USER PROGRESS ADMIN
# ============================================
@admin.register(UserProgress)
class UserProgressAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'puzzle_type', 'puzzle', 'time_spent_ms', 'last_saved']
    list_filter = ['puzzle_type', 'last_saved']
    search_fields = ['user__username', 'user__email']
    ordering = ['-last_saved']
    readonly_fields = ['created_at', 'last_saved']
    
    def has_add_permission(self, request):
        return False  # Progress is auto-saved, not manually created


# ============================================
# SUBMISSION ADMIN
# ============================================
@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'puzzle_type', 'points_awarded', 'tries', 'time_taken_ms', 'created_at']
    list_filter = ['puzzle_type', 'created_at']
    search_fields = ['user__username', 'user__email']
    ordering = ['-created_at']
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('User Info', {
            'fields': ('user', 'puzzle')
        }),
        ('Performance', {
            'fields': ('puzzle_type', 'tries', 'time_taken_ms', 'points_awarded')
        }),
        ('Metadata', {
            'fields': ('created_at',),
        }),
    )


# ============================================
# DAILY COMPLETION STATUS ADMIN
# ============================================
@admin.register(DailyCompletionStatus)
class DailyCompletionStatusAdmin(admin.ModelAdmin):
    list_display = ['user', 'completion_date', 'puzzles_completed_count', 'points_earned_today', 'all_completed']
    list_filter = ['completion_date', 'puzzles_completed_count']
    search_fields = ['user__username', 'user__email']
    ordering = ['-completion_date', 'user']
    
    def all_completed(self, obj):
        return obj.is_all_completed()
    all_completed.boolean = True
    all_completed.short_description = 'All Completed'


# ============================================
# STREAK ADMIN
# ============================================
@admin.register(Streak)
class StreakAdmin(admin.ModelAdmin):
    list_display = ['user', 'current_streak_count', 'max_streak_count', 'last_completion_date', 'updated_at']
    search_fields = ['user__username', 'user__email']
    ordering = ['-current_streak_count']
    readonly_fields = ['updated_at']


# ============================================
# LEADERBOARD CACHE ADMIN
# ============================================
@admin.register(LeaderboardCache)
class LeaderboardCacheAdmin(admin.ModelAdmin):
    list_display = ['period', 'rank', 'user', 'score', 'previous_rank', 'calculated_at']
    list_filter = ['period', 'calculated_at']
    search_fields = ['user__username', 'user__email']
    ordering = ['period', 'rank']
    readonly_fields = ['calculated_at']
    
    def has_add_permission(self, request):
        return False  # Cache is auto-generated


# ============================================
# ACTIVITY FEED ADMIN
# ============================================
@admin.register(ActivityFeed)
class ActivityFeedAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'event_type', 'puzzle_type', 'points', 'tries', 'created_at']
    list_filter = ['event_type', 'puzzle_type', 'created_at']
    search_fields = ['user__username', 'user__email']
    ordering = ['-created_at']
    readonly_fields = ['created_at']
    
    def has_add_permission(self, request):
        return False  # Activities are auto-generated