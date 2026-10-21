@echo off
title Klap All-In-One Launcher
echo Starting Klap AI Shorts Backend and Next.js Frontend...
start "" "%~dp0start_backend.bat"
timeout /t 3 /nobreak >nul
start "" "%~dp0start_frontend.bat"
echo ========================================================
echo   Klap is running!
echo   Frontend: http://localhost:3001/spaces?task=shorts
echo   Backend API: http://localhost:8000/docs
echo ========================================================
pause
