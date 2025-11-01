from django.urls import path
from . import views

urlpatterns = [
    path("api/shop/rewards/", views.RewardListView.as_view(), name="reward-list"),
    path(
        "api/shop/claim/<int:reward_id>/",
        views.ClaimRewardView.as_view(),
        name="claim-reward",
    ),
    path(
        "api/shop/claims/",
        views.ClaimedRewardListView.as_view(),
        name="claimed-reward-list",
    ),
]
