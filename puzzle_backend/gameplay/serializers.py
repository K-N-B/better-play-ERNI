# gameplay/serializers.py 
from rest_framework import serializers
from .models import Challenge, Submission
from users.models import User


class UserBriefSerializer(serializers.ModelSerializer):
    """Minimal user info for challenges"""
    class Meta:
        model = User
        fields = ['id', 'username']


class SubmissionBriefSerializer(serializers.ModelSerializer):
    """Brief submission info for challenges"""
    class Meta:
        model = Submission
        fields = ['id', 'points_awarded', 'time_taken_ms', 'tries', 'difficulty']  # ✅ Include difficulty


class ChallengeSerializer(serializers.ModelSerializer):
    """Serializer for Challenge model"""
    challenger = UserBriefSerializer(read_only=True)
    recipient = UserBriefSerializer(read_only=True)
    winner = UserBriefSerializer(read_only=True)
    challenger_submission = SubmissionBriefSerializer(read_only=True)
    recipient_submission = SubmissionBriefSerializer(read_only=True)
    
    # ✅ Add puzzle_type field
    puzzle_type = serializers.SerializerMethodField()
    puzzle_id = serializers.SerializerMethodField()
    
    class Meta:
        model = Challenge
        fields = [
            'id',
            'challenger',
            'recipient',
            'puzzle_type', 
            'puzzle_id',    
            'challenger_submission',
            'recipient_submission',
            'status',
            'winner',
            'created_at',
            'expires_at',     
            'completed_at',
        ]
    
    def get_puzzle_type(self, obj):
        """Extract puzzle type from challenger_submission's content_type"""
        if obj.challenger_submission and obj.challenger_submission.content_type:
            model_name = obj.challenger_submission.content_type.model
            # Map model names to frontend names
            if 'wordle' in model_name.lower():
                return 'wordle'
            elif 'sudoku' in model_name.lower():
                return 'sudoku'
            elif 'ernigram' in model_name.lower():
                return 'ernigram'
        return None
    
    def get_puzzle_id(self, obj):
        """Get the puzzle ID from challenger_submission"""
        if obj.challenger_submission:
            return obj.challenger_submission.object_id
        return None


class CreateChallengeSerializer(serializers.Serializer):
    """Serializer for creating a challenge"""
    recipient_id = serializers.IntegerField()
    submission_id = serializers.IntegerField()
    
    def validate_recipient_id(self, value):
        """Check that recipient exists and is not the current user"""
        request = self.context.get('request')
        
        if not request or not request.user:
            raise serializers.ValidationError("Authentication required")
        
        try:
            recipient = User.objects.get(pk=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("Recipient user not found")
        
        if recipient == request.user:
            raise serializers.ValidationError("Cannot challenge yourself")
        
        return value
    
    def validate_submission_id(self, value):
        """Check that submission exists and belongs to current user"""
        request = self.context.get('request')
        
        if not request or not request.user:
            raise serializers.ValidationError("Authentication required")
        
        try:
            submission = Submission.objects.get(pk=value)
        except Submission.DoesNotExist:
            raise serializers.ValidationError("Submission not found")
        
        if submission.user != request.user:
            raise serializers.ValidationError("Submission must belong to you")
        
        return value


class CompleteChallengeSerializer(serializers.Serializer):
    """Serializer for completing a challenge"""
    submission_id = serializers.IntegerField()
    
    def validate_submission_id(self, value):
        """Check that submission exists"""
        try:
            Submission.objects.get(pk=value)
        except Submission.DoesNotExist:
            raise serializers.ValidationError("Submission not found")
        return value