#!/bin/bash

# Apply DB migrations
python manage.py migrate --noinput

# Collect static files (for admin panel, if needed)
python manage.py collectstatic --noinput --clear

# Start Django dev server (bind to $PORT from Render)
python manage.py runserver 0.0.0.0:$PORT
