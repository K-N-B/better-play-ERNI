from django.apps import AppConfig
import logging

logger = logging.getLogger(__name__)


class GamesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'games'

    def ready(self):
        from games import scheduler
        import sys
        
        if 'runserver' not in sys.argv:
            return
            
        if not any(arg.startswith('--noreload') for arg in sys.argv):
            return
        
        try:
            scheduler.start_scheduler()
            logger.info("Scheduler started in ready()")
        except Exception as e:
            logger.error(f"Failed: {e}")