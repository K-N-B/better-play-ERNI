# gameplay/admin.py
from django.contrib import admin
from .models import PuzzleAttempt, Submission

@admin.register(PuzzleAttempt)
class PuzzleAttemptAdmin(admin.ModelAdmin):
    list_display = ('user', 'puzzle_type', 'puzzle_id', 'completed', 'updated_at')
    list_filter = ('puzzle_type', 'completed', 'created_at')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-updated_at',)


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ('user', 'puzzle_type', 'puzzle_date', 'difficulty', 'points_awarded', 'tries', 'time_taken_display', 'created_at')
    list_filter = ('puzzle_type', 'difficulty', 'puzzle_date', 'created_at')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)
    
    def time_taken_display(self, obj):
        """Display time in MM:SS format"""
        total_seconds = obj.time_taken_ms // 1000
        minutes = total_seconds // 60
        seconds = total_seconds % 60
        return f"{minutes}:{seconds:02d}"
    time_taken_display.short_description = 'Time Taken'