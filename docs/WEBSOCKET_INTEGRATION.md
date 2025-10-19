# WebSocket Integration

## Summary
The WebSocket server has been integrated into the main backend server (`backend/src/index.js`) for easier deployment and management.

## What Changed
- **Before**: Separate `websocket-server.js` file that needed to be started independently
- **After**: WebSocket server is automatically initialized when the backend starts

## Benefits
1. **Simplified Startup**: Only need to run `node src/index.js` 
2. **Better Process Management**: Single process to monitor
3. **Easier Deployment**: One server handles both HTTP API and WebSocket connections
4. **Reduced Complexity**: No need to coordinate multiple servers

## Technical Details
- API Server: `http://localhost:5000`
- WebSocket Server: `ws://localhost:3001/ws` (automatically started)
- The WebSocket server runs on a separate port (3001) to avoid conflicts with the HTTP server

## Files Modified
- `backend/src/index.js` - Added WebSocket server integration
- `start-servers.bat` / `start-servers.sh` - Updated startup scripts
- `SETUP.md` - Updated documentation

## Legacy Files
- `scripts/websocket-server.js` - Standalone version (kept for reference)