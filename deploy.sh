#!/bin/bash

# Production deployment script for PC Character Management System

echo "🚀 Deploying PC Character Management System - Production Environment"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Build and start production containers
echo "🏗️  Building and starting production containers..."
docker-compose up --build -d

echo ""
echo "✅ Production deployment completed!"
echo ""
echo "🌐 Services available at:"
echo "   - Website: http://localhost"
echo "   - API: http://localhost/api"
echo ""
echo "📊 To view logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 To stop the deployment:"
echo "   docker-compose down"