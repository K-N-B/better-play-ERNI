from django.http import JsonResponse, HttpResponseRedirect
from django.contrib.auth import login, logout
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
import msal
import os
import requests

# Azure AD Configuration
CLIENT_ID = os.getenv('AZURE_AD_CLIENT_ID')
CLIENT_SECRET = os.getenv('AZURE_AD_CLIENT_SECRET')
TENANT_ID = os.getenv('AZURE_AD_TENANT_ID')
AUTHORITY = f"https://login.microsoftonline.com/{TENANT_ID}"
REDIRECT_URI = "http://localhost:8000/auth/callback"
SCOPES = ["User.Read"]


@api_view(['GET'])
@permission_classes([AllowAny])
def login_view(request):
    """
    GET /auth/login/
    Generates the Azure AD authorization URL.
    Frontend redirects user to this URL.
    """
    msal_app = msal.ConfidentialClientApplication(
        CLIENT_ID,
        authority=AUTHORITY,
        client_credential=CLIENT_SECRET,
    )
    
    auth_url = msal_app.get_authorization_request_url(
        SCOPES,
        redirect_uri=REDIRECT_URI,
    )
    
    return JsonResponse({'auth_url': auth_url})


@csrf_exempt
@require_http_methods(["GET"])
def callback_view(request):
    """
    GET /auth/callback?code=...
    Handles the OAuth callback from Azure AD.
    Exchanges code for token, fetches user info, creates/updates user.
    """
    code = request.GET.get('code')
    
    if not code:
        return HttpResponseRedirect('http://localhost:5173/login?error=no_code')
    
    # Exchange code for token
    msal_app = msal.ConfidentialClientApplication(
        CLIENT_ID,
        authority=AUTHORITY,
        client_credential=CLIENT_SECRET,
    )
    
    result = msal_app.acquire_token_by_authorization_code(
        code,
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI
    )
    
    if "access_token" not in result:
        return HttpResponseRedirect('http://localhost:5173/login?error=token_failed')
    
    # Fetch user info from Microsoft Graph
    graph_response = requests.get(
        'https://graph.microsoft.com/v1.0/me',
        headers={'Authorization': f"Bearer {result['access_token']}"}
    )
    
    if graph_response.status_code != 200:
        return HttpResponseRedirect('http://localhost:5173/login?error=graph_failed')
    
    user_data = graph_response.json()
    
    # Get or create user
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    # Extract user info with fallbacks
    azure_id = user_data.get('id')
    email = user_data.get('mail') or user_data.get('userPrincipalName') or f"{azure_id}@unknown.com"
    display_name = user_data.get('displayName', 'Unknown User')
    
    # Create username from email
    username_base = email.split('@')[0] if '@' in email else azure_id
    username = username_base[:150]  # Django username max length
    
    user, created = User.objects.get_or_create(
        azure_id=azure_id,
        defaults={
            'username': username,
            'email': email,
            'display_name': display_name,
            'first_name': user_data.get('givenName', '')[:30],
            'last_name': user_data.get('surname', '')[:150],
        }
    )
    
    if not created:
        # Update existing user info
        user.email = email
        user.display_name = display_name
        user.save()
    
    # Log the user in
    login(request, user)
    
    # Redirect to frontend home
    return HttpResponseRedirect('http://localhost:5173/')


@api_view(['POST'])
@permission_classes([AllowAny])
def logout_view(request):
    """
    POST /auth/logout/
    Logs out the user and clears the session.
    """
    logout(request)
    return JsonResponse({'message': 'Logged out successfully'})


@api_view(['GET'])
@permission_classes([AllowAny])
def check_auth(request):
    """
    GET /auth/check/
    Checks if the user is authenticated.
    """
    if request.user.is_authenticated:
        return JsonResponse({
            'authenticated': True,
            'user': {
                'id': request.user.id,
                'username': request.user.username,
                'email': request.user.email,
                'display_name': getattr(request.user, 'display_name', ''),
            }
        })
    return JsonResponse({'authenticated': False})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user(request):
    """
    GET /auth/user/
    Returns the current authenticated user's data.
    """
    user = request.user
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'display_name': getattr(user, 'display_name', ''),
        'avatar_url': getattr(user, 'avatar_url', None),
        'total_points_alltime': getattr(user, 'total_points_alltime', 0),
        'current_streak_count': getattr(user, 'current_streak_count', 0),
        'max_streak_count': getattr(user, 'max_streak_count', 0),
    })