@echo off
REM Production deployment script for PC Character Management System (Windows)

echo 🚀 Deploying PC Character Management System - Production Environment
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker and try again.
    exit /b 1
)

REM Stop any existing containers
echo 🛑 Stopping existing containers...
docker-compose down

REM Build and start production containers
echo 🏗️  Building and starting production containers...
docker-compose up --build -d

echo.
echo ✅ Production deployment completed!
echo.
echo 🌐 Services available at:
echo    - Website: http://localhost
echo    - API: http://localhost/api
echo.
echo 📊 To view logs:
echo    docker-compose logs -f
echo.
echo 🛑 To stop the deployment:
echo    docker-compose down
pause