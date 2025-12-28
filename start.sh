#!/bin/bash

# Quickstart script for Poker Trainer

echo "🃏 Poker Trainer - Quickstart Script"
echo "===================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.9 or higher."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Backend setup
echo "🔧 Setting up backend..."
cd backend

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing Python dependencies..."
pip install -q -r requirements.txt

echo "✅ Backend setup complete"
echo ""

# Frontend setup
echo "🔧 Setting up frontend..."
cd ../frontend

if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install
fi

if [ ! -f ".env.local" ]; then
    echo "Creating .env.local from example..."
    cp .env.local.example .env.local
fi

echo "✅ Frontend setup complete"
echo ""

# Start services
echo "🚀 Starting services..."
echo ""

# Start backend in background
cd ../backend
source venv/bin/activate
echo "Starting backend server on http://localhost:8000..."
python main.py > /tmp/poker-backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
sleep 3

# Start frontend
cd ../frontend
echo "Starting frontend server on http://localhost:3000..."
npm run dev &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo ""
echo "✅ All services started!"
echo ""
echo "📝 Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "To stop the services:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "Logs:"
echo "   Backend: /tmp/poker-backend.log"
echo ""
echo "Press Ctrl+C to stop monitoring..."

# Wait for user interrupt
wait
