#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status.
set -o errexit

# 1. Install Dependencies (Path is correct from repository root)
pip install -r puzzle_backend/requirements.txt

# 2. Run Django setup commands (Paths are correct from repository root)
python puzzle_backend/manage.py collectstatic --no-input
python puzzle_backend/manage.py migrate