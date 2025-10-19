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

# Function to check if a port is in use
function Test-Port {
    param([int]$Port)
    
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
        return $connection
    }
    catch {
        return $false
    }
}

# Function to start backend server
function Start-BackendServer {
    Write-Host "Starting backend server..." -ForegroundColor Yellow
    
    if (-not (Test-Path "backend\package.json")) {
        Write-Host "❌ Backend directory not found! Make sure you're in the project root." -ForegroundColor Red
        return $false
    }
    
    try {
        # Start backend in a new PowerShell window
        $backendJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'backend'; Write-Host 'Starting StoreFlow Backend Server...' -ForegroundColor Green; npm start" -WindowStyle Normal -PassThru
        
        Write-Host "Backend server starting... (PID: $($backendJob.Id))" -ForegroundColor Green
        
        # Wait a moment and check if backend is responding
        Start-Sleep -Seconds 5
        
        if (Test-Port -Port 5000) {
            Write-Host "✅ Backend server is running on http://localhost:5000" -ForegroundColor Green
            return $true
        }
        else {
            Write-Host "⚠️ Backend server started but port 5000 not responding yet..." -ForegroundColor Yellow
            return $true
        }
    }
    catch {
        Write-Host "❌ Failed to start backend server: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to start frontend server
function Start-FrontendServer {
    Write-Host "Starting frontend server..." -ForegroundColor Yellow
    
    if (-not (Test-Path "frontend\package.json")) {
        Write-Host "❌ Frontend directory not found! Make sure you're in the project root." -ForegroundColor Red
        return $false
    }
    
    try {
        # Start frontend in a new PowerShell window
        $frontendJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'frontend'; Write-Host 'Starting StoreFlow Frontend Server...' -ForegroundColor Blue; npm start" -WindowStyle Normal -PassThru
        
        Write-Host "Frontend server starting... (PID: $($frontendJob.Id))" -ForegroundColor Green
        
        # Wait a moment and check if frontend is responding
        Start-Sleep -Seconds 8
        
        if (Test-Port -Port 3000) {
            Write-Host "✅ Frontend server is running on http://localhost:3000" -ForegroundColor Green
            return $true
        }
        else {
            Write-Host "⚠️ Frontend server started but port 3000 not responding yet..." -ForegroundColor Yellow
            return $true
        }
    }
    catch {
        Write-Host "❌ Failed to start frontend server: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Main execution
try {
    # Always stop existing processes first
    Stop-NodeProcesses
    
    if ($StopOnly) {
        Write-Host "✅ All servers stopped. Exiting." -ForegroundColor Green
        exit 0
    }
    
    Write-Host "Starting StoreFlow servers..." -ForegroundColor Cyan
    Write-Host ""
    
    $backendSuccess = $true
    $frontendSuccess = $true
    
    # Start servers based on parameters
    if (-not $FrontendOnly) {
        $backendSuccess = Start-BackendServer
        Start-Sleep -Seconds 2
    }
    
    if (-not $BackendOnly) {
        $frontendSuccess = Start-FrontendServer
        Start-Sleep -Seconds 2
    }
    
    Write-Host ""
    Write-Host "=== Server Status ===" -ForegroundColor Cyan
    
    if (-not $FrontendOnly) {
        if (Test-Port -Port 5000) {
            Write-Host "✅ Backend:  http://localhost:5000" -ForegroundColor Green
        }
        else {
            Write-Host "❌ Backend:  Not responding on port 5000" -ForegroundColor Red
        }
    }
    
    if (-not $BackendOnly) {
        if (Test-Port -Port 3000) {
            Write-Host "✅ Frontend: http://localhost:3000" -ForegroundColor Green
        }
        else {
            Write-Host "❌ Frontend: Not responding on port 3000" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    if ($backendSuccess -and $frontendSuccess) {
        Write-Host "🎉 All servers started successfully!" -ForegroundColor Green
        Write-Host "   You can now access StoreFlow at: http://localhost:3000" -ForegroundColor Cyan
    }
    else {
        Write-Host "⚠️ Some servers may have issues. Check the server windows for details." -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "💡 Tips:" -ForegroundColor Yellow
    Write-Host "   - Use 'start-servers.ps1 -StopOnly' to stop all servers" -ForegroundColor Gray
    Write-Host "   - Use 'start-servers.ps1 -BackendOnly' to start only backend" -ForegroundColor Gray
    Write-Host "   - Use 'start-servers.ps1 -FrontendOnly' to start only frontend" -ForegroundColor Gray
    Write-Host "   - Check server windows if you encounter issues" -ForegroundColor Gray
    
}
catch {
    Write-Host "❌ An error occurred: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")