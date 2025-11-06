# /gameplay/admin.py
from django.contrib import admin
from django.utils.html import format_html

from .models import Challenge, PuzzleAttempt, Submission


@admin.register(PuzzleAttempt)
class PuzzleAttemptAdmin(admin.ModelAdmin):
    """Admin configuration for the in-progress puzzle attempts."""

    list_display = (
        "user",
        "daily_puzzle",
        "get_puzzle_info",  # Custom method to show the linked puzzle
        "last_saved",
        "time_spent_ms",
    )
    search_fields = ("user__username", "daily_puzzle__date")
    list_filter = ("daily_puzzle", "content_type", "last_saved")
    readonly_fields = ("last_saved",)

    def get_puzzle_info(self, obj):
        """Displays the linked puzzle model and its primary key."""
        if obj.puzzle:
            return format_html("{} (ID: {})", obj.content_type.model.capitalize(), obj.object_id)
        return "N/A"

    get_puzzle_info.short_description = "Puzzle"


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    """Admin configuration for completed puzzle submissions."""

    list_display = (
        "user",
        "get_puzzle_info",
        "difficulty",
        "points_awarded",
        "time_taken_ms",
        "tries",
        "created_at",
    )
    search_fields = ("user__username", "content_type__model", "object_id")
    list_filter = ("difficulty", "content_type", "created_at")
    ordering = ("-created_at",)

    def get_puzzle_info(self, obj):
        """Displays the linked puzzle model and its primary key."""
        if obj.puzzle:
            return format_html("{} (ID: {})", obj.content_type.model.capitalize(), obj.object_id)
        return f"{obj.content_type.model.capitalize()} ID {obj.object_id}"

    get_puzzle_info.short_description = "Puzzle"


@admin.register(Challenge)
class ChallengeAdmin(admin.ModelAdmin):
    """Admin configuration for asynchronous challenges."""

    list_display = (
        "challenger",
        "recipient",
        "status",
        "winner",
        "get_puzzle_type",  # Custom method to show the challenged puzzle type
        "created_at",
    )
    search_fields = (
        "challenger__username",
        "recipient__username",
        "winner__username",
        "challenger_submission__object_id",
    )
    list_filter = ("status", "created_at", "winner")
    readonly_fields = ("created_at",)

    def get_puzzle_type(self, obj):
        """Displays the puzzle type from the challenger's submission."""
        if obj.challenger_submission:
            return obj.challenger_submission.content_type.model.capitalize()
        return "N/A"

    get_puzzle_type.short_description = "Puzzle Type"
