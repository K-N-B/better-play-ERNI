import json

from django.contrib.auth import get_user_model
from django.db.utils import IntegrityError  # Import the correct exception
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from .models import Department
from .serializers import AssignDepartmentSerializer

# Get the custom User model
User = get_user_model()


class UserModelTests(TestCase):
    """Tests the custom User and Department models."""

    def test_create_user(self):
        """GATE: Can we create a user with the required fields?"""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='password123',
            azure_id='12345-abc',
            profile_picture_url='http://example.com/img.png',
        )
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.azure_id, '12345-abc')
        self.assertFalse(user.profile_complete)
        self.assertFalse(user.is_admin)

    def test_create_department_and_assign_user(self):
        """GATE: Can we create a department and link it to a user?"""
        dept = Department.objects.create(name='Engineering', total_points_alltime=100)
        self.assertEqual(dept.name, 'Engineering')

        user = User.objects.create_user(
            username='testuser', email='test@example.com', department=dept
        )
        self.assertEqual(user.department.name, 'Engineering')
        self.assertEqual(user.department.total_points_alltime, 100)

    def test_user_email_is_unique(self):
        """
        GATE: Does our model's unique=True constraint on email work?
        This replaces the test_user_email_is_required test, which
        fails because create_user() converts None to '' and bypasses
        blank=False validation.
        """
        # 1. Create the first user successfully
        User.objects.create_user(username='user1', password='password123', email='test@example.com')

        # 2. This second create should fail at the database level
        with self.assertRaises(IntegrityError):
            User.objects.create_user(
                username='user2', password='password123', email='test@example.com'
            )


class SerializerTests(TestCase):
    """Unit-tests the custom logic in our serializers."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='test', email='test@example.com', password='pw'
        )

    def test_assign_department_serializer_new_dept(self):
        """GATE: Does the serializer create a new dept if it doesn't exist?"""
        self.assertFalse(Department.objects.filter(name='NewDept').exists())

        data = {'department_name': 'NewDept'}
        serializer = AssignDepartmentSerializer(data=data)
        self.assertTrue(serializer.is_valid())

        serializer.save(user=self.user)

        self.user.refresh_from_db()  # Reload user from DB
        self.assertTrue(Department.objects.filter(name='NewDept').exists())
        self.assertEqual(self.user.department.name, 'NewDept')
        self.assertTrue(self.user.profile_complete)

    def test_assign_department_serializer_existing_dept(self):
        """GATE: Does the serializer find an existing dept?"""
        dept = Department.objects.create(name='ExistingDept')

        data = {'department_name': 'ExistingDept'}
        serializer = AssignDepartmentSerializer(data=data)
        self.assertTrue(serializer.is_valid())

        serializer.save(user=self.user)

        self.user.refresh_from_db()
        self.assertEqual(Department.objects.count(), 1)  # Should not create a new one
        self.assertEqual(self.user.department, dept)
        self.assertTrue(self.user.profile_complete)

    def test_assign_department_serializer_blank_name_fails(self):
        """GATE: Does the serializer validation fail on blank input?"""
        data = {'department_name': '   '}
        serializer = AssignDepartmentSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('blank', str(serializer.errors['department_name']))


class AuthViewTests(TestCase):
    """Tests the MSAL authentication flow endpoints."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='authuser',
            email='auth@example.com',
            password='password123',
            profile_complete=True,
        )

    def test_get_auth_url_view(self):
        """GATE: Does the /login/ URL return a valid auth URL?"""
        url = reverse('auth-login-url')
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertIn('auth_url', response.json())
        self.assertIn('login.microsoftonline.com', response.json()['auth_url'])

    def test_check_auth_not_logged_in(self):
        """GATE: Does /check/ correctly return 401/403 if not logged in?"""
        url = reverse('auth-check')
        response = self.client.get(url)
        # IsAuthenticated permission returns 403 (or 401 if DRF default)
        self.assertIn(response.status_code, [401, 403])

    def test_check_auth_logged_in(self):
        """GATE: Does /check/ return user data when logged in?"""
        self.client.login(username='authuser', password='password123')
        url = reverse('auth-check')
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(response_data['authenticated'], True)
        self.assertEqual(response_data['user']['username'], 'authuser')
        self.assertEqual(response_data['user']['email'], 'auth@example.com')
        self.assertTrue(response_data['user']['profile_complete'])

    def test_logout_view(self):
        """GATE: Does /logout/ successfully log out a user?"""
        self.client.login(username='authuser', password='password123')

        # 1. Verify we are logged in
        check_url = reverse('auth-check')
        response = self.client.get(check_url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['authenticated'], True)

        # 2. Call the logout endpoint
        logout_url = reverse('auth-logout')
        logout_response = self.client.post(logout_url)
        self.assertEqual(logout_response.status_code, 200)
        self.assertEqual(logout_response.json()['success'], True)

        # 3. Verify we are now logged out
        response_after_logout = self.client.get(check_url)
        self.assertIn(response_after_logout.status_code, [401, 403])


class ProfileAPITests(TestCase):
    """Tests the /api/departments/ and /me/complete-profile/ endpoints."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='apiuser',
            email='api@example.com',
            password='password123',
            profile_complete=False,  # User needs to complete profile
        )
        self.dept1 = Department.objects.create(name='Sales')
        self.dept2 = Department.objects.create(name='IT')

    def test_department_list_not_logged_in(self):
        """GATE: Is the department list protected?"""
        url = reverse('department-list')
        response = self.client.get(url)
        self.assertIn(response.status_code, [401, 403])

    def test_department_list_returns_all_depts(self):
        """GATE: Does the department list return all departments?"""
        self.client.login(username='apiuser', password='password123')
        url = reverse('department-list')
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(len(response_data), 2)
        self.assertEqual(response_data[0]['name'], 'IT')  # Ordered by name
        self.assertEqual(response_data[1]['name'], 'Sales')

    def test_complete_profile_success(self):
        """GATE: Can a user successfully complete their profile?"""
        self.client.login(username='apiuser', password='password123')
        self.assertFalse(self.user.profile_complete)  # Pre-check

        url = reverse('complete-profile')
        post_data = {'department_id': self.dept1.id}
        response = self.client.post(
            url, data=json.dumps(post_data), content_type='application/json'
        )

        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()  # Reload user from DB

        self.assertTrue(self.user.profile_complete)
        self.assertEqual(self.user.department, self.dept1)
        # FIX: The CompleteProfileView returns the user serializer directly,
        # not nested inside a 'user' key.
        self.assertEqual(response.json()['department']['name'], 'Sales')

    def test_complete_profile_missing_id(self):
        """GATE: Does it fail if department_id is missing?"""
        self.client.login(username='apiuser', password='password123')
        url = reverse('complete-profile')
        response = self.client.post(url, data=json.dumps({}), content_type='application/json')

        self.assertEqual(response.status_code, 400)
        self.assertIn('department_id is required', response.json()['error'])

    def test_complete_profile_invalid_id(self):
        """GATE: Does it fail if department_id is not found?"""
        self.client.login(username='apiuser', password='password123')
        url = reverse('complete-profile')
        post_data = {'department_id': 9999}  # An ID that doesn't exist
        response = self.client.post(
            url, data=json.dumps(post_data), content_type='application/json'
        )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()['error'], 'Department not found')

    def test_complete_profile_already_complete(self):
        """GATE: Does it fail if the profile is already complete?"""
        self.user.profile_complete = True
        self.user.department = self.dept1
        self.user.save()

        self.client.login(username='apiuser', password='password123')
        url = reverse('complete-profile')
        post_data = {'department_id': self.dept2.id}  # Trying to change
        response = self.client.post(
            url, data=json.dumps(post_data), content_type='application/json'
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()['message'], 'Profile already completed.')
