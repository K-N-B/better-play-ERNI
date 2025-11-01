from django.utils import timezone
import pytz

MANILA_TZ = pytz.timezone("Asia/Manila")


def get_local_today(tz_name="Asia/Manila"):
    """Return the local date (today) for the given timezone."""
    tz = pytz.timezone(tz_name)
    return timezone.now().astimezone(tz).date()


def get_local_now(tz_name="Asia/Manila"):
    """Return the localized current datetime."""
    tz = pytz.timezone(tz_name)
    return timezone.now().astimezone(tz)
