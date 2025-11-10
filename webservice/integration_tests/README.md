# Integration Tests for Webservice-Object Storage

This directory contains integration tests that validate the end-to-end functionality between the webservice REST API and MongoDB object storage.

## Overview

The integration tests exercise all character CRUD operations and validate that data is correctly stored in and retrieved from MongoDB. The tests ensure:

- ✅ All REST API endpoints work correctly
- ✅ Data persistence in MongoDB
- ✅ Data consistency between API responses and MongoDB documents
- ✅ Error handling for invalid requests
- ✅ Pagination functionality
- ✅ BSON serialization/deserialization

## Test Structure

```
integration_tests/
├── docker-compose.test.yml    # Test-specific container configuration
├── character_crud_test.go     # Main integration test suite
├── test_utils.go              # Test client utilities and helpers
├── test_data.go               # Test fixtures and sample data
├── run_integration_tests.sh   # Test runner script
└── README.md                  # This file
```

## Test Coverage

### CRUD Operations
- **Create Character**: POST /api/characters with validation
- **Read Character**: GET /api/characters/{id} with error handling
- **List Characters**: GET /api/characters with pagination
- **Update Character**: PUT /api/characters/{id} with validation
- **Delete Character**: DELETE /api/characters/{id} with cleanup

### Data Validation
- API responses match MongoDB document structure
- BSON serialization preserves all character fields
- Timestamps are correctly set (CreatedAt, UpdatedAt)
- ID generation and consistency

### Error Scenarios
- 404 responses for non-existent characters
- 400 responses for invalid requests
- Proper error messages and status codes

### Pagination
- Page and limit parameters
- Total count and page metadata
- HasNext/HasPrev indicators
- Edge cases (empty results, last page)

## Running the Tests

### Prerequisites

- Docker and Docker Compose installed
- Go 1.23+ installed
- Ports 8766 (webservice) and 27018 (MongoDB) available

### Automated Test Run

Use the provided script for a complete test run:

```bash
cd integration_tests
./run_integration_tests.sh
```

This script will:
1. Start MongoDB and webservice containers
2. Wait for services to be healthy
3. Run all integration tests
4. Clean up containers on completion

### Manual Test Run

If you prefer to run tests manually:

1. Start the test services:
```bash
cd integration_tests
docker-compose -f docker-compose.test.yml up -d
```

2. Wait for services to be ready (check logs):
```bash
docker-compose -f docker-compose.test.yml logs -f
```

3. Run the tests:
```bash
cd ..
go test ./integration_tests/... -v
```

4. Clean up:
```bash
cd integration_tests
docker-compose -f docker-compose.test.yml down -v
```

## Test Configuration

The tests use isolated resources:

- **MongoDB Database**: `playercharacter_test`
- **Collection**: `playercharacters`
- **Ports**: 8766 (webservice), 27018 (MongoDB)
- **Base URL**: `http://localhost:8766`

## Test Data

Tests use predefined character fixtures in `test_data.go`:

- `TestCharacterData`: Single character for basic CRUD tests
- `UpdatedTestCharacterData`: Modified version for update tests
- `TestCharactersData`: Array of 3 characters for pagination tests

## Troubleshooting

### Services Won't Start
- Check if ports 8766 and 27018 are available
- Ensure Docker daemon is running
- Check container logs: `docker-compose -f docker-compose.test.yml logs`

### Tests Fail with Connection Errors
- Verify services are healthy: `curl http://localhost:8766/health`
- Check MongoDB connection: `docker-compose -f docker-compose.test.yml exec mongodb mongosh --eval "db.stats()"`

### Test Timeouts
- Increase timeout values in `run_integration_tests.sh`
- Check system resources (CPU/memory)
- Run tests individually: `go test ./integration_tests/... -run TestCharacterCRUDIntegration/CreateCharacter -v`

## CI/CD Integration

These integration tests are designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions step
- name: Run Integration Tests
  run: |
    cd webservice/integration_tests
    ./run_integration_tests.sh
  timeout-minutes: 10
```

## Performance Expectations

- **Test Execution Time**: < 5 minutes
- **Service Startup Time**: < 2 minutes
- **Individual Test Time**: < 30 seconds each

## Extending the Tests

To add new integration tests:

1. Add test data to `test_data.go`
2. Add test methods to `TestClient` in `test_utils.go`
3. Add test cases to `character_crud_test.go`
4. Update this README with new test descriptions

## Related Documentation

- [Character CRUD API](../specifications/978746-capability.md)
- [Character CRUD Operations](../specifications/979956-enabler.md)
- [API Integration Testing](../specifications/716845-capability.md)