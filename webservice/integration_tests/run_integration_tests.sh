#!/bin/bash

# Integration Test Runner for Webservice-Object Storage Integration
# This script starts the required services, runs integration tests, and cleans up

set -e

echo "🚀 Starting integration tests for webservice-object storage..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INTEGRATION_DIR="$PROJECT_ROOT/integration_tests"
DOCKER_COMPOSE_FILE="$INTEGRATION_DIR/docker-compose.test.yml"

echo "📁 Project root: $PROJECT_ROOT"
echo "📁 Integration tests: $INTEGRATION_DIR"

# Function to cleanup on exit
cleanup() {
    echo "🧹 Cleaning up..."
    cd "$INTEGRATION_DIR"
    docker-compose -f docker-compose.test.yml down -v 2>/dev/null || true
}

# Set trap to cleanup on exit
trap cleanup EXIT

# Start services
echo "🐳 Starting MongoDB and webservice containers..."
cd "$INTEGRATION_DIR"
docker-compose -f docker-compose.test.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."

# Wait for MongoDB
echo "Waiting for MongoDB..."
timeout=60
while ! docker-compose -f docker-compose.test.yml exec -T mongodb mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; do
    if [ $timeout -le 0 ]; then
        echo -e "${RED}❌ MongoDB failed to start${NC}"
        exit 1
    fi
    echo "Waiting for MongoDB... ($timeout seconds remaining)"
    sleep 2
    timeout=$((timeout - 2))
done
echo -e "${GREEN}✅ MongoDB is ready${NC}"

# Wait for webservice
echo "Waiting for webservice..."
timeout=60
while ! curl -f http://localhost:8766/health >/dev/null 2>&1; do
    if [ $timeout -le 0 ]; then
        echo -e "${RED}❌ Webservice failed to start${NC}"
        exit 1
    fi
    echo "Waiting for webservice... ($timeout seconds remaining)"
    sleep 2
    timeout=$((timeout - 2))
done
echo -e "${GREEN}✅ Webservice is ready${NC}"

# Run integration tests
echo "🧪 Running integration tests..."
cd "$PROJECT_ROOT"
if go test ./integration_tests/... -v; then
    echo -e "${GREEN}✅ All integration tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Integration tests failed${NC}"
    exit 1
fi