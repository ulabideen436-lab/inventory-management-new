@echo off
echo Starting backend server...
start /B cmd /c "cd /d d:\Inventory managment\backend && node src\index.js"

echo Waiting for server to start...
timeout /t 5 /nobreak > nul

echo Running comprehensive test...
cd /d "d:\Inventory managment"
node test-comprehensive-supplier-operations.js

echo.
echo Test completed. Press any key to exit...
pause > nul