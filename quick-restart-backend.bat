@echo off
echo.
echo ========================================
echo   QUICK BACKEND RESTART FOR TESTING
echo ========================================
echo.
echo This will:
echo  1. Stop the backend server
echo  2. Restart it (resets rate limits)
echo  3. Run comprehensive tests
echo.
pause

echo.
echo [1/4] Stopping backend processes...
taskkill /F /IM node.exe 2>nul
if errorlevel 1 (
    echo No Node processes found - continuing...
) else (
    echo Backend processes stopped.
)

echo.
echo [2/4] Waiting 3 seconds...
timeout /t 3 /nobreak > nul

echo.
echo [3/4] Starting backend server...
cd backend
start "Inventory Backend" cmd /k "npm start"

echo.
echo [4/4] Waiting for backend to be ready (8 seconds)...
timeout /t 8 /nobreak > nul

echo.
echo ========================================
echo   RUNNING COMPREHENSIVE TESTS
echo ========================================
echo.
node test-system.js

echo.
echo ========================================
echo   TEST COMPLETE
echo ========================================
echo.
echo Press any key to exit...
pause > nul
