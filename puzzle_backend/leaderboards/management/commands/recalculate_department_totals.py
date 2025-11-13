# leaderboards/management/commands/recalculate_department_totals.py

from django.core.management.base import BaseCommand
from django.db.models import Sum
from users.models import Department, User


class Command(BaseCommand):
    help = 'Recalculates all department total_points_alltime from user totals'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Starting department all-time points recalculation...'))
        
        departments = Department.objects.all()
        updated_count = 0
        
        for dept in departments:
            # Sum all user points in this department
            user_total = User.objects.filter(
                department=dept, 
                is_active=True
            ).aggregate(
                total=Sum('total_points_alltime')
            )['total'] or 0
            
            old_total = dept.total_points_alltime
            dept.total_points_alltime = user_total
            dept.save(update_fields=['total_points_alltime'])
            
            self.stdout.write(
                self.style.SUCCESS(
                    f"✅ {dept.name}: {old_total} pts → {user_total} pts (Δ {user_total - old_total})"
                )
            )
            updated_count += 1
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\n🎉 Successfully recalculated {updated_count} departments!'
            )
        )