# /users/views.py
import msal # For MSAL interaction
import requests # For calling Microsoft Graph API
import urllib.parse # For constructing redirect URLs with errors
from django.conf import settings # To access settings like AZURE_AD_CLIENT_ID
from django.contrib.auth import login, logout # For Django session management
from django.shortcuts import redirect # For redirecting the browser
from rest_framework import generics, permissions, status # Import permissions module
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes # DRF decorators
from rest_framework.response import Response # DRF response object
from users.models import User, Department # Import your models
from users.serializers import UserProfileSerializer, DepartmentSerializer # Import your serializers

# --- MSAL Helper ---
def get_msal_app():
    """ Creates and returns an MSAL Confidential Client Application instance. """
    return msal.ConfidentialClientApplication(
        settings.AZURE_AD_CLIENT_ID,
        authority=f"https://login.microsoftonline.com/{settings.AZURE_AD_TENANT_ID}",
        client_credential=settings.AZURE_AD_CLIENT_SECRET,
    )

# --- Authentication Views ---
from rest_framework import generics # For class-based views
from .serializers import AssignDepartmentSerializer  

@api_view(['GET'])
@permission_classes([AllowAny]) # Anyone can request the login URL
def get_auth_url(request):
    """
    Builds the MSAL authorization request URL to redirect the user to Microsoft.
    Includes prompt=select_account if needed.
    """
    msal_app = get_msal_app()
    auth_url = msal_app.get_authorization_request_url(
        scopes=["User.Read"], # Basic scope to read user profile. Ensure this is granted in Azure.
        redirect_uri=settings.AZURE_AD_REDIRECT_URI, # The /auth/callback/ URL on *this* backend
        extra_query_params={'prompt': 'select_account'} # Force account selection
    )
    print(f"Generated MSAL Auth URL: {auth_url}") # Log for debugging
    return Response({'auth_url': auth_url})


@api_view(['GET'])
@permission_classes([AllowAny]) # Callback is accessed without initial login session
def auth_callback(request):
    """
    Handles the redirect back from Microsoft after user authentication.
    Exchanges the authorization code for tokens, gets user info from Graph API,
    logs the user into Django, and redirects to the frontend callback.
    """
    code = request.GET.get('code')
    error = request.GET.get('error')
    error_description = request.GET.get('error_description', 'Unknown error')

    frontend_base_url = 'http://localhost:5173' # Your React app's base URL
    frontend_login_url = f'{frontend_base_url}/login'
    frontend_callback_url = f'{frontend_base_url}/auth-callback' # Frontend's own callback

    if error:
        print(f"Azure AD Error on callback: {error} - {error_description}")
        # Redirect back to frontend login page with error info
        return redirect(f'{frontend_login_url}?error={error}&desc={urllib.parse.quote(error_description)}')

    if not code:
        return redirect(f'{frontend_login_url}?error=no_code')

    try:
        msal_app = get_msal_app()
        # Exchange the authorization code for an access token
        result = msal_app.acquire_token_by_authorization_code(
            code,
            scopes=["User.Read"], # Must match scope requested earlier
            redirect_uri=settings.AZURE_AD_REDIRECT_URI, # Must match URI used in initial request
        )

        if "error" in result:
            print(f"MSAL Token Acquisition Error: {result.get('error')} - {result.get('error_description')}")
            return redirect(f"{frontend_login_url}?error=token_failed&desc={result.get('error_description', '')}")

        access_token = result.get('access_token')
        if not access_token:
            return redirect(f"{frontend_login_url}?error=no_access_token")

        # Use the access token to get user details from Microsoft Graph API
        graph_url = 'https://graph.microsoft.com/v1.0/me?$select=id,userPrincipalName,mail,displayName,givenName,surname'
        graph_response = requests.get(
            graph_url,
            headers={'Authorization': f'Bearer {access_token}'},
            timeout=10
        )
        graph_response.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)
        user_data = graph_response.json()

        azure_object_id = user_data['id']
        email = user_data.get('mail') or user_data.get('userPrincipalName')
        # Create a fallback username if email isn't available
        username_base = email if email else azure_object_id
        username = username_base.split('@')[0] if '@' in username_base else username_base
        username = username[:150] # Ensure username fits Django model limit

        # Ensure email is set, create a placeholder if necessary but log a warning
        if not email:
            email = f"{azure_object_id}@placeholder.azure.user" # Make it clear it's a placeholder
            print(f"Warning: No email found for Azure user {azure_object_id}. Using placeholder: {email}")

        # Find or create the user in Django database based on Azure Object ID
        user, created = User.objects.update_or_create(
            azure_id=azure_object_id,
            defaults={
                'email': email,
                'username': username, # Use the generated username
                # Use display name or fallback to username if display name is empty
                'first_name': user_data.get('givenName', '')[:150], # Ensure within max_length
                'last_name': user_data.get('surname', '')[:150], # Ensure within max_length
                # Set user as active by default
                'is_active': True,
            }
        )

        # Log the user into Django (creates the session cookie)
        # Use ModelBackend as we are managing the user lookup ourselves here
        login(request, user, backend='django.contrib.auth.backends.ModelBackend')
        print(f"User '{user.username}' (AzureID: {azure_object_id}) logged in successfully via Azure AD. Created: {created}.")

        # Redirect to the frontend's callback URL, which will then call /auth/check/
        return redirect(frontend_callback_url)

    except requests.exceptions.RequestException as e:
        print(f"MS Graph API Request Error: {str(e)}")
        return redirect(f'{frontend_login_url}?error=graph_failed')
    except Exception as e:
        print(f"Auth Callback - Unexpected Error: {str(e)}")
        import traceback
        traceback.print_exc() # Print full traceback for debugging
        return redirect(f'{frontend_login_url}?error=unexpected_error')


@api_view(['GET'])
@permission_classes([IsAuthenticated]) # Secure this endpoint: requires valid session cookie
def check_auth(request):
    """
    Checks if the current request is associated with an authenticated session.
    If yes, returns the user's profile data using UserProfileSerializer.
    """
    if request.user.is_authenticated:
        serializer = UserProfileSerializer(request.user)
        return Response({'authenticated': True, 'user': serializer.data})
    else:
        # This part should not be reached if IsAuthenticated works correctly
        return Response({'authenticated': False, 'user': None}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([IsAuthenticated]) # Must be logged in to logout
def logout_view(request):
    """ Logs the user out of the Django session. """
    print(f"Logging out user: {request.user.username}")
    logout(request) # Clears the Django session
    # Frontend will handle redirect after check_auth fails on next load
    return Response({'success': True, 'message': 'Logged out successfully'}, status=status.HTTP_200_OK)


# --- Profile API Views ---

class DepartmentListView(generics.ListAPIView):
    """ GET /api/departments/ - Returns a list of all departments. """
    queryset = Department.objects.all().order_by('name')
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated] # User must be logged in

class CompleteProfileView(generics.GenericAPIView):
    """ POST /api/users/me/complete-profile/ - Updates department and profile_complete flag. """
    serializer_class = UserProfileSerializer # For response serialization
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def post(self, request, *args, **kwargs):
        user = self.get_object()
        department_id = request.data.get('department_id')

        if user.profile_complete:
            return Response({'message': 'Profile already completed.'}, status=status.HTTP_400_BAD_REQUEST)
        if not department_id:
            return Response({'error': 'department_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            department = Department.objects.get(id=int(department_id))
            user.department = department
            user.profile_complete = True
            user.save(update_fields=['department', 'profile_complete'])
            serializer = self.get_serializer(user)
            print(f"User '{user.username}' completed profile with department '{department.name}'.")
            return Response(serializer.data)
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