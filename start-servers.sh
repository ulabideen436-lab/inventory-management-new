#!/bin/bash
# Startup script for the inventory management system

echo "🚀 Starting Inventory Management System..."

# Start backend API server (includes WebSocket server)
echo "📡 Starting backend API server on port 5000..."
echo "🔌 WebSocket server will start automatically on port 3001..."
cd backend
node src/index.js &

# Start frontend development server  
echo "🌐 Starting frontend development server on port 3000..."
cd ../frontend
npm start &

echo "✅ All servers started!"
echo ""
echo "📋 Server Status:"
echo "   • Backend API: http://localhost:5000"
echo "   • WebSocket: ws://localhost:3001/ws (integrated)"  
echo "   • Frontend: http://localhost:3000"
echo ""
echo "Press any key to continue..."
read -n 1