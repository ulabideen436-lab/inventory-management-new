@echo off
cls
echo ============================================
echo   Inventory Management System Launcher
echo ============================================
echo.

echo [1/4] Stopping existing servers...
taskkill /F /IM node.exe >nul 2>&1
echo     - Node.js processes stopped

echo.
echo [2/4] Waiting for cleanup...
timeout /t 2 /nobreak >nul

echo.
echo [3/4] Starting Backend Server...
cd backend
start "Backend Server - Port 5000" cmd /c "echo Backend Starting... && npm start && pause"
cd ..

echo.
echo [4/4] Starting Frontend Server...
timeout /t 3 /nobreak >nul
cd frontend  
start "Frontend Server - Port 3000" cmd /c "echo Frontend Starting... && npm start && pause"
cd ..

echo.
echo ============================================
echo   Servers Started Successfully!
echo ============================================
echo.
echo Backend API:    http://localhost:5000
echo WebSocket:      ws://localhost:3001/ws
echo Frontend App:   http://localhost:3000
echo.
echo NOTE: Each server runs in its own window
echo To stop: Close the server windows or run stop-servers.bat
echo.
pause