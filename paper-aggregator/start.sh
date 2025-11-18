#!/bin/bash

echo "========================================="
echo "Snark Express - Setup & Start"
echo "========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "Node version: $(node -v)"
echo "npm version: $(npm -v)"
echo ""

# Backend setup
echo "Setting up backend..."
cd backend

if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

if [ ! -f ".env" ]; then
    echo "Creating .env file from example..."
    cp .env.example .env
    echo "⚠️  Please edit backend/.env to set your JWT_SECRET and ADMIN_KEY"
fi

echo "Initializing database..."
npm run init-db

echo "Running database migrations..."
npm run migrate

echo "Starting backend server..."
npm run dev &
BACKEND_PID=$!

cd ..

# Frontend setup
echo ""
echo "Setting up frontend..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo "Starting frontend server..."
npm run dev &
FRONTEND_PID=$!

cd ..

echo ""
echo "========================================="
echo "Setup complete!"
echo "========================================="
echo ""
echo "Backend running on: http://localhost:3001"
echo "Frontend running on: http://localhost:3000"
echo ""
echo "Open http://localhost:3000 in your browser to get started!"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
