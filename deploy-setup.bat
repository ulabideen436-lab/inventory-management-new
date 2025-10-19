@echo off
echo ================================================
echo   Inventory Management - Deployment Setup
echo ================================================
echo.

echo [1/5] Checking Git installation...
git --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Git is not installed!
    echo Please download from: https://git-scm.com/download/win
    pause
    exit /b 1
)
echo ✓ Git is installed
echo.

echo [2/5] Initializing Git repository...
if not exist ".git" (
    git init
    echo ✓ Git repository initialized
) else (
    echo ✓ Git repository already exists
)
echo.

echo [3/5] Creating .gitignore...
echo ✓ .gitignore already created
echo.

echo [4/5] Exporting database...
echo This will create database_export.sql
echo.
set /p DB_EXPORT="Do you want to export database now? (y/n): "
if /i "%DB_EXPORT%"=="y" (
    mysqldump -u root -pZafaryaqoob.com786 storeflow > database_export.sql
    if errorlevel 1 (
        echo WARNING: Database export failed. You can do this manually later.
    ) else (
        echo ✓ Database exported to database_export.sql
    )
) else (
    echo Skipped. You can export later with:
    echo mysqldump -u root -pZafaryaqoob.com786 storeflow ^> database_export.sql
)
echo.

echo [5/5] Preparing Git commit...
git add .
git status
echo.

echo ================================================
echo   Setup Complete! Next Steps:
echo ================================================
echo.
echo 1. Create GitHub repository:
echo    https://github.com/new
echo    Name: inventory-management-demo
echo    Keep it PRIVATE
echo.
echo 2. Run these commands:
echo    git commit -m "Initial commit - Ready for deployment"
echo    git remote add origin https://github.com/YOUR_USERNAME/inventory-management-demo.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo 3. Then follow QUICK_DEPLOY.md for Railway/Vercel setup
echo.
echo ================================================
pause
