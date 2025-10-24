from rest_framework import viewsets, permissions
from .models import (
    WordlePuzzle,
    SudokuPuzzle,
    ErnigramPuzzle,
    DailyPuzzle,
    PuzzleAttempt
)
from .serializers import (
    WordlePuzzleSerializer,
    SudokuPuzzleSerializer,
    ErnigramPuzzleSerializer,
    DailyPuzzleSerializer,
    PuzzleAttemptSerializer
)

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admin users to edit objects.
    """
    def has_permission(self, request, view):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to admin users.
        return request.user and request.user.is_staff

class WordlePuzzleViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows Wordle puzzles to be viewed or edited.
    """
    queryset = WordlePuzzle.objects.all().order_by('-date_to_be_used')
    serializer_class = WordlePuzzleSerializer
    permission_classes = [IsAdminOrReadOnly]

class SudokuPuzzleViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows Sudoku puzzles to be viewed or edited.
    """
    queryset = SudokuPuzzle.objects.all().order_by('-date_to_be_used')
    serializer_class = SudokuPuzzleSerializer
    permission_classes = [IsAdminOrReadOnly]

class ErnigramPuzzleViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows Ernigram puzzles to be viewed or edited.
    """
    queryset = ErnigramPuzzle.objects.all().order_by('-date_to_be_used')
    serializer_class = ErnigramPuzzleSerializer
    permission_classes = [IsAdminOrReadOnly]

class DailyPuzzleViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows the set of daily puzzles to be viewed or edited.
    It prefetches related puzzles to optimize database queries.
    """
    queryset = DailyPuzzle.objects.select_related(
        'wordle_easy', 'wordle_hard', 'sudoku', 'ernigram'
    ).all().order_by('-date')
    serializer_class = DailyPuzzleSerializer
    permission_classes = [IsAdminOrReadOnly]

class PuzzleAttemptViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows puzzle attempts to be viewed or edited by the user who owns them.
    """
    serializer_class = PuzzleAttemptSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        This view should return a list of all the puzzle attempts
        for the currently authenticated user.
        """
        user = self.request.user
        return PuzzleAttempt.objects.filter(user=user).order_by('-last_saved')

    def perform_create(self, serializer):
        """
        Associate the attempt with the logged-in user upon creation.
        """
        serializer.save(user=self.request.user)