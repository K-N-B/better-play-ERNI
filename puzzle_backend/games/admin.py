from django.contrib import admin
from django.utils.html import format_html

from .models import DailyPuzzle, EmployeeImageSource, ErnigramPuzzle, SudokuPuzzle, WordlePuzzle

# Import custom admin site
from users.admin import admin_site


# ========== BASE PERMISSION MIXIN ==========
class ContentAdminPermissionMixin:
    """Mixin to restrict access to Content Admins only"""
    
    def has_module_permission(self, request):
        """Only Content Admins and Super Admins see Games section"""
        if not request.user.is_authenticated:
            return False
        return request.user.is_superuser or request.user.is_content_admin()
    
    def has_add_permission(self, request):
        """Only Content Admins and Super Admins can add"""
        if not request.user.is_authenticated:
            return False
        return request.user.is_superuser or request.user.is_content_admin()
    
    def has_change_permission(self, request, obj=None):
        """Only Content Admins and Super Admins can edit"""
        if not request.user.is_authenticated:
            return False
        return request.user.is_superuser or request.user.is_content_admin()
    
    def has_delete_permission(self, request, obj=None):
        """Only Super Admins can delete (Content Admins cannot)"""
        if not request.user.is_authenticated:
            return False
        return request.user.is_superuser


# ========== WORDLE PUZZLE ADMIN ==========
@admin.register(WordlePuzzle, site=admin_site)
class WordlePuzzleAdmin(ContentAdminPermissionMixin, admin.ModelAdmin):
    list_display = (
        "id",
        "solution_word",
        "word_length",
        "difficulty",
        "date_to_be_used",
    )
    list_filter = ("difficulty", "date_to_be_used")
    search_fields = ("solution_word",)
    ordering = ("-date_to_be_used",)


# ========== SUDOKU PUZZLE ADMIN ==========
@admin.register(SudokuPuzzle, site=admin_site)
class SudokuPuzzleAdmin(ContentAdminPermissionMixin, admin.ModelAdmin):
    list_display = (
        "id",
        "display_solution_preview",
        "date_to_be_used",
    )
    list_filter = ("date_to_be_used",)
    ordering = ("-date_to_be_used",)

    search_fields = ("solution_string",)

    def display_solution_preview(self, obj):
        return f"{obj.solution_string[:20]}..."
    display_solution_preview.short_description = "Solution Preview"


# ========== ERNIGRAM PUZZLE ADMIN ==========
@admin.register(ErnigramPuzzle, site=admin_site)
class ErnigramPuzzleAdmin(ContentAdminPermissionMixin, admin.ModelAdmin):
    list_display = (
        "id",
        "solution_phrase",
        "display_clue_preview",
        "employee_source",
        "date_to_be_used",
    )
    list_filter = ("date_to_be_used", "employee_source")
    search_fields = ("solution_phrase", "clue")
    ordering = ("-date_to_be_used",)
    
    def display_clue_preview(self, obj):
        """Show first 50 chars of clue"""
        return f"{obj.clue[:50]}..." if len(obj.clue) > 50 else obj.clue
    display_clue_preview.short_description = "Clue Preview"


# ========== EMPLOYEE IMAGE SOURCE ADMIN ==========
@admin.register(EmployeeImageSource, site=admin_site)
class EmployeeImageSourceAdmin(ContentAdminPermissionMixin, admin.ModelAdmin):
    list_display = (
        "id",
        "employee_name",
        "display_image",
        "clue_context",
        "is_available",
    )
    list_filter = ("is_available",)
    search_fields = ("employee_name", "clue_context")
    ordering = ("employee_name",)
    
    def display_image(self, obj):
        if obj.image_file:
            return format_html(
                '<img src="{}" width="50" height="50" style="object-fit: cover; border-radius: 5px;" />',
                obj.image_file.url
            )
        return "No Image"
    display_image.short_description = "Preview"


# ========== DAILY PUZZLE ADMIN ==========
@admin.register(DailyPuzzle, site=admin_site)
class DailyPuzzleAdmin(ContentAdminPermissionMixin, admin.ModelAdmin):
    list_display = (
        "date",
        "wordle_easy",
        "wordle_hard",
        "sudoku",
        "ernigram",
    )
    list_filter = ("date",)
    ordering = ("-date",)
    date_hierarchy = "date"
    
    # Make it easier to see what puzzles are assigned
    autocomplete_fields = ["wordle_easy", "wordle_hard", "sudoku", "ernigram"]