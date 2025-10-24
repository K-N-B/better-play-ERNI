# /leaderboards/models.py
from django.db import models
from django.conf import settings # Uses AUTH_USER_MODEL
from users.models import Department # Import Department from users app

class DailyIndividualScore(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='daily_scores')
    score = models.IntegerField(db_index=True) # Index score for ordering
    date = models.DateField(db_index=True) # Index date for filtering

    class Meta:
        ordering = ['-score'] # Default ordering for API
        unique_together = ('user', 'date') # Ensure only one daily score per user per day
        verbose_name = "Daily Individual Score"
        verbose_name_plural = "Daily Individual Scores"
        
    def __str__(self):
        return f"{self.user.username} - Daily {self.date}: {self.score}"

class WeeklyIndividualScore(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='weekly_scores')
    score = models.IntegerField(db_index=True)
    week_start_date = models.DateField(db_index=True, help_text="Date of the Sunday for that week")

    class Meta:
        ordering = ['-score']
        unique_together = ('user', 'week_start_date')
        verbose_name = "Weekly Individual Score"
        verbose_name_plural = "Weekly Individual Scores"

    def __str__(self):
         return f"{self.user.username} - Week of {self.week_start_date}: {self.score}"

class MonthlyIndividualScore(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='monthly_scores')
    score = models.IntegerField(db_index=True)
    month_start_date = models.DateField(db_index=True, help_text="Date of the 1st of that month")

    class Meta:
        ordering = ['-score']
        unique_together = ('user', 'month_start_date')
        verbose_name = "Monthly Individual Score"
        verbose_name_plural = "Monthly Individual Scores"

    def __str__(self):
         return f"{self.user.username} - Month of {self.month_start_date.strftime('%Y-%m')}: {self.score}"

# --- Department Leaderboard Tables ---

class DailyDepartmentScore(models.Model):
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='daily_scores')
    score = models.IntegerField(db_index=True)
    date = models.DateField(db_index=True)

    class Meta:
        ordering = ['-score']
        unique_together = ('department', 'date')
        verbose_name = "Daily Department Score"
        verbose_name_plural = "Daily Department Scores"
    
    def __str__(self):
         return f"{self.department.name} - Daily {self.date}: {self.score}"

class WeeklyDepartmentScore(models.Model):
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='weekly_scores')
    score = models.IntegerField(db_index=True)
    week_start_date = models.DateField(db_index=True)

    class Meta:
        ordering = ['-score']
        unique_together = ('department', 'week_start_date')
        verbose_name = "Weekly Department Score"
        verbose_name_plural = "Weekly Department Scores"
    
    def __str__(self):
         return f"{self.department.name} - Week of {self.week_start_date}: {self.score}"

class MonthlyDepartmentScore(models.Model):
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='monthly_scores')
    score = models.IntegerField(db_index=True)
    month_start_date = models.DateField(db_index=True)

    class Meta:
        ordering = ['-score']
        unique_together = ('department', 'month_start_date')
        verbose_name = "Monthly Department Score"
        verbose_name_plural = "Monthly Department Scores"

    def __str__(self):
        return f"{self.department.name} - Month of {self.month_start_date.strftime('%Y-%m')}: {self.score}"