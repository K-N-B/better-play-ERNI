from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

# Import all the models we need
from users.models import User

from .models import ClaimedReward, Reward

# Get the custom User model
User = get_user_model()


class ShopBaseTestCase(APITestCase):
    """
    Sets up a base test environment for the shop.

    We use setUp(self) instead of setUpTestData(cls) because
    tests will be modifying user points and item stock,
    and we need a fresh environment for every single test.
    """

    def setUp(self):
        # Create a regular user with points
        self.user = User.objects.create_user(
            username='shoptester',
            email='shop@example.com',
            password='password123',
            profile_complete=True,
            current_points=1000,  # Give them starting points
        )

        # Create an admin user
        self.admin_user = User.objects.create_user(
            username='shopadmin',
            email='admin@example.com',
            password='password123',
            profile_complete=True,
            is_admin=True,  # Use the custom field from your user model
            is_staff=True,
            is_superuser=True,
            current_points=1000,
        )

        # --- Create Test Rewards ---

        # A standard item with infinite stock
        self.item_infinite = Reward.objects.create(
            name="Sticker",
            description="A cool sticker.",
            cost=100,
            stock=None,  # Infinite stock
            is_active=True,
        )

        # An item with limited stock (only 1)
        self.item_limited_stock = Reward.objects.create(
            name="Mug",
            description="A rare mug.",
            cost=200,
            stock=1,  # Only 1 in stock
            is_active=True,
        )

        # An item with a claim limit (only 1)
        self.item_limited_claims = Reward.objects.create(
            name="T-Shirt",
            description="A special T-Shirt.",
            cost=50,
            stock=None,
            max_claims_per_user=1,  # Only 1 claim per user
            is_active=True,
        )

        # An inactive (hidden) item
        self.item_inactive = Reward.objects.create(
            name="Old Poster",
            description="No longer available.",
            cost=10,
            stock=10,
            is_active=False,  # Not active
        )


class RewardListViewTests(ShopBaseTestCase):
    """
    Tests for GET /api/shop/rewards/
    """

    def test_list_rewards_unauthenticated(self):
        """GATE: Does it block unauthenticated users?"""
        url = reverse('reward-list')
        response = self.client.get(url)

        # DRF's IsAuthenticated returns 401 or 403
        self.assertIn(
            response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]
        )

    def test_list_rewards_success(self):
        """GATE: Does it return a list of rewards?"""
        self.client.force_authenticate(user=self.user)
        url = reverse('reward-list')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)  # Should be 3 active items

    def test_list_rewards_only_shows_active_items(self):
        """GATE: Does it correctly filter out inactive items?"""
        self.client.force_authenticate(user=self.user)
        url = reverse('reward-list')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check that we got 3 items
        self.assertEqual(len(response.data), 3)

        # Check that the inactive item's name is not in the response
        item_names = [item['name'] for item in response.data]
        self.assertNotIn("Old Poster", item_names)


class ClaimRewardViewTests(ShopBaseTestCase):
    """
    Tests for POST /api/shop/claim/<int:reward_id>/
    This is the most critical part of the shop.
    """

    def test_claim_reward_unauthenticated(self):
        """GATE: Does it block unauthenticated users?"""
        url = reverse('claim-reward', kwargs={'reward_id': self.item_infinite.id})
        response = self.client.post(url)
        self.assertIn(
            response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]
        )

    def test_claim_reward_not_found(self):
        """GATE: Does it return 404 for a non-existent reward ID?"""
        self.client.force_authenticate(user=self.user)
        url = reverse('claim-reward', kwargs={'reward_id': 9999})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_claim_reward_inactive(self):
        """GATE: Does it return 404 for an inactive reward?"""
        self.client.force_authenticate(user=self.user)
        url = reverse('claim-reward', kwargs={'reward_id': self.item_inactive.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_claim_reward_fails_insufficient_points(self):
        """GATE: Does it block a user with not enough points?"""
        self.client.force_authenticate(user=self.user)

        # User has 1000 points, set item cost to 2000
        self.item_infinite.cost = 2000
        self.item_infinite.save()

        url = reverse('claim-reward', kwargs={'reward_id': self.item_infinite.id})
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['success'], False)
        self.assertIn("Insufficient points", response.data['message'])

        # Check that no transaction was created
        self.assertEqual(ClaimedReward.objects.count(), 0)

        # Check that user's points were NOT deducted
        self.user.refresh_from_db()
        self.assertEqual(self.user.current_points, 1000)

    def test_claim_reward_fails_out_of_stock(self):
        """GATE: Does it block a user from claiming an out-of-stock item?"""
        self.client.force_authenticate(user=self.user)

        # Set item stock to 0
        self.item_limited_stock.stock = 0
        self.item_limited_stock.save()

        url = reverse('claim-reward', kwargs={'reward_id': self.item_limited_stock.id})
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['success'], False)
        self.assertIn("out of stock", response.data['message'])
        self.assertEqual(ClaimedReward.objects.count(), 0)

    def test_claim_reward_fails_max_claims_reached(self):
        """GATE: Does it block a user who has reached the claim limit?"""
        self.client.force_authenticate(user=self.user)

        # User (1000 pts) claims the item (50 pts, max 1)
        url = reverse('claim-reward', kwargs={'reward_id': self.item_limited_claims.id})
        response1 = self.client.post(url)
        self.assertEqual(response1.status_code, status.HTTP_200_OK)
        self.assertEqual(ClaimedReward.objects.count(), 1)

        # Check user points
        self.user.refresh_from_db()
        self.assertEqual(self.user.current_points, 950)

        # --- Second Attempt ---
        # User (950 pts) tries to claim the *same* item again
        response2 = self.client.post(url)

        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response2.data['success'], False)
        self.assertIn("Claim limit reached", response2.data['message'])

        # Check that no new transaction was created
        self.assertEqual(ClaimedReward.objects.count(), 1)

        # Check that points were not deducted a second time
        self.user.refresh_from_db()
        self.assertEqual(self.user.current_points, 950)

    def test_claim_reward_success_infinite_stock(self):
        """GATE: Does a successful claim deduct points and create a record?"""
        self.client.force_authenticate(user=self.user)

        # User has 1000 points, item costs 100
        url = reverse('claim-reward', kwargs={'reward_id': self.item_infinite.id})
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['success'], True)
        self.assertEqual(response.data['remainingPoints'], 900)

        # Check database
        self.assertEqual(ClaimedReward.objects.count(), 1)

        # Check user points were deducted
        self.user.refresh_from_db()
        self.assertEqual(self.user.current_points, 900)

        # Check item stock (should be None/infinite, so unchanged)
        self.item_infinite.refresh_from_db()
        self.assertIsNone(self.item_infinite.stock)

    def test_claim_reward_success_limited_stock(self):
        """GATE: Does a successful claim deduct stock?"""
        self.client.force_authenticate(user=self.user)

        # User has 1000 points, item (Mug) costs 200 and has stock=1
        self.assertEqual(self.item_limited_stock.stock, 1)

        url = reverse('claim-reward', kwargs={'reward_id': self.item_limited_stock.id})
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['remainingPoints'], 800)

        # Check stock was decremented
        self.item_limited_stock.refresh_from_db()
        self.assertEqual(self.item_limited_stock.stock, 0)

        # Check user points
        self.user.refresh_from_db()
        self.assertEqual(self.user.current_points, 800)


class ClaimedRewardListViewTests(ShopBaseTestCase):
    """
    Tests for GET /api/shop/claims/
    """

    def setUp(self):
        # We need a setup *in addition* to the base setup
        # to create some claims
        super().setUp()

        # User 1 (self.user) claims two items
        ClaimedReward.objects.create(
            user=self.user, reward=self.item_infinite, points_spent=self.item_infinite.cost
        )
        ClaimedReward.objects.create(
            user=self.user,
            reward=self.item_limited_claims,
            points_spent=self.item_limited_claims.cost,
        )

        # User 2 (self.admin_user) claims one item
        ClaimedReward.objects.create(
            user=self.admin_user, reward=self.item_infinite, points_spent=self.item_infinite.cost
        )

    def test_list_claims_unauthenticated(self):
        """GATE: Does it block unauthenticated users?"""
        url = reverse('claimed-reward-list')
        response = self.client.get(url)
        self.assertIn(
            response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]
        )

    def test_list_claims_as_regular_user(self):
        """GATE: Does a regular user see *only* their own claims?"""
        self.client.force_authenticate(user=self.user)
        url = reverse('claimed-reward-list')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # User should only see their 2 claims
        self.assertEqual(len(response.data), 2)

        # Check that the data belongs to them
        self.assertEqual(response.data[0]['user']['username'], 'shoptester')
        self.assertEqual(response.data[1]['user']['username'], 'shoptester')

    def test_list_claims_as_admin_user(self):
        """GATE: Does an admin user see *all* claims?"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('claimed-reward-list')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Admin user should see all 3 claims
        self.assertEqual(len(response.data), 3)

        # Check that we see both users' claims
        usernames = {claim['user']['username'] for claim in response.data}
        self.assertEqual(usernames, {'shoptester', 'shopadmin'})
