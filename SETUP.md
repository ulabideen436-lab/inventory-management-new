# Project Setup Instructions

## Environment Setup

1. **Backend Setup**:
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your actual database credentials
   npm install
   ```

2. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   ```

3. **Database Setup**:
   ```bash
   cd backend
   npm run migrate:latest
   ```

## Security Notes

- ✅ Database credentials are now secured in `.env` file (not tracked by git)
- ✅ Strong JWT secret generated for authentication
- ✅ `.gitignore` file created to prevent sensitive data commits

## Dependencies Updated

- ✅ React versions standardized to 18.x across all packages
- ✅ jsPDF versions aligned to 2.5.1 for compatibility

## Code Quality Improvements

- ✅ Removed duplicate `OwnerPOS_formatted.js` file
- ✅ Cleaned up debug console.log statements
- ✅ Organized utility scripts in `/scripts` folder

## Starting the Application

### Quick Start (Windows)
```bash
# Run the startup script
.\start-servers.bat
```

### Manual Start
1. **Backend Server** (includes WebSocket):
   ```bash
   cd backend
   node src/index.js
   ```
   This will automatically start:
   - API server on port 5000
   - WebSocket server on port 3001

2. **Frontend Development Server** (in a new terminal):
   ```bash
   cd frontend
   npm start
   ```

### Server Endpoints
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **WebSocket**: ws://localhost:3001/ws (auto-started with backend)

## File Structure

```
├── backend/           # Node.js backend server
├── frontend/          # React frontend application
├── db/               # Database schemas and migrations
├── docs/             # Project documentation
├── scripts/          # Utility and maintenance scripts
├── tests/            # Test files
└── .gitignore        # Git ignore file
```