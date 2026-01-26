from django.core.management.base import BaseCommand
from django.core.mail import send_mass_mail
from django.utils import timezone
from django.contrib.auth import get_user_model
from datetime import timedelta
from django.conf import settings

User = get_user_model()

class Command(BaseCommand):
    help = 'Sends reminder emails to users inactive for AT LEAST 7 days'

    def handle(self, *args, **kwargs):
        # 1. Calculate the cutoff date (7 days ago)
        # Any user active BEFORE this date is considered inactive
        cutoff_date = timezone.now().date() - timedelta(days=7)

        self.stdout.write(f"Looking for users last active on or before: {cutoff_date}")

        # 2. Query Users
        # We use '__lte' (Less Than or Equal) to capture everyone from 7 days ago, 8 days ago, etc.
        inactive_users = User.objects.filter(
            last_active__date__lte=cutoff_date, #
            is_active=True,
            
            # --- SAFETY LOCK: KEEP THIS ON WHILE TESTING ---
            email="forondayna1214@gmail.com" 
        )

        if not inactive_users.exists():
            self.stdout.write(self.style.WARNING(f"No users found inactive since {cutoff_date}"))
            return

        # 3. Prepare Emails
        messages = []
        for user in inactive_users:
            subject = f"We miss you, {user.first_name}! 🥺"
            
            # OPTIONAL: You can customize the message based on how long they've been gone
            # days_gone = (timezone.now().date() - user.last_active.date()).days
            
            message = f"""
Hi {user.first_name},

It's been a while since we last saw you on Better Play ERNI! 

Your streak might be at risk, but you can always start a new one.
We have fresh puzzles waiting for you.

Come back and play: {getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')}

Cheering for you,
The Better Play ERNI Team
            """
            recipient = user.email
            if recipient:
                messages.append((subject, message, settings.DEFAULT_FROM_EMAIL, [recipient]))

        # 4. Send
        self.stdout.write(f"Sending emails to {len(messages)} users...")
        send_mass_mail(messages, fail_silently=False)
        self.stdout.write(self.style.SUCCESS(f"Successfully sent {len(messages)} reminders!"))