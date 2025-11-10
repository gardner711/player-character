# PC Character Management System - Deployment Guide

This guide covers both development and production deployment of the PC Character Management System.

## Prerequisites

- Docker and Docker Compose installed
- At least 4GB of available RAM
- Ports 80, 5173, 8765, and 27017 available

## Quick Start

### Development Environment

For development with hot reloading:

**Windows:**
```cmd
dev-start.bat
```

**Linux/macOS:**
```bash
chmod +x dev-start.sh
./dev-start.sh
```

### Production Deployment

For production deployment:

**Windows:**
```cmd
deploy.bat
```

**Linux/macOS:**
```bash
chmod +x deploy.sh
./deploy.sh
```

## Architecture

The system consists of three main services:

- **Website** (React SPA): Frontend interface
- **Web Service** (Go API): Backend REST API
- **MongoDB**: Database for character storage

## Development Environment

### Services

- **Website**: http://localhost:5173 (with hot reloading)
- **API**: http://localhost:8765
- **MongoDB**: localhost:27017

### Features

- Hot reloading for both frontend and backend
- Volume mounting for live code changes
- Development logging and debugging
- Automatic container rebuilding on code changes

## Production Environment

### Services

- **Website**: http://localhost (nginx served)
- **API**: http://localhost/api (proxied through nginx)
- **MongoDB**: Internal only (not exposed externally)

### Features

- Optimized production builds
- Nginx reverse proxy for API routing
- Static file caching and compression
- Health checks and graceful shutdown
- Persistent MongoDB data storage

## Manual Commands

### Development

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up --build

# Stop development environment
docker-compose -f docker-compose.dev.yml down

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

### Production

```bash
# Start production environment
docker-compose up --build -d

# Stop production environment
docker-compose down

# View logs
docker-compose logs -f

# Restart services
docker-compose restart
```

## Environment Variables

### Website
- `VITE_API_BASE_URL`: API endpoint URL (configured in docker-compose files)

### Web Service
- `GIN_MODE`: Gin framework mode (debug/release)
- `LOG_LEVEL`: Logging level (debug/info/warn/error)
- `MONGODB_URI`: MongoDB connection string
- `MONGODB_DATABASE`: Database name
- `MONGODB_COLLECTION`: Collection name

## Data Persistence

MongoDB data is persisted in a named Docker volume (`mongodb_data`). To reset the database:

```bash
docker-compose down
docker volume rm player-character_mongodb_data
docker-compose up -d
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 80, 5173, 8765, 27017 are available
2. **Memory issues**: Increase Docker memory allocation to at least 4GB
3. **Build failures**: Clear Docker cache with `docker system prune`

### Logs

View service logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f webservice
docker-compose logs -f website
docker-compose logs -f mongodb
```

### Health Checks

Check container health:
```bash
docker ps
docker stats
```

## Security Notes

- In production, MongoDB is not exposed externally
- API is proxied through nginx with security headers
- No sensitive data is logged in production mode
- Consider using secrets management for production credentials

## Performance

- Production builds are optimized and minified
- Static assets are cached by nginx
- Database queries are indexed for performance
- Container images are multi-stage built for minimal size