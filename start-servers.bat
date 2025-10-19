@echo off
setlocal enabledelayedexpansion
REM Startup script for the inventory management system (Windows)

echo 🚀 Starting Inventory Management System...
echo.

REM Function to check if a port is in use
echo 🔍 Checking existing server processes...

REM Check for processes on port 5000 (Backend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do (
    if not "%%a"=="0" (
        echo Found process on port 5000 PID: %%a - Stopping...
        taskkill /PID %%a /F >nul 2>&1
    )
)

REM Check for processes on port 3000 (Frontend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    if not "%%a"=="0" (
        echo Found process on port 3000 PID: %%a - Stopping...
        taskkill /PID %%a /F >nul 2>&1
    )
)

REM Stop all Node.js processes (more aggressive cleanup)
echo Cleaning up any remaining Node.js processes...
taskkill /F /IM node.exe >nul 2>&1

REM Wait a moment for processes to fully terminate
echo Waiting for processes to terminate...
timeout /t 3 /nobreak >nul

echo.
echo Starting fresh servers...

REM Start backend API server (includes WebSocket server)
echo Starting backend API server on port 5000...
echo WebSocket server will start automatically on port 3001...
cd backend
start "Backend Server" cmd /k "npm start"

REM Wait a moment for backend to start
timeout /t 5 /nobreak >nul

REM Start frontend development server
echo 🌐 Starting frontend development server on port 3000...
cd ..\frontend
start "Frontend Server" cmd /k "npm start"

echo.
echo ✅ All servers started in separate windows!
echo.
echo 📋 Server Status:
echo    • Backend API: http://localhost:5000
echo    • WebSocket: ws://localhost:3001/ws (integrated)
echo    • Frontend: http://localhost:3000
echo.
echo 💡 Each server is running in its own window for easy monitoring
echo 🚫 To stop servers: Close the server windows or run this script again
echo.
echo Press any key to continue...
pause >nul