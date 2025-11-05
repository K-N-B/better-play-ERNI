# flake8: noqa
from settings import *

# Use SQLite (in-memory) for isolated test runs
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}
