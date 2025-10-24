from rest_framework import serializers
from .models import PuzzleAttempt

class PuzzleAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = PuzzleAttempt
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')
