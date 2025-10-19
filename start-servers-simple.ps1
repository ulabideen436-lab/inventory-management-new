Write-Host "=== StoreFlow Server Manager ===" -ForegroundColor Cyan
Write-Host ""

# Stop all Node.js processes
Write-Host "Stopping existing Node.js processes..." -ForegroundColor Yellow
try {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "All Node.js processes stopped." -ForegroundColor Green
}
catch {
    Write-Host "No Node.js processes to stop." -ForegroundColor Gray
}

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "Starting servers..." -ForegroundColor Green

# Start backend
Write-Host "Starting backend server..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm start" -WindowStyle Normal
Write-Host "Backend starting on http://localhost:5000" -ForegroundColor Green

Start-Sleep -Seconds 3

# Start frontend
Write-Host "Starting frontend server..." -ForegroundColor Blue  
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm start" -WindowStyle Normal
Write-Host "Frontend starting on http://localhost:3000" -ForegroundColor Green

Write-Host ""
Write-Host "Servers are starting in separate windows." -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan

pause