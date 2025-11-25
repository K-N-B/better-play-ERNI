from django.contrib import admin
from django.utils.html import format_html

from .models import Challenge, PuzzleAttempt, Submission

# Import custom admin site
from users.admin import admin_site


# ========== BASE PERMISSION MIXIN ==========
class ModeratorReadOnlyMixin:
    """Mixin for read-only access for Moderators"""
    
    def has_module_permission(self, request):
        """Moderators and Super Admins can see Gameplay section"""
        return request.user.is_superuser or request.user.is_moderator()
    
    def has_add_permission(self, request):
        """Nobody can add through admin (created via gameplay)"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Only Super Admins can edit gameplay data"""
        return request.user.is_superuser
    
    def has_delete_permission(self, request, obj=None):
        """Only Super Admins can delete gameplay data"""
        return request.user.is_superuser


# ========== PUZZLE ATTEMPT ADMIN ==========
@admin.register(PuzzleAttempt, site=admin_site)
class PuzzleAttemptAdmin(ModeratorReadOnlyMixin, admin.ModelAdmin):
    """Admin configuration for in-progress puzzle attempts (read-only for Moderators)"""
    
    list_display = (
        "user",
        "daily_puzzle",
        "get_puzzle_info",
        "last_saved",
        "display_time_spent",
    )
    search_fields = ("user__username", "daily_puzzle__date")
    list_filter = ("daily_puzzle", "content_type", "last_saved")
    readonly_fields = ("last_saved", "user", "daily_puzzle", "content_type", "object_id", "progress_data", "time_spent_ms")
    ordering = ("-last_saved",)
    
    def get_puzzle_info(self, obj):
        """Display the linked puzzle model and its primary key"""
        if obj.puzzle:
            return format_html(
                "{} (ID: {})",
                obj.content_type.model.capitalize(),
                obj.object_id
            )
        return "N/A"
    get_puzzle_info.short_description = "Puzzle"
    
    def display_time_spent(self, obj):
        """Convert milliseconds to human-readable format"""
        seconds = obj.time_spent_ms / 1000
        minutes = int(seconds // 60)
        secs = int(seconds % 60)
        return f"{minutes}m {secs}s"
    display_time_spent.short_description = "Time Spent"


# ========== SUBMISSION ADMIN ==========
@admin.register(Submission, site=admin_site)
class SubmissionAdmin(ModeratorReadOnlyMixin, admin.ModelAdmin):
    """Admin configuration for completed puzzle submissions (read-only for Moderators)"""
    
    list_display = (
        "user",
        "get_puzzle_info",
        "difficulty",
        "points_awarded",
        "display_time_taken",
        "tries",
        "hints_used",
        "created_at",
    )
    search_fields = ("user__username", "content_type__model", "object_id")
    list_filter = ("difficulty", "content_type", "created_at", "puzzle_date")
    ordering = ("-created_at",)
    date_hierarchy = "created_at"
    
    readonly_fields = (
        "user",
        "content_type",
        "object_id",
        "puzzle_date",
        "difficulty",
        "points_awarded",
        "hints_used",
        "time_taken_ms",
        "tries",
        "created_at",
    )
    
    def get_puzzle_info(self, obj):
        """Display the linked puzzle model and its primary key"""
        if obj.puzzle:
            return format_html(
                "{} (ID: {})",
                obj.content_type.model.capitalize(),
                obj.object_id
            )
        return f"{obj.content_type.model.capitalize()} ID {obj.object_id}"
    get_puzzle_info.short_description = "Puzzle"
    
    def display_time_taken(self, obj):
        """Convert milliseconds to human-readable format"""
        seconds = obj.time_taken_ms / 1000
        minutes = int(seconds // 60)
        secs = int(seconds % 60)
        return f"{minutes}m {secs}s"
    display_time_taken.short_description = "Time Taken"


# ========== CHALLENGE ADMIN ==========
@admin.register(Challenge, site=admin_site)
class ChallengeAdmin(ModeratorReadOnlyMixin, admin.ModelAdmin):
    """Admin configuration for asynchronous challenges (read-only for Moderators)"""
    
    list_display = (
        "id",
        "challenger",
        "recipient",
        "display_status",
        "winner",
        "get_puzzle_type",
        "created_at",
        "expires_at",
    )
    search_fields = (
        "challenger__username",
        "recipient__username",
        "winner__username",
    )
    list_filter = ("status", "created_at")
    ordering = ("-created_at",)
    date_hierarchy = "created_at"
    
    readonly_fields = (
        "challenger",
        "recipient",
        "challenger_submission",
        "recipient_submission",
        "status",
        "winner",
        "created_at",
        "expires_at",
        "completed_at",
    )
    
    def get_puzzle_type(self, obj):
        """Display the puzzle type from the challenger's submission"""
        if obj.challenger_submission:
            return obj.challenger_submission.content_type.model.capitalize()
        return "N/A"
    get_puzzle_type.short_description = "Puzzle Type"
    
    def display_status(self, obj):
        """Display status with colored badge"""
        status_colors = {
            Challenge.Status.PENDING: "#ffc107",  # Yellow
            Challenge.Status.COMPLETED: "#28a745",  # Green
            Challenge.Status.EXPIRED: "#dc3545",  # Red
        }
        color = status_colors.get(obj.status, "#6c757d")
        
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px;">{}</span>',
            color,
            obj.get_status_display()
        )
    display_status.short_description = "Status"