import os
from django.core.management.base import BaseCommand
from django.core.files import File
from games.models import EmployeeImageSource

# Define the folder where your local images are stored
# NOTE: Update this path to match your project structure!
LOCAL_IMAGE_FOLDER = 'C:/Users/extpeyu/Project/better-play-ERNI/employee_photos_raw'


class Command(BaseCommand):
    help = 'Imports local employee photos into the EmployeeImageSource model and uploads them to storage.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting employee image import...'))
        
        # 1. Ensure the directory exists
        if not os.path.isdir(LOCAL_IMAGE_FOLDER):
            self.stderr.write(self.style.ERROR(f"Directory not found: {LOCAL_IMAGE_FOLDER}"))
            return

        image_files = [f for f in os.listdir(LOCAL_IMAGE_FOLDER) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        
        if not image_files:
            self.stdout.write(self.style.WARNING("No image files found in the directory."))
            return

        for filename in image_files:
            file_path = os.path.join(LOCAL_IMAGE_FOLDER, filename)
            
            # Extract employee name from the filename (e.g., "Marco_V.jpg" -> "Marco V")
            employee_name = os.path.splitext(filename)[0].replace('_', ' ').title()

            try:
                with open(file_path, 'rb') as f:
                    django_file = File(f)
                    
                    # Create or update the model instance
                    source, created = EmployeeImageSource.objects.update_or_create(
                        employee_name=employee_name,
                        defaults={
                            # This saves the file and triggers the upload to S3 (via django-storages)
                            'image_file': django_file,
                            # Context must be added later in the Admin, or manually here if you have a CSV source
                            'clue_context': f"Context for {employee_name} goes here."
                        }
                    )
                    
                    status = "CREATED" if created else "UPDATED"
                    self.stdout.write(f"✅ {status}: {employee_name} ({filename})")

            except Exception as e:
                self.stderr.write(self.style.ERROR(f"🛑 Failed to process {filename}: {e}"))
                
        self.stdout.write(self.style.SUCCESS('\nImport complete! Files are now in your cloud storage.'))