@echo off
REM Script to stop all inventory management servers

echo 🛑 Stopping Inventory Management Servers...
echo.

echo 🔍 Finding server processes...

REM Stop processes on port 5000 (Backend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do (
    if not "%%a"=="0" (
        echo 🛑 Stopping Backend server (PID: %%a)...
        taskkill /PID %%a /F >nul 2>&1
    )
)

REM Stop processes on port 3000 (Frontend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    if not "%%a"=="0" (
        echo 🛑 Stopping Frontend server (PID: %%a)...
        taskkill /PID %%a /F >nul 2>&1
    )
)

REM Stop all Node.js processes
echo 🧹 Cleaning up Node.js processes...
taskkill /F /IM node.exe >nul 2>&1

echo.
echo ✅ All servers stopped!
echo.
pause