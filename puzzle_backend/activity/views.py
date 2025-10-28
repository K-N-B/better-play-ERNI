# activity/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .services import ActivityService
from .serializers import ActivityHubResponseSerializer


class ActivityHubView(APIView):
    """
    GET /api/activity-hub/
    
    Returns combined data for activity feed:
    - recent_activity: Last 20 puzzle completions from last 24 hours
    - online_users: Users active in last 5 minutes
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Get all activity data
            data = ActivityService.get_activity_hub_data()
            
            # Serialize response
            serializer = ActivityHubResponseSerializer(data)
            
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response(
                {'error': f'Failed to retrieve activity data: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class HeartbeatView(APIView):
    """
    POST /api/heartbeat/
    
    Updates user's last_active timestamp.
    Called every 30 seconds by frontend to maintain "online" status.
    
    No body required - just needs authenticated request.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            user = request.user
            
            # Update heartbeat
            ActivityService.update_user_heartbeat(user)
            
            return Response(
                {'success': True, 'message': 'Heartbeat recorded'},
                status=status.HTTP_200_OK
            )
        
        except Exception as e:
            return Response(
                {'error': f'Failed to record heartbeat: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )