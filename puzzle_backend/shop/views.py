from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.db import transaction
from .models import Reward, ClaimedReward
from .serializers import RewardSerializer, ClaimedRewardSerializer
from users.models import User # Import User to access current_points

class RewardListView(generics.ListAPIView):
    """
    GET /api/shop/rewards/
    Returns a list of all active rewards.
    """
    queryset = Reward.objects.filter(is_active=True)
    serializer_class = RewardSerializer
    permission_classes = [permissions.IsAuthenticated]

class ClaimRewardView(generics.GenericAPIView):
    """
    POST /api/shop/claim/<int:reward_id>/
    Attempts to claim a reward for the logged-in user.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        reward_id = self.kwargs.get('reward_id')
        user = request.user

        try:
            reward = Reward.objects.get(id=reward_id, is_active=True)
        except Reward.DoesNotExist:
            return Response({"success": False, "message": "Reward not found."},
                            status=status.HTTP_404_NOT_FOUND)

        # Use a database transaction to make the operation atomic
        try:
            with transaction.atomic():
                # Get a fresh, locked copy of the user to prevent race conditions
                user = User.objects.select_for_update().get(pk=user.pk)

                # 1. Check points
                if user.current_points < reward.cost:
                    return Response({"success": False, "message": "Insufficient points."},
                                    status=status.HTTP_400_BAD_REQUEST)
                
                # 2. Check stock (if stock is not null)
                if reward.stock is not None:
                    if reward.stock <= 0:
                        return Response({"success": False, "message": "Reward is out of stock."},
                                        status=status.HTTP_400_BAD_REQUEST)
                    # Decrement stock
                    reward.stock -= 1
                    reward.save(update_fields=['stock'])

                # 3. Deduct points
                user.current_points -= reward.cost
                user.save(update_fields=['current_points'])

                # 4. Create a record of the claim
                ClaimedReward.objects.create(
                    user=user,
                    reward=reward,
                    points_spent=reward.cost,
                    status=ClaimedReward.ClaimStatus.CLAIMED
                )
                
                # Success!
                return Response(
                    {
                        "success": True,
                        "message": f"Successfully claimed {reward.name}!",
                        "remainingPoints": user.current_points # Return updated points
                    },
                    status=status.HTTP_200_OK
                )

        except Exception as e:
            # Catch any other error during the transaction
            print(f"Error during reward claim: {e}")
            return Response({"success": False, "message": "An unexpected error occurred."},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class ClaimedRewardListView(generics.ListAPIView):
    """
    GET /api/shop/claims/
    Returns a list of claimed rewards.
    - Regular users see only their own claims.
    - Admin users (is_admin=True) see all claims.
    """
    serializer_class = ClaimedRewardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Filter the queryset based on the user.
        """
        user = self.request.user
        
        if user.is_admin:
            # Admins see all claims, newest first
            return ClaimedReward.objects.all().select_related('user', 'reward')
        
        # Regular users see only their own claims, newest first
        return ClaimedReward.objects.filter(user=user).select_related('reward')