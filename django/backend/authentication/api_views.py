from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .validators import validate_email_comprehensive

@api_view(['POST'])
@permission_classes([AllowAny])
def validate_email_endpoint(request):
    """
    API endpoint to validate email before registration
    POST /api/auth/validate-email/
    Body: {"email": "user@betterask.erni"}
    """
    email = request.data.get('email')
    
    if not email:
        return Response(
            {'valid': False, 'error': 'Email is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    is_valid, error_msg = validate_email_comprehensive(email)
    
    if is_valid:
        return Response({
            'valid': True,
            'message': 'Email is valid'
        })
    else:
        return Response({
            'valid': False,
            'error': error_msg
        }, status=status.HTTP_400_BAD_REQUEST)