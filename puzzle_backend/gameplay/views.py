from rest_framework import viewsets
from .models import PuzzleAttempt
from .serializers import PuzzleAttemptSerializer
from rest_framework.permissions import IsAuthenticated

class PuzzleAttemptViewSet(viewsets.ModelViewSet):
    queryset = PuzzleAttempt.objects.all()
    serializer_class = PuzzleAttemptSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
