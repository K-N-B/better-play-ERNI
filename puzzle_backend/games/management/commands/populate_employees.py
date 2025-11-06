# games/management/commands/populate_employees.py

import os

from django.conf import settings
from django.core.files import File
from django.core.management.base import BaseCommand
from games.models import EmployeeImageSource


class Command(BaseCommand):
    help = 'Scans the media/ernigram_employees folder and creates database records for new images.'

    def handle(self, *args, **options):
        self.stdout.write("Starting to populate employee images from folder...")

        # 1. Define the path to your images folder
        image_folder = os.path.join(settings.MEDIA_ROOT, 'ernigram_employees')

        # Check if the folder actually exists
        if not os.path.isdir(image_folder):
            self.stdout.write(self.style.ERROR(f"Source folder not found: {image_folder}"))
            return

        # 2. Get a list of all employee names already in the database to avoid duplicates
        existing_names = set(EmployeeImageSource.objects.values_list('employee_name', flat=True))

        # 3. Loop through all the files in the folder
        for filename in os.listdir(image_folder):
            # Make sure we're only processing image files
            if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')):

                # 4. Parse the filename to get the employee name
                # Example: "Adrian_Ravis.jpg" -> "Adrian Ravis"
                employee_name = os.path.splitext(filename)[0].replace('_', ' ')

                # 5. Check if this employee already exists. If so, skip.
                if employee_name in existing_names:
                    self.stdout.write(
                        f"Skipping '{employee_name}', already exists in the database."
                    )
                    continue

                # 6. If the employee is new, create the database record
                self.stdout.write(
                    self.style.SUCCESS(f"Found new employee: '{employee_name}'. Creating record...")
                )

                file_path = os.path.join(image_folder, filename)

                # We need to open the file to attach it to the ImageField
                with open(file_path, 'rb') as f:
                    EmployeeImageSource.objects.create(
                        employee_name=employee_name,
                        clue_context='Who is this employee?',  # Your constant clue
                        is_available=True,  # Automatically set to available!
                        # The ImageField needs a Django File object, not just the path
                        image_file=File(f, name=filename),
                    )

        self.stdout.write(self.style.SUCCESS("Finished populating employee images!"))
