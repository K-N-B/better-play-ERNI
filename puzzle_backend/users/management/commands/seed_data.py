# users/management/commands/seed_data.py
from datetime import date, timedelta

from django.core.management.base import BaseCommand
from users.models import Department, User

from puzzle_backend.games.models import WordlePuzzle


class Command(BaseCommand):
    help = 'Seeds database with initial test data'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting data seeding...'))

        # 1. Create Departments
        departments_data = [
            'Backend & Cloud',
            'Data & AI',
            'Web Dev 1',
            'Web Dev 2',
            'Sales',
            'HR & Admin',
        ]

        departments = []
        for dept_name in departments_data:
            dept, created = Department.objects.get_or_create(name=dept_name)
            departments.append(dept)
            if created:
                self.stdout.write(f'  ✓ Created department: {dept_name}')
            else:
                self.stdout.write(f'  - Department exists: {dept_name}')

        # 2. Create Test Users
        test_users = [
            {
                'username': 'gavin_cii',
                'email': 'gavin@erni.com',
                'first_name': 'Gavin',
                'last_name': 'Cii',
                'department': departments[0],
            },
            {
                'username': 'sarah_b',
                'email': 'sarah@erni.com',
                'first_name': 'Sarah',
                'last_name': 'Bennett',
                'department': departments[1],
            },
            {
                'username': 'mike_t',
                'email': 'mike@erni.com',
                'first_name': 'Mike',
                'last_name': 'Torres',
                'department': departments[2],
            },
            {
                'username': 'alex_m',
                'email': 'alex@erni.com',
                'first_name': 'Alex',
                'last_name': 'Martinez',
                'department': departments[3],
            },
            {
                'username': 'jerome_b',
                'email': 'jerome@erni.com',
                'first_name': 'Jerome',
                'last_name': 'Brown',
                'department': departments[0],
            },
        ]

        for user_data in test_users:
            user, created = User.objects.get_or_create(
                username=user_data['username'],
                defaults={
                    'email': user_data['email'],
                    'first_name': user_data['first_name'],
                    'last_name': user_data['last_name'],
                    'department': user_data['department'],
                    'profile_complete': True,
                    'is_active': True,
                },
            )
            if created:
                user.set_password('testpass123')  # Set a test password
                user.save()
                self.stdout.write(f'  ✓ Created user: {user.username}')
            else:
                self.stdout.write(f'  - User exists: {user.username}')

        # 3. Create Sample Wordle Puzzles (for testing)
        sample_words = [
            'REACT',
            'PYTHON',
            'DJANGO',
            'CLOUD',
            'AGILE',
            'SCRUM',
            'SPRINT',
            'MERGE',
            'BUILD',
            'DEPLOY',
        ]

        today = date.today()
        for i, word in enumerate(sample_words):
            puzzle_date = today - timedelta(days=(len(sample_words) - 1 - i))
            puzzle, created = WordlePuzzle.objects.get_or_create(
                date_to_be_used=puzzle_date, defaults={'solution_word': word}
            )
            if created:
                self.stdout.write(f'  ✓ Created Wordle puzzle for {puzzle_date}: {word}')
            else:
                self.stdout.write(f'  - Wordle puzzle exists for {puzzle_date}')

        self.stdout.write(self.style.SUCCESS('\n✅ Seeding complete!'))
        self.stdout.write(self.style.WARNING('\nTest user credentials:'))
        self.stdout.write('  Username: gavin_cii | Password: testpass123')
        self.stdout.write('  (Same password for all test users)\n')
