# gameplay/serializers.py
from rest_framework import serializers
from .models import Challenge, Submission
from users.serializers import UserNestedSerializer


class SubmissionNestedSerializer(serializers.ModelSerializer):
    """Minimal serializer for nesting submission data in challenges."""
    
    class Meta:
        model = Submission
        fields = ['id', 'points_awarded', 'time_taken_ms', 'tries']


class ChallengeSerializer(serializers.ModelSerializer):
    """Serializer for Challenge model with nested user and submission data."""
    
    challenger = UserNestedSerializer(read_only=True)
    recipient = UserNestedSerializer(read_only=True)
    challenger_submission = SubmissionNestedSerializer(read_only=True)
    recipient_submission = SubmissionNestedSerializer(read_only=True)
    winner = UserNestedSerializer(read_only=True)
    
    # Add computed fields for puzzle type and ID
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
        ]
        read_only_fields = ['id', 'status', 'winner', 'created_at']
    
    def get_puzzle_type(self, obj):
        """Extract puzzle type from challenger's submission."""
        if obj.challenger_submission:
            model_name = obj.challenger_submission.content_type.model
            # Convert 'wordlepuzzle' -> 'wordle', etc.
            return model_name.replace('puzzle', '')
        return None
    
    def get_puzzle_id(self, obj):
        """Extract puzzle ID from challenger's submission."""
        if obj.challenger_submission:
            return obj.challenger_submission.object_id
        return None


class CreateChallengeSerializer(serializers.Serializer):
    """Serializer for creating a new challenge."""
    
    recipient_id = serializers.IntegerField()
    submission_id = serializers.IntegerField()
    
    def validate_recipient_id(self, value):
        """Ensure recipient exists and is not the challenger."""
        from users.models import User
        
        print(f"[CreateChallengeSerializer] Validating recipient_id: {value}")  # Debug
        
        try:
            recipient = User.objects.get(pk=value)
            print(f"[CreateChallengeSerializer] Found recipient: {recipient.username}")  # Debug
        except User.DoesNotExist:
            print(f"[CreateChallengeSerializer] Recipient not found: {value}")  # Debug
            raise serializers.ValidationError("Recipient user not found.")
        
        # Check if trying to challenge yourself
        request = self.context.get('request')
        if request:
            current_user = getattr(request, 'user', None)
            print(f"[CreateChallengeSerializer] Current user: {current_user}")  # Debug
            
            if current_user and current_user.id == value:
                print(f"[CreateChallengeSerializer] User trying to challenge themselves")  # Debug
                raise serializers.ValidationError("You cannot challenge yourself.")
        else:
            print(f"[CreateChallengeSerializer] No request in context!")  # Debug
        
        return value
    
    def validate_submission_id(self, value):
        """Ensure submission exists and belongs to the challenger."""
        print(f"[CreateChallengeSerializer] Validating submission_id: {value}")  # Debug
        
        request = self.context.get('request')
        
        try:
            submission = Submission.objects.get(pk=value)
            print(f"[CreateChallengeSerializer] Found submission: {submission.id}, owner: {submission.user.username}")  # Debug
        except Submission.DoesNotExist:
            print(f"[CreateChallengeSerializer] Submission not found: {value}")  # Debug
            raise serializers.ValidationError("Submission not found.")
        
        # Verify submission belongs to the challenger
        if request:
            current_user = getattr(request, 'user', None)
            print(f"[CreateChallengeSerializer] Current user: {current_user}, Submission owner: {submission.user}")  # Debug
            
            if current_user and submission.user != current_user:
                print(f"[CreateChallengeSerializer] Submission doesn't belong to user")  # Debug
                raise serializers.ValidationError("You can only challenge with your own submissions.")
        else:
            print(f"[CreateChallengeSerializer] No request in context for submission validation!")  # Debug
        
        return value
    
    def validate(self, data):
        """Additional cross-field validation."""
        print(f"[CreateChallengeSerializer] Cross-field validation, data: {data}")  # Debug
        
        # Check if a challenge already exists for this submission
        submission_id = data['submission_id']
        existing_challenge = Challenge.objects.filter(
            challenger_submission_id=submission_id
        ).first()
        
        if existing_challenge:
            print(f"[CreateChallengeSerializer] Challenge already exists for submission {submission_id}")  # Debug
            raise serializers.ValidationError(
                "A challenge has already been created for this submission."
            )
        
        print(f"[CreateChallengeSerializer] Validation passed!")  # Debug
        return data


class CompleteChallengeSerializer(serializers.Serializer):
    """Serializer for completing a challenge as the recipient."""
    
    submission_id = serializers.IntegerField()
    
    def validate_submission_id(self, value):
        """Ensure submission exists and belongs to the recipient."""
        request = self.context.get('request')
        
        try:
            submission = Submission.objects.get(pk=value)
        except Submission.DoesNotExist:
            raise serializers.ValidationError("Submission not found.")
        
        # Verify submission belongs to the recipient (current user)
        if request:
            current_user = getattr(request, 'user', None)
            if current_user and submission.user != current_user:
                raise serializers.ValidationError("This submission does not belong to you.")
        
        return value