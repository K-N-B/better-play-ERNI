import msal
import requests
from django.conf import settings
from django.contrib.auth import login, logout
from django.http import JsonResponse
from django.shortcuts import redirect
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from authentication.models import User


def get_msal_app():
    """Initialize MSAL confidential client"""
    return msal.ConfidentialClientApplication(
        settings.AZURE_AD_CLIENT_ID,
        authority=f"https://login.microsoftonline.com/{settings.AZURE_AD_TENANT_ID}",
        client_credential=settings.AZURE_AD_CLIENT_SECRET,
    )


@api_view(['GET'])
@permission_classes([AllowAny])
def get_auth_url(request):
    """Generate Azure AD authorization URL"""
    msal_app = get_msal_app()
    
    auth_url = msal_app.get_authorization_request_url(
        scopes=["User.Read"],
        redirect_uri=settings.AZURE_AD_REDIRECT_URI,
    )
    
    return Response({'auth_url': auth_url})


@csrf_exempt
@require_http_methods(["GET"])
def auth_callback(request):
    """Handle OAuth callback from Azure AD"""
    code = request.GET.get('code')
    error = request.GET.get('error')
    
    # Check if user cancelled or error occurred
    if error:
        error_description = request.GET.get('error_description', 'Authentication failed')
        print(f"OAuth Error: {error} - {error_description}")
        return redirect(f'http://localhost:5173/login?error={error}')
    
    if not code:
        print("No authorization code received")
        return redirect('http://localhost:5173/login?error=no_code')
    
    try:
        print(f"Received auth code: {code[:10]}...")  # Debug log
        
        # Initialize MSAL app
        msal_app = get_msal_app()
        
        # Exchange authorization code for access token
        result = msal_app.acquire_token_by_authorization_code(
            code,
            scopes=["User.Read"],
            redirect_uri=settings.AZURE_AD_REDIRECT_URI,
        )
        
        # Check if token acquisition failed
        if "error" in result:
            error_msg = result.get('error_description', result.get('error'))
            print(f"Token acquisition failed: {error_msg}")
            return redirect(f'http://localhost:5173/login?error=token_failed')
        
        # Get access token
        access_token = result.get('access_token')
        if not access_token:
            print("No access token in result")
            return redirect('http://localhost:5173/login?error=no_token')
        
        print("Access token acquired successfully")
        
        # Fetch user info from Microsoft Graph API
        graph_response = requests.get(
            'https://graph.microsoft.com/v1.0/me',
            headers={'Authorization': f'Bearer {access_token}'},
            timeout=10
        )
        
        if graph_response.status_code != 200:
            print(f"Graph API failed: {graph_response.status_code}")
            print(f"Response: {graph_response.text}")
            return redirect('http://localhost:5173/login?error=graph_failed')
        
        user_data = graph_response.json()
        print(f"User data received: {user_data.get('userPrincipalName')}")
        
        # Extract username safely
        username_base = user_data.get('userPrincipalName') or user_data.get('mail') or user_data.get('id')
        if '@' in username_base:
            username = username_base.split('@')[0]
        else:
            username = username_base
        
        # Ensure username is unique and valid
        username = username[:150]  # Django username max length
        
        # Extract email
        email = user_data.get('mail') or user_data.get('userPrincipalName') or f"{user_data['id']}@unknown.com"
        
        print(f"Creating/updating user: {username}")
        
        # Create or update user in database
        user, created = User.objects.update_or_create(
            azure_id=user_data['id'],
            defaults={
                'email': email,
                'username': username,
                'display_name': user_data.get('displayName', username),
                'first_name': user_data.get('givenName', '')[:30],  # Django max length
                'last_name': user_data.get('surname', '')[:150],    # Django max length
            }
        )
        
        if created:
            print(f"New user created: {user.username}")
        else:
            print(f"Existing user updated: {user.username}")
        
        # Log the user in - this creates the session
        login(request, user, backend='django.contrib.auth.backends.ModelBackend')
        
        # Verify session was created
        print(f"User logged in: {request.user.is_authenticated}")
        print(f"Session key: {request.session.session_key}")
        
        # Redirect to frontend home page
        # The session cookie will be automatically set with this redirect
        return redirect('http://localhost:5173/')
        
    except requests.exceptions.RequestException as e:
        print(f"Network error during auth: {str(e)}")
        return redirect('http://localhost:5173/login?error=network_error')
    
    except Exception as e:
        print(f"Unexpected error in auth_callback: {str(e)}")
        import traceback
        traceback.print_exc()
        return redirect(f'http://localhost:5173/login?error=unexpected_error')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """Get current authenticated user"""
    user = request.user
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'display_name': user.display_name,
        'total_points': user.total_points,
        'avatar_url': user.avatar_url,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Logout user"""
    logout(request)
    return Response({'success': True, 'message': 'Logged out successfully'})


@api_view(['GET'])
@permission_classes([AllowAny])
def check_auth(request):
    """Check if user is authenticated"""
    if request.user.is_authenticated:
        return Response({
            'authenticated': True,
            'user': {
                'id': request.user.id,
                'username': request.user.username,
                'email': request.user.email,
                'display_name': request.user.display_name,
                'total_points': request.user.total_points,
            }
        })
    return Response({'authenticated': False})