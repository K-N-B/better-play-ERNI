# games/admin.py
from django.contrib import admin
from django.utils.html import format_html
from .models import DailyPuzzle, UserPuzzleAttempt, UserDailyProgress, UserStreak, Leaderboard


@admin.register(DailyPuzzle)
class DailyPuzzleAdmin(admin.ModelAdmin):
    list_display = ['date', 'game_type', 'difficulty', 'get_word', 'is_active', 'created_at']
    list_filter = ['game_type', 'difficulty', 'is_active', 'date']
    search_fields = ['date', 'game_type']
    date_hierarchy = 'date'
    readonly_fields = ['created_at', 'get_puzzle_preview']
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('date', 'game_type', 'difficulty', 'is_active')
        }),
        ('Puzzle Data', {
            'fields': ('puzzle_data', 'get_puzzle_preview'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at',)
        }),
    )
    
    def get_word(self, obj):
        return obj.puzzle_data.get('word', 'N/A')
    get_word.short_description = 'Word'
    
    def get_puzzle_preview(self, obj):
        """Display formatted puzzle data"""
        data = obj.puzzle_data
        hints = data.get('hints', [])
        html = f"""
        <div style="font-family: monospace;">
            <strong>Word:</strong> {data.get('word', 'N/A')}<br>
            <strong>Theme:</strong> {data.get('theme', 'N/A')}<br>
            <strong>Hints:</strong>
            <ol>
                <li>{hints[0] if len(hints) > 0 else 'N/A'}</li>
                <li>{hints[1] if len(hints) > 1 else 'N/A'}</li>
                <li>{hints[2] if len(hints) > 2 else 'N/A'}</li>
            </ol>
            <strong>Definition:</strong> {data.get('definition', 'N/A')}
        </div>
        """
        return format_html(html)
    get_puzzle_preview.short_description = 'Puzzle Preview'
    
    actions = ['generate_puzzle_manually']
    
    def generate_puzzle_manually(self, request, queryset):
        """Admin action to manually trigger puzzle generation"""
        from games.services.ai_puzzle_generator import puzzle_generator
        from django.utils import timezone
        
        today = timezone.now().date()
        game_type = 'wordle'
        difficulty = 'easy'
        
        puzzle_data = puzzle_generator.generate_wordle_puzzle(difficulty)
        
        puzzle = DailyPuzzle.objects.create(
            date=today,
            game_type=game_type,
            difficulty=difficulty,
            puzzle_data=puzzle_data,
            is_active=True
        )
        
        self.message_user(request, f"Generated puzzle: {puzzle.puzzle_data['word']}")
    generate_puzzle_manually.short_description = "Generate new puzzle manually"


@admin.register(UserPuzzleAttempt)
class UserPuzzleAttemptAdmin(admin.ModelAdmin):
    list_display = ['user', 'get_game', 'get_difficulty', 'is_completed', 'is_successful', 'final_score', 'started_at']
    list_filter = ['is_completed', 'is_successful', 'puzzle__game_type', 'puzzle__difficulty']
    search_fields = ['user__username', 'user__email']
    date_hierarchy = 'started_at'
    readonly_fields = ['started_at', 'completed_at', 'get_attempt_details']
    
    fieldsets = (
        ('User & Puzzle', {
            'fields': ('user', 'puzzle')
        }),
        ('Timing', {
            'fields': ('started_at', 'completed_at', 'time_taken_seconds')
        }),
        ('Scoring', {
            'fields': ('base_score', 'hints_used', 'hint_penalties', 'bonus_points', 'final_score')
        }),
        ('Status', {
            'fields': ('is_completed', 'is_successful')
        }),
        ('Details', {
            'fields': ('attempts_data', 'get_attempt_details'),
            'classes': ('collapse',)
        }),
    )
    
    def get_game(self, obj):
        return obj.puzzle.game_type.title()
    get_game.short_description = 'Game'
    
    def get_difficulty(self, obj):
        return obj.puzzle.difficulty.title()
    get_difficulty.short_description = 'Difficulty'
    
    def get_attempt_details(self, obj):
        """Display formatted attempt data"""
        data = obj.attempts_data
        guesses = data.get('guesses', [])
        
        html = "<div style='font-family: monospace;'>"
        html += f"<strong>Total Guesses:</strong> {len(guesses)}<br><br>"
        
        for i, guess_data in enumerate(guesses, 1):
            word = guess_data.get('word', '')
            feedback = guess_data.get('feedback', [])
            html += f"<strong>Guess {i}:</strong> {word} - {', '.join(feedback)}<br>"
        
        html += "</div>"
        return format_html(html)
    get_attempt_details.short_description = 'Attempt Details'


@admin.register(UserDailyProgress)
class UserDailyProgressAdmin(admin.ModelAdmin):
    list_display = ['user', 'date', 'puzzles_completed', 'total_daily_score', 'is_complete', 'daily_completion_bonus']
    list_filter = ['is_complete', 'date']
    search_fields = ['user__username', 'user__email']
    date_hierarchy = 'date'
    readonly_fields = ['created_at', 'updated_at']


@admin.register(UserStreak)
class UserStreakAdmin(admin.ModelAdmin):
    list_display = ['user', 'current_streak', 'longest_streak', 'last_completion_date', 'get_total_bonuses']
    list_filter = ['current_streak', 'last_completion_date']
    search_fields = ['user__username', 'user__email', 'user__display_name']
    readonly_fields = ['created_at', 'updated_at', 'get_bonus_breakdown']
    
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Streak Info', {
            'fields': ('current_streak', 'longest_streak', 'last_completion_date')
        }),
        ('Milestone Bonuses', {
            'fields': ('three_day_bonus_count', 'seven_day_bonus_count', 'thirty_day_bonus_count', 'get_bonus_breakdown')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    def get_total_bonuses(self, obj):
        total = obj.three_day_bonus_count * 50 + obj.seven_day_bonus_count * 100 + obj.thirty_day_bonus_count * 500
        return f"{total} pts"
    get_total_bonuses.short_description = 'Total Bonuses Earned'
    
    def get_bonus_breakdown(self, obj):
        """Display detailed bonus breakdown"""
        html = f"""
        <div style="font-family: monospace;">
            <strong>3-Day Streaks:</strong> {obj.three_day_bonus_count} × 50pts = {obj.three_day_bonus_count * 50}pts<br>
            <strong>7-Day Streaks:</strong> {obj.seven_day_bonus_count} × 100pts = {obj.seven_day_bonus_count * 100}pts<br>
            <strong>30-Day Streaks:</strong> {obj.thirty_day_bonus_count} × 500pts = {obj.thirty_day_bonus_count * 500}pts<br>
            <hr>
            <strong>Total Earned:</strong> {obj.three_day_bonus_count * 50 + obj.seven_day_bonus_count * 100 + obj.thirty_day_bonus_count * 500}pts
        </div>
        """
        return format_html(html)
    get_bonus_breakdown.short_description = 'Bonus Breakdown'


@admin.register(Leaderboard)
class LeaderboardAdmin(admin.ModelAdmin):
    list_display = ['period', 'rank', 'user', 'total_points', 'puzzles_completed', 'updated_at']
    list_filter = ['period', 'period_start']
    search_fields = ['user__username', 'user__email', 'user__display_name']
    readonly_fields = ['updated_at']
    date_hierarchy = 'period_start'
    
    fieldsets = (
        ('Period Info', {
            'fields': ('period', 'period_start', 'period_end')
        }),
        ('User & Ranking', {
            'fields': ('user', 'rank')
        }),
        ('Stats', {
            'fields': ('total_points', 'puzzles_completed')
        }),
        ('Metadata', {
            'fields': ('updated_at',)
        }),
    )
    
    actions = ['recalculate_leaderboard']
    
    def recalculate_leaderboard(self, request, queryset):
        """Admin action to manually recalculate leaderboards"""
        for period in ['daily', 'weekly', 'monthly', 'all_time']:
            count = Leaderboard.calculate_leaderboard(period)
            self.message_user(request, f"Recalculated {period} leaderboard: {count} entries")
    recalculate_leaderboard.short_description = "Recalculate all leaderboards"