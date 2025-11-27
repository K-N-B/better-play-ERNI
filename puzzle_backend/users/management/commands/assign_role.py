# users/management/commands/assign_role.py
from django.core.management.base import BaseCommand
from users.models import User


class Command(BaseCommand):
    help = 'Assign a role to a user'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username of the user')
        parser.add_argument(
            'role',
            type=str,
            choices=['SUPER_ADMIN', 'CONTENT_ADMIN', 'MODERATOR', 'SHOP_MANAGER', 'USER'],
            help='Role to assign'
        )

    def handle(self, *args, **options):
        username = options['username']
        role = options['role']

        try:
            user = User.objects.get(username=username)
            
            # Store old role for logging
            old_role = user.role
            
            # Update role
            user.role = role
            
            # If assigning SUPER_ADMIN, also set is_superuser
            if role == User.Role.SUPER_ADMIN:
                user.is_superuser = True
            
            user.save()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'✅ Successfully updated {username}: {old_role} → {role}'
                )
            )
            
            # Show what they can access
            access_info = []
            if user.is_superuser:
                access_info.append("Full Admin Access")
            else:
                if user.is_content_admin():
                    access_info.append("Games")
                if user.is_moderator():
                    access_info.append("Users & Gameplay")
                if user.is_shop_manager():
                    access_info.append("Shop")
            
            if access_info:
                self.stdout.write(f'   Can access: {", ".join(access_info)}')
            else:
                self.stdout.write('   No admin access')
                
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'❌ User "{username}" does not exist')
            )