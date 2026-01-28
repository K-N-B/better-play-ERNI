from django.core.management.base import BaseCommand
from django.core.mail import send_mass_mail
from django.utils import timezone
from django.contrib.auth import get_user_model
from datetime import timedelta
from django.conf import settings

User = get_user_model()

class Command(BaseCommand):
    help = 'Sends reminder emails to users inactive for EXACTLY 7 or 30 days'

    def handle(self, *args, **kwargs):
        today = timezone.now().date()

        date_7_days_ago = today - timedelta(days=7)
        date_30_days_ago = today - timedelta(days=30)

        self.stdout.write(f"Looking for users last active on: {date_7_days_ago} and {date_30_days_ago}")

        users_7_days_inactive = User.objects.filter(
            last_active__date=date_7_days_ago,
            is_active=True,
            email_notifications=True,
        )
        
        users_30_days_inactive = User.objects.filter(
            last_active__date=date_30_days_ago,
            is_active=True,
            email_notifications=True,
        )


        if not users_7_days_inactive.exists() and not users_30_days_inactive.exists():
            self.stdout.write(self.style.WARNING("No users found inactive for 7 or 30 days"))
            return

        messages = []

        for user in users_7_days_inactive:
            subject = f"Your streak is waiting, {user.first_name}! "
            message = f"""
                Hi {user.first_name},

                It's been a week since we saw you in Better Play ERNI! 
                Don't let your puzzle skills get rusty.

                Play today: {getattr(settings, 'FRONTEND_URL', 'http://better-play-erni.duckdns.org')}

                - Better Play ERNI Team
            """

            if user.email:
                messages.append((subject, message, settings.DEFAULT_FROM_EMAIL, [user.email]))


        for user in users_30_days_inactive:
            subject = f"It's been a while... Come back to Better Play ERNI, {user.first_name}!"
            message = f"""
                Hi {user.first_name},

                We haven't seen you in a month in Better Play ERNI! A lot has changed since you've been gone.

                We've added new puzzles and the leaderboards are heating up. 
                Come see if you can reclaim your spot!

                Jump back in: {getattr(settings, 'FRONTEND_URL', 'http://better-play-erni.duckdns.org')}

                We hope to see you soon,
                The Better Play ERNI Team
            """

            if user.email:
                messages.append((subject, message, settings.DEFAULT_FROM_EMAIL, [user.email]))
        
        self.stdout.write(f"Preparing to send {len(messages)} emails.")
        send_mass_mail(messages, fail_silently=False)
        self.stdout.write(self.style.SUCCESS(f"Sent {len(messages)} inactivity reminder emails."))
