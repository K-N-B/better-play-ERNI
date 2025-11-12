
from django.utils.deprecation import MiddlewareMixin

class DisableCSRFForHeartbeat(MiddlewareMixin):
    """
    Disable CSRF checking for frequent background operations.
    These endpoints are protected by session authentication.
    """
    def process_request(self, request):
        # List of paths to exempt from CSRF
        exempt_paths = [
            '/api/heartbeat/',
        ]
        
        if request.path in exempt_paths or request.path.startswith('/api/gameplay/'):
            setattr(request, '_dont_enforce_csrf_checks', True)