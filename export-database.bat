@echo off
echo ================================================
echo   Database Export for Deployment
echo ================================================
echo.

echo Exporting database 'storeflow'...
echo This will create: database_export.sql
echo.

mysqldump -u root -pZafaryaqoob.com786 storeflow > database_export.sql

if errorlevel 1 (
    echo.
    echo ERROR: Database export failed!
    echo.
    echo Possible reasons:
    echo 1. MySQL is not in PATH
    echo 2. Database 'storeflow' doesn't exist
    echo 3. Wrong password
    echo.
    echo Try manually:
    echo mysqldump -u root -pZafaryaqoob.com786 storeflow ^> database_export.sql
    echo.
    pause
    exit /b 1
)

echo.
echo ✓ Success! Database exported to: database_export.sql
echo.

dir database_export.sql

echo.
echo ================================================
echo   Next Steps:
echo ================================================
echo.
echo You will import this file to Railway/Render database
echo after deploying your backend.
echo.
echo Keep this file safe - it contains all your data!
echo.
pause
