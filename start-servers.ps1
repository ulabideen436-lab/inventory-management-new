# Enhanced PowerShell script to manage StoreFlow servers
# Automatically stops existing processes and starts fresh servers

param(
    [switch]$StopOnly = $false,
    [switch]$BackendOnly = $false,
    [switch]$FrontendOnly = $false
)

Write-Host "=== StoreFlow Server Manager ===" -ForegroundColor Cyan
Write-Host "Date: $(Get-Date)" -ForegroundColor Gray
Write-Host ""

# Function to kill Node.js processes
function Stop-NodeProcesses {
    Write-Host "Checking for existing Node.js processes..." -ForegroundColor Yellow
    
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    
    if ($nodeProcesses) {
        Write-Host "Found $($nodeProcesses.Count) Node.js process(es). Stopping them..." -ForegroundColor Red
        foreach ($process in $nodeProcesses) {
            try {
                Write-Host "  - Stopping PID $($process.Id) ($($process.ProcessName))" -ForegroundColor Gray
                Stop-Process -Id $process.Id -Force
            }
            catch {
                Write-Host "  - Failed to stop PID $($process.Id): $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        
        # Wait a moment for processes to fully terminate
        Start-Sleep -Seconds 2
        Write-Host "All Node.js processes stopped." -ForegroundColor Green
    }
    else {
        Write-Host "No existing Node.js processes found." -ForegroundColor Green
    }
}

# Check and stop existing servers
Write-Host "🔍 Checking existing server processes..." -ForegroundColor Cyan

# Stop processes on backend port (5000)
Stop-ProcessOnPort -Port 5000 -ServiceName "Backend Server"

# Stop processes on frontend port (3000) 
Stop-ProcessOnPort -Port 3000 -ServiceName "Frontend Server"

# Additional cleanup - stop all node.js processes
Write-Host "🧹 Cleaning up Node.js processes..." -ForegroundColor Cyan
try {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Node.js processes cleaned up" -ForegroundColor Green
}
catch {
    Write-Host "ℹ️  No Node.js processes to clean up" -ForegroundColor Gray
}

# Wait for processes to fully terminate
Write-Host "⏳ Waiting for processes to terminate..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "🚀 Starting fresh servers..." -ForegroundColor Green

# Start backend server
Write-Host "📡 Starting backend API server on port 5000..." -ForegroundColor Blue
Write-Host "🔌 WebSocket server will start automatically on port 3001..." -ForegroundColor Blue

try {
    Set-Location "backend"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start" -WindowStyle Normal
    Write-Host "✅ Backend server started in new window" -ForegroundColor Green
}
catch {
    Write-Host "❌ Failed to start backend server: $($_.Exception.Message)" -ForegroundColor Red
    Set-Location ".."
    exit 1
}

# Wait for backend to initialize
Start-Sleep -Seconds 5

# Start frontend server
Write-Host "🌐 Starting frontend development server on port 3000..." -ForegroundColor Blue

try {
    Set-Location "..\frontend"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start" -WindowStyle Normal
    Write-Host "✅ Frontend server started in new window" -ForegroundColor Green
}
catch {
    Write-Host "❌ Failed to start frontend server: $($_.Exception.Message)" -ForegroundColor Red
    Set-Location ".."
    exit 1
}

# Return to root directory
Set-Location ".."

Write-Host ""
Write-Host "✅ All servers started successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Server Status:" -ForegroundColor White
Write-Host "   • Backend API: http://localhost:5000" -ForegroundColor Cyan
Write-Host "   • WebSocket: ws://localhost:3001/ws (integrated)" -ForegroundColor Cyan
Write-Host "   • Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Each server is running in its own window for easy monitoring" -ForegroundColor Yellow
Write-Host "🚫 To stop servers: Close the server windows or run this script again" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to continue..."
$Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") | Out-Null