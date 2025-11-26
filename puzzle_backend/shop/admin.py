from django.contrib import admin
from django.utils.html import format_html

from .models import ClaimedReward, Reward

# Import custom admin site
from users.admin import admin_site


# ========== BASE PERMISSION MIXIN ==========
class ShopManagerPermissionMixin:
    """Mixin to restrict access to Shop Managers only"""
    
    def has_module_permission(self, request):
        """Only Shop Managers and Super Admins see Shop section"""
        if not request.user.is_authenticated:
            return False
        return request.user.is_superuser or request.user.is_shop_manager()
    
    def has_add_permission(self, request):
        """Shop Managers and Super Admins can add rewards"""
        if not request.user.is_authenticated:
            return False
        return request.user.is_superuser or request.user.is_shop_manager()
    
    def has_change_permission(self, request, obj=None):
        """Shop Managers and Super Admins can edit"""
        if not request.user.is_authenticated:
            return False
        return request.user.is_superuser or request.user.is_shop_manager()
    
    def has_delete_permission(self, request, obj=None):
        """Only Super Admins can delete rewards"""
        if not request.user.is_authenticated:
            return False
        return request.user.is_superuser


# ========== REWARD ADMIN ==========
@admin.register(Reward, site=admin_site)
class RewardAdmin(ShopManagerPermissionMixin, admin.ModelAdmin):
    list_display = (
        "name",
        "display_image",
        "cost",
        "stock",
        "max_claims_per_user",
        "display_status",
        "total_claims",
    )
    list_filter = ("is_active",)
    search_fields = ("name", "description")
    ordering = ("cost", "name")
    
    fieldsets = (
        ("Basic Info", {
            "fields": ("name", "description", "image")
        }),
        ("Pricing & Availability", {
            "fields": ("cost", "stock", "max_claims_per_user", "is_active")
        }),
    )
    
    def display_image(self, obj):
        """Show thumbnail of reward image"""
        if obj.image:
            return format_html(
                '<img src="{}" width="50" height="50" style="object-fit: cover; border-radius: 5px;" />',
                obj.image.url
            )
        return "No Image"
    display_image.short_description = "Preview"
    
    def display_status(self, obj):
        """Show active/inactive status with colored badge"""
        if obj.is_active:
            return format_html(
                '<span style="background-color: #28a745; color: white; padding: 3px 8px; border-radius: 3px;">✓ Active</span>'
            )
        return format_html(
            '<span style="background-color: #dc3545; color: white; padding: 3px 8px; border-radius: 3px;">✗ Inactive</span>'
        )
    display_status.short_description = "Status"
    
    def total_claims(self, obj):
        """Show total number of times this reward was claimed"""
        return obj.claims.count()
    total_claims.short_description = "Total Claims"


# ========== CLAIMED REWARD ADMIN ==========
@admin.register(ClaimedReward, site=admin_site)
class ClaimedRewardAdmin(ShopManagerPermissionMixin, admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "reward",
        "points_spent",
        "claimed_at",
        "display_status",
    )
    list_filter = ("status", "claimed_at", "reward")
    search_fields = ("user__username", "reward__name")
    ordering = ("-claimed_at",)
    date_hierarchy = "claimed_at"
    
    # Make critical fields read-only (transaction log)
    readonly_fields = ("user", "reward", "claimed_at", "points_spent")
    
    fieldsets = (
        ("Claim Details", {
            "fields": ("user", "reward", "points_spent", "claimed_at")
        }),
        ("Fulfillment", {
            "fields": ("status",),
            "description": "Update status to FULFILLED once reward is delivered to user."
        }),
    )
    
    def display_status(self, obj):
        """Show claim status with colored badge"""
        status_colors = {
            ClaimedReward.ClaimStatus.PENDING: "#ffc107",  # Yellow
            ClaimedReward.ClaimStatus.FULFILLED: "#28a745",  # Green
            ClaimedReward.ClaimStatus.CLAIMED: "#17a2b8",  # Teal
        }
        color = status_colors.get(obj.status, "#6c757d")
        
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px;">{}</span>',
            color,
            obj.get_status_display()
        )
    display_status.short_description = "Status"
    
    # ========== ACTIONS ==========
    actions = ["mark_as_fulfilled"]
    
    def mark_as_fulfilled(self, request, queryset):
        """Bulk action to mark claims as fulfilled"""
        updated = queryset.update(status=ClaimedReward.ClaimStatus.FULFILLED)
        self.message_user(
            request,
            f"{updated} claim(s) successfully marked as FULFILLED."
        )
    mark_as_fulfilled.short_description = "✓ Mark selected claims as FULFILLED"