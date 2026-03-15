@echo off
echo ==================================================
echo Starting The Bequer Platform
echo ==================================================

echo [1/2] Starting Backend Server...
start "Bequer Backend" cmd /k "cd backend && call venv\Scripts\activate && python manage.py runserver"

echo [2/2] Starting Frontend Server...
start "Bequer Frontend" cmd /k "cd frontend && npm run dev"

echo Done! Both servers are starting up in separate windows.
