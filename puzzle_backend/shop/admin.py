# /shop/admin.py
from django.contrib import admin

from .models import ClaimedReward, Reward


@admin.register(Reward)
class RewardAdmin(admin.ModelAdmin):
    list_display = ("name", "cost", "stock", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name", "description")


@admin.register(ClaimedReward)
class ClaimedRewardAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "reward", "points_spent", "claimed_at", "status")
    list_filter = ("status", "claimed_at", "reward")
    search_fields = ("user__username", "reward__name")
    # Make fields read-only as they are transaction logs
    readonly_fields = ("user", "reward", "claimed_at", "points_spent")
