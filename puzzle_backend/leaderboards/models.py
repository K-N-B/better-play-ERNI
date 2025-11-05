# leaderboards/models.py
from django.conf import settings
from django.db import models
from users.models import Department


class DailyIndividualScore(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='daily_scores'
    )
    score = models.IntegerField(db_index=True, default=0)
    date = models.DateField(db_index=True)

    class Meta:
        ordering = ['-score', 'user__username']  # Secondary sort by username for ties
        unique_together = ('user', 'date')
        verbose_name = "Daily Individual Score"
        verbose_name_plural = "Daily Individual Scores"
        indexes = [
            models.Index(fields=['date', '-score']),  # Optimize leaderboard queries
        ]

    def __str__(self):
        return f"{self.user.username} - {self.date} - {self.score}pts"


class WeeklyIndividualScore(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='weekly_scores'
    )
    score = models.IntegerField(db_index=True, default=0)
    week_start_date = models.DateField(db_index=True, help_text="Date of the Monday for that week")

    class Meta:
        ordering = ['-score', 'user__username']
        unique_together = ('user', 'week_start_date')
        verbose_name = "Weekly Individual Score"
        verbose_name_plural = "Weekly Individual Scores"
        indexes = [
            models.Index(fields=['week_start_date', '-score']),
        ]

    def __str__(self):
        return f"{self.user.username} - Week of {self.week_start_date} - {self.score}pts"


class MonthlyIndividualScore(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='monthly_scores'
    )
    score = models.IntegerField(db_index=True, default=0)
    month_start_date = models.DateField(db_index=True, help_text="Date of the 1st of that month")

    class Meta:
        ordering = ['-score', 'user__username']
        unique_together = ('user', 'month_start_date')
        verbose_name = "Monthly Individual Score"
        verbose_name_plural = "Monthly Individual Scores"
        indexes = [
            models.Index(fields=['month_start_date', '-score']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.month_start_date.strftime('%B %Y')} - {self.score}pts"


# --- Department Leaderboards ---
class DailyDepartmentScore(models.Model):
    department = models.ForeignKey(
        Department, on_delete=models.CASCADE, related_name='daily_scores'
    )
    score = models.IntegerField(db_index=True, default=0)
    date = models.DateField(db_index=True)

    class Meta:
        ordering = ['-score', 'department__name']
        unique_together = ('department', 'date')
        verbose_name = "Daily Department Score"
        verbose_name_plural = "Daily Department Scores"
        indexes = [
            models.Index(fields=['date', '-score']),
        ]

    def __str__(self):
        return f"{self.department.name} - {self.date} - {self.score}pts"


class WeeklyDepartmentScore(models.Model):
    department = models.ForeignKey(
        Department, on_delete=models.CASCADE, related_name='weekly_scores'
    )
    score = models.IntegerField(db_index=True, default=0)
    week_start_date = models.DateField(db_index=True)

    class Meta:
        ordering = ['-score', 'department__name']
        unique_together = ('department', 'week_start_date')
        verbose_name = "Weekly Department Score"
        verbose_name_plural = "Weekly Department Scores"
        indexes = [
            models.Index(fields=['week_start_date', '-score']),
        ]

    def __str__(self):
        return f"{self.department.name} - Week of {self.week_start_date} - {self.score}pts"


class MonthlyDepartmentScore(models.Model):
    department = models.ForeignKey(
        Department, on_delete=models.CASCADE, related_name='monthly_scores'
    )
    score = models.IntegerField(db_index=True, default=0)
    month_start_date = models.DateField(db_index=True)

    class Meta:
        ordering = ['-score', 'department__name']
        unique_together = ('department', 'month_start_date')
        verbose_name = "Monthly Department Score"
        verbose_name_plural = "Monthly Department Scores"
        indexes = [
            models.Index(fields=['month_start_date', '-score']),
        ]

    def __str__(self):
        return (
            f"{self.department.name} - {self.month_start_date.strftime('%B %Y')} - {self.score}pts"
        )
