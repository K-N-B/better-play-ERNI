# /users/views.py
from django.conf import settings
from django.contrib.auth import logout
from django.shortcuts import redirect # Import redirect if needed elsewhere
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Department, User # Import your models
from .serializers import DepartmentSerializer, UserProfileSerializer # Import your serializers
import urllib.parse
from rest_framework import generics # For class-based views
from .serializers import AssignDepartmentSerializer  

@api_view(['GET'])
@permission_classes([permissions.AllowAny]) # Anyone can request the login URL
def get_login_redirect_url(request):
    """
    Builds the Microsoft login URL using social-auth's named URL
    and returns it as JSON for the frontend Login button.
    """
    base_url = f"https://login.microsoftonline.com/{settings.SOCIAL_AUTH_AZUREAD_OAUTH2_TENANT_ID}/oauth2/v2.0/authorize"

    params = {
        'client_id': settings.SOCIAL_AUTH_AZUREAD_OAUTH2_CLIENT_ID,
        'response_type': 'code',
        'redirect_uri': request.build_absolute_uri('/auth/complete/azuread-oauth2/'), # Build absolute URI
        'scope': 'User.Read openid email profile', # Add openid, email, profile scopes
        'response_mode': 'query',
        # --- ADD THIS LINE ---
        'prompt': 'select_account', # Forces the Microsoft account selection screen
        # --- END ADDITION ---
    }
    # Construct the URL to Django's view that starts the OAuth flow
    # This comes from adding social_django.urls with namespace='social'
    # It redirects the user TO Microsoft's login page
    auth_url = f"{base_url}?{urllib.parse.urlencode(params)}"
    print(f"Generated Auth URL: {auth_url}") # Add logging for debugging
    return Response({'auth_url': auth_url})

# Note: The actual /auth/complete/azuread-oauth2/ callback is handled
# automatically by social-auth-app-django. We don't need a view for it.
# social-auth handles the code exchange, user creation/login, session setup,
# and then redirects to settings.LOGIN_REDIRECT_URL (your frontend callback).

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated]) # Must be logged in (have valid session cookie)
def check_auth(request):
    """
    Checks if the request has a valid session cookie.
    If yes, returns the user's profile data.
    Used by the frontend's AuthContext and AuthCallback.
    """
    serializer = UserProfileSerializer(request.user)
    return Response({'authenticated': True, 'user': serializer.data})

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated]) # Must be logged in
def logout_user(request):
    """
    Logs the user out (destroys the session) via Django's logout function.
    """
    logout(request)
    # Redirects handled implicitly by settings.LOGOUT_REDIRECT_URL via frontend response
    return Response(status=status.HTTP_204_NO_CONTENT) # No content needed on success

# --- Profile APIs (Class-Based Views for DRF standards) ---

class DepartmentListView(generics.ListAPIView):
    """
    GET /api/departments/
    Returns a list of all available departments.
    Used by the FirstTimeSetupModal.
    """
    queryset = Department.objects.all().order_by('name') # Get all departments, ordered
    serializer_class = DepartmentSerializer
    permission_classes = [permissions]
    
class CompleteProfileView(generics.GenericAPIView):
    """
    POST /api/users/me/complete-profile/
    Updates the logged-in user's department and sets profile_complete=True.
    Used by the FirstTimeSetupModal.
    """
    serializer_class = UserProfileSerializer # Used to serialize the response
    permission_classes = [permissions.IsAuthenticated] # User must be logged in

    def get_object(self):
        # The object we are updating is the currently logged-in user
        return self.request.user

    def post(self, request, *args, **kwargs):
        user = self.get_object()
        department_id = request.data.get('department_id') # Get ID from JSON request body

        # Prevent updating if profile is already complete
        if user.profile_complete:
             return Response({'message': 'Profile already completed.'}, status=status.HTTP_400_BAD_REQUEST)

        # Basic validation
        if not department_id:
            return Response({'error': 'department_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Convert department_id to integer and fetch the Department object
            department = Department.objects.get(id=int(department_id))
            user.department = department
            user.profile_complete = True
            user.save(update_fields=['department', 'profile_complete']) # Only update these fields
            serializer = self.get_serializer(user) # Serialize the updated user data
            return Response(serializer.data) # Return updated user profile
        except Department.DoesNotExist:
            return Response({'error': 'Department not found'}, status=status.HTTP_404_NOT_FOUND)
        except (ValueError, TypeError):
             return Response({'error': 'Invalid department_id format'}, status=status.HTTP_400_BAD_REQUEST)
        

from .serializers import DepartmentSerializer, UserProfileSerializer, AssignDepartmentSerializer
class AssignDepartmentView(generics.GenericAPIView):
    """
    POST /api/users/assign-department/
    Assigns or creates a department for the logged-in user.
    Triggered when frontend detects the user has no department yet.
    """
    serializer_class = AssignDepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)  # ✅ works now
        serializer.is_valid(raise_exception=True)
        user = serializer.save(user=request.user)
        return Response(UserProfileSerializer(user).data, status=status.HTTP_200_OK)