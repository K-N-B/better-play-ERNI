from rest_framework import viewsets
from .models import DailyPuzzle
from .serializers import DailyPuzzleSerializer
from rest_framework.permissions import AllowAny  # change later

class DailyPuzzleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DailyPuzzle.objects.select_related('wordle','sudoku','ernigram').all()
    serializer_class = DailyPuzzleSerializer
    permission_classes = [AllowAny]  # for front-end testing switch to IsAuthenticated later
