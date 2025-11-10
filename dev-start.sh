#!/bin/bash

# Development startup script for PC Character Management System

echo "🚀 Starting PC Character Management System - Development Environment"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.dev.yml down

# Start the development environment
echo "🏗️  Building and starting development containers..."
docker-compose -f docker-compose.dev.yml up --build

echo ""
echo "✅ Development environment started!"
echo ""
echo "🌐 Services available at:"
echo "   - Website: http://localhost:5173"
echo "   - API: http://localhost:8765"
echo "   - MongoDB: localhost:27017"
echo ""
echo "💡 The application will automatically reload when you make changes to the code."