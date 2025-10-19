# StoreFlow Server Management Scripts

This project includes several scripts to manage the development servers:

## Available Scripts

### 1. start-servers.bat (Simple Batch Script)
**Usage:** `start-servers.bat`
- ✅ Automatically stops existing Node.js processes
- ✅ Starts backend server on port 5000
- ✅ Starts frontend server on port 3000  
- ✅ Shows server status
- ✅ Works on all Windows versions

### 2. start-servers-enhanced.ps1 (Advanced PowerShell Script)
**Usage:** 
```powershell
# Start all servers
.\start-servers-enhanced.ps1

# Stop all servers only
.\start-servers-enhanced.ps1 -StopOnly

# Start only backend
.\start-servers-enhanced.ps1 -BackendOnly

# Start only frontend
.\start-servers-enhanced.ps1 -FrontendOnly
```

**Features:**
- ✅ Parameter support for flexible server management
- ✅ Advanced error handling and status checking
- ✅ Port availability testing
- ✅ Colorized output with detailed logging
- ✅ Process ID tracking
- ✅ Better error messages

### 3. stop-servers.bat (Simple Stop Script)
**Usage:** `stop-servers.bat`
- ✅ Stops all Node.js processes quickly
- ✅ Provides confirmation feedback

## Server Ports

- **Backend API:** http://localhost:5000
- **WebSocket:** ws://localhost:3001/ws (integrated with backend)
- **Frontend:** http://localhost:3000

## Troubleshooting

### If servers don't start:
1. Make sure you're in the project root directory
2. Check that `backend/package.json` and `frontend/package.json` exist
3. Run `npm install` in both backend and frontend directories
4. Check the server windows for error messages

### If ports are busy:
1. Use the `-StopOnly` flag: `.\start-servers-enhanced.ps1 -StopOnly`
2. Or manually stop processes: `taskkill /F /IM node.exe`

### Permission Issues:
1. Run PowerShell as Administrator for the enhanced script
2. If PowerShell execution policy blocks scripts:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

## Quick Commands

```bash
# Start everything (simple)
start-servers.bat

# Start everything (advanced)
.\start-servers-enhanced.ps1

# Stop everything
.\start-servers-enhanced.ps1 -StopOnly

# Restart only backend
.\start-servers-enhanced.ps1 -StopOnly
.\start-servers-enhanced.ps1 -BackendOnly

# Check if servers are running
netstat -ano | findstr ":3000 :5000"
```

## Development Workflow

1. **First time setup:**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Daily development:**
   ```bash
   # Start servers
   start-servers.bat
   
   # Access application
   # Frontend: http://localhost:3000
   # Backend API: http://localhost:5000
   ```

3. **When done:**
   ```bash
   # Stop servers
   .\start-servers-enhanced.ps1 -StopOnly
   ```