
from django.utils.deprecation import MiddlewareMixin

class DisableCSRFForHeartbeat(MiddlewareMixin):
    """
    Disable CSRF checking for heartbeat endpoint.
    Heartbeat is a frequent background operation protected by session auth.
    """
    def process_request(self, request):
        if request.path == '/api/heartbeat/':
            setattr(request, '_dont_enforce_csrf_checks', True)