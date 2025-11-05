#!/usr/bin/env bash
set -o errexit

# 1. Install Dependencies (requirements.txt is now in the same directory)
pip install -r requirements.txt

# 2. Run Django setup commands (manage.py is now in the same directory)
python manage.py collectstatic --no-input
python manage.py migrate