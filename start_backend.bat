@echo off
title Klap AI Backend Engine (FastAPI)
cd /d "%~dp0backend"
echo ========================================================
echo   Klap AI Shorts Engine - Backend Starting on Port 8000
echo ========================================================
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
pause
