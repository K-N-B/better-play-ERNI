# activity/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .services import ActivityService
from .serializers import ActivityHubResponseSerializer


class ActivityHubView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            print(f"🔍 [ActivityHub] Request from: {request.user.username}")
            data = ActivityService.get_activity_hub_data()
            
            online_usernames = [u.username for u in data['online_users']]
            print(f"👥 [ActivityHub] Online users: {online_usernames}")
            
            serializer = ActivityHubResponseSerializer(data)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"❌ [ActivityHub] Error: {str(e)}")
            return Response(
                {'error': f'Failed to retrieve activity data: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(csrf_exempt, name='dispatch')  # ✅ Exempt from CSRF
class HeartbeatView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            user = request.user
            print(f"💓 [Heartbeat] Received from: {user.username}")
            
            ActivityService.update_user_heartbeat(user)
            
            print(f"✅ [Heartbeat] Updated for: {user.username}")
            return Response(
                {'success': True, 'message': 'Heartbeat recorded'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            print(f"❌ [Heartbeat] Error: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Failed to record heartbeat: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )