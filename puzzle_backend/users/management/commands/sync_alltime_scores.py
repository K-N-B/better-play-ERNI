# users/management/commands/sync_alltime_scores.py
from django.core.management.base import BaseCommand
from django.db.models import Sum
from gameplay.models import Submission
from users.models import Department, User


class Command(BaseCommand):
    help = 'Recalculates all-time scores from submission records'

    def handle(self, *args, **options):
        self.stdout.write("Syncing all-time scores...")

        # --- Update User All-Time Scores ---
        users_updated = 0
        for user in User.objects.all():
            # Sum all points from submissions
            total = (
                Submission.objects.filter(user=user).aggregate(total=Sum('points_awarded'))['total']
                or 0
            )

            if user.total_points_alltime != total:
                user.total_points_alltime = total
                user.save(update_fields=['total_points_alltime'])
                users_updated += 1
                self.stdout.write(f"  ✓ {user.username}: {total} pts")

        self.stdout.write(self.style.SUCCESS(f"\n✅ Updated {users_updated} users"))

        # --- Update Department All-Time Scores ---
        depts_updated = 0
        for dept in Department.objects.all():
            # Sum all points from department members
            total = (
                Submission.objects.filter(user__department=dept).aggregate(
                    total=Sum('points_awarded')
                )['total']
                or 0
            )

            if dept.total_points_alltime != total:
                dept.total_points_alltime = total
                dept.save(update_fields=['total_points_alltime'])
                depts_updated += 1
                self.stdout.write(f"  ✓ {dept.name}: {total} pts")

        self.stdout.write(self.style.SUCCESS(f"✅ Updated {depts_updated} departments"))
