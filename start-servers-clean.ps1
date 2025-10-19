# Simple PowerShell script to manage StoreFlow servers
# Automatically stops existing processes and starts fresh servers

Write-Host "=== StoreFlow Server Manager ===" -ForegroundColor Cyan
Write-Host "Date: $(Get-Date)" -ForegroundColor Gray
Write-Host ""

# Function to kill Node.js processes
function Stop-NodeProcesses {
    Write-Host "Checking for existing Node.js processes..." -ForegroundColor Yellow
    
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    
    if ($nodeProcesses) {
        Write-Host "Found $($nodeProcesses.Count) Node.js process(es). Stopping them..." -ForegroundColor Red
        try {
            $nodeProcesses | Stop-Process -Force -ErrorAction Stop
            Write-Host "All Node.js processes stopped." -ForegroundColor Green
        }
        catch {
            Write-Host "Failed to stop some processes: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        # Wait a moment for processes to fully terminate
        Start-Sleep -Seconds 2
    }
    else {
        Write-Host "No existing Node.js processes found." -ForegroundColor Green
    }
}

# Main execution
Write-Host "Stopping existing servers..." -ForegroundColor Yellow
Stop-NodeProcesses

Write-Host ""
Write-Host "Starting StoreFlow servers..." -ForegroundColor Green
Write-Host ""

# Start backend server
Write-Host "📡 Starting backend server..." -ForegroundColor Blue
try {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'backend'; Write-Host 'StoreFlow Backend Server' -ForegroundColor Green; npm start" -WindowStyle Normal
    Write-Host "✅ Backend server started (http://localhost:5000)" -ForegroundColor Green
}
catch {
    Write-Host "❌ Failed to start backend server: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 3

# Start frontend server  
Write-Host "🌐 Starting frontend server..." -ForegroundColor Blue
try {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'frontend'; Write-Host 'StoreFlow Frontend Server' -ForegroundColor Blue; npm start" -WindowStyle Normal
    Write-Host "✅ Frontend server started (http://localhost:3000)" -ForegroundColor Green
}
catch {
    Write-Host "❌ Failed to start frontend server: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Servers are starting..." -ForegroundColor Green
Write-Host "   Backend:  http://localhost:5000" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Check the server windows for startup status." -ForegroundColor Gray
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
Read-Host "Press Enter to continue"