from django.conf import settings  # For AUTH_USER_MODEL
from django.db import models
from django.utils import timezone


class Reward(models.Model):
    """
    Represents a single item available for purchase in the shop.
    """

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    cost = models.PositiveIntegerField(help_text="The price of the reward in spendable points")
    image = models.ImageField(
        upload_to="rewards/",  # Subdirectory within your media folder
        blank=True,
        null=True,
        help_text="Image for the reward (optional)",
    )
    stock = models.PositiveIntegerField(
        null=True, blank=True, help_text="How many are available? Null means infinite."
    )
    is_active = models.BooleanField(
        default=True, help_text="Whether the reward is currently available in the shop"
    )

    max_claims_per_user = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Max times a user can claim this. Null means infinite.",
    )

    def __str__(self):
        return f"{self.name} ({self.cost} pts)"

    class Meta:
        ordering = ["cost", "name"]  # Show cheapest items first


class ClaimedReward(models.Model):
    """
    A record of a user claiming a specific reward.
    This acts as a transaction log.
    """

    class ClaimStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"  # For digital items that need processing
        FULFILLED = (
            "FULFILLED",
            "Fulfilled",
        )  # For digital items, or when physical item is given
        CLAIMED = "CLAIMED", "Claimed"  # Default status

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="claimed_rewards",
    )
    reward = models.ForeignKey(
        Reward,
        on_delete=models.PROTECT,  # Don't delete a reward if someone has claimed it
        related_name="claims",
    )
    claimed_at = models.DateTimeField(default=timezone.now)
    points_spent = models.PositiveIntegerField(
        help_text="How many points were spent at the time of claim"
    )
    status = models.CharField(
        max_length=20, choices=ClaimStatus.choices, default=ClaimStatus.CLAIMED
    )

    def __str__(self):
        return f"{self.user.username} claimed {self.reward.name}"

    class Meta:
        ordering = ["-claimed_at"]
