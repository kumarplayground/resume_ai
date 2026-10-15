@echo off
title Align Resume Studio Launcher
echo ====================================================
echo Starting Align Resume Studio (Backend + Frontend)
echo ====================================================

echo [1/2] Starting Python FastAPI backend on port 8000...
start "Align Backend (FastAPI)" cmd /k "cd /d "%~dp0backend" && if exist .venv\Scripts\activate (call .venv\Scripts\activate) && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Starting Next.js frontend on port 3000...
start "Align Frontend (Next.js)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ====================================================
echo Both servers are launching in separate windows!
echo - Frontend: http://localhost:3000
echo - Backend:  http://127.0.0.1:8000
echo - API Docs: http://127.0.0.1:8000/docs
echo ====================================================
