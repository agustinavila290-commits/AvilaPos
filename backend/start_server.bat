@echo off
cd /d "%~dp0"
set USE_SQLITE=True
call venv\Scripts\activate.bat
python manage.py runserver 0.0.0.0:8000
