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
    return msal.ConfidentialClientApplication(
        settings.AZURE_AD_CLIENT_ID,
        authority=f"https://login.microsoftonline.com/{settings.AZURE_AD_TENANT_ID}",
        client_credential=settings.AZURE_AD_CLIENT_SECRET,
    )


@api_view(['GET'])
@permission_classes([AllowAny])
def get_auth_url(request):
    msal_app = get_msal_app()
    auth_url = msal_app.get_authorization_request_url(
        scopes=["User.Read"],
        redirect_uri=settings.AZURE_AD_REDIRECT_URI,
    )
    return Response({'auth_url': auth_url})


@csrf_exempt
@require_http_methods(["GET"])
def auth_callback(request):
    code = request.GET.get('code')
    error = request.GET.get('error')
    
    if error:
        return redirect(f'http://localhost:5173/login?error={error}')
    
    if not code:
        return redirect('http://localhost:5173/login?error=no_code')
    
    try:
        msal_app = get_msal_app()
        result = msal_app.acquire_token_by_authorization_code(
            code,
            scopes=["User.Read"],
            redirect_uri=settings.AZURE_AD_REDIRECT_URI,
        )
        
        if "error" in result:
            return redirect('http://localhost:5173/login?error=token_failed')
        
        access_token = result.get('access_token')
        graph_response = requests.get(
            'https://graph.microsoft.com/v1.0/me',
            headers={'Authorization': f'Bearer {access_token}'},
            timeout=10
        )
        
        if graph_response.status_code != 200:
            return redirect('http://localhost:5173/login?error=graph_failed')
        
        user_data = graph_response.json()
        
        username_base = user_data.get('userPrincipalName') or user_data.get('mail') or user_data.get('id')
        if '@' in username_base:
            username = username_base.split('@')[0]
        else:
            username = username_base
        
        username = username[:150]
        email = user_data.get('mail') or user_data.get('userPrincipalName') or f"{user_data['id']}@unknown.com"
        
        user, created = User.objects.update_or_create(
            azure_id=user_data['id'],
            defaults={
                'email': email,
                'username': username,
                'display_name': user_data.get('displayName', username),
                'first_name': user_data.get('givenName', '')[:30],
                'last_name': user_data.get('surname', '')[:150],
            }
        )
        
        login(request, user, backend='django.contrib.auth.backends.ModelBackend')
        return redirect('http://localhost:5173/')
        
    except Exception as e:
        print(f"Auth error: {str(e)}")
        return redirect('http://localhost:5173/login?error=unexpected_error')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
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
@permission_classes([AllowAny])
def logout_view(request):
    try:
        logout(request)
        request.session.flush()
        return Response({'success': True, 'message': 'Logged out successfully'})
    except Exception as e:
        return Response({'success': False, 'message': 'Logout failed'}, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def check_auth(request):
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