@echo off
echo.
echo ========================================
echo   RESTARTING BACKEND SERVER
echo ========================================
echo.
echo This will restart the backend to apply customer API fixes.
echo.
echo Press Ctrl+C to cancel, or any key to continue...
pause > nul

echo.
echo Stopping any running backend processes...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq *backend*" 2>nul

echo.
echo Starting backend server...
cd backend
start "Backend Server" cmd /k "npm start"

echo.
echo Waiting for server to start (5 seconds)...
timeout /t 5 /nobreak > nul

echo.
echo ========================================
echo   RUNNING COMPREHENSIVE TESTS
echo ========================================
echo.
echo Testing if backend is ready...
node test-system.js

echo.
echo ========================================
echo   TEST COMPLETE
echo ========================================
echo.
echo If tests show 100%%, all issues are resolved!
echo If tests still fail, manually restart backend and try again.
echo.
pause
