# config/apps.py
from django.apps import AppConfig


class ConfigConfig(AppConfig):
    name = 'config'

    def ready(self):
        # Import and start scheduler
        from games.scheduler import start_scheduler

        start_scheduler()
