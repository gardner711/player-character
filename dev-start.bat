@echo off
REM Development startup script for PC Character Management System (Windows)

echo 🚀 Starting PC Character Management System - Development Environment
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker and try again.
    exit /b 1
)

REM Stop any existing containers
echo 🛑 Stopping existing containers...
docker-compose -f docker-compose.dev.yml down

REM Start the development environment
echo 🏗️  Building and starting development containers...
docker-compose -f docker-compose.dev.yml up --build

echo.
echo ✅ Development environment started!
echo.
echo 🌐 Services available at:
echo    - Website: http://localhost:5173
echo    - API: http://localhost:8765
echo    - MongoDB: localhost:27017
echo.
echo 💡 The application will automatically reload when you make changes to the code.
pause