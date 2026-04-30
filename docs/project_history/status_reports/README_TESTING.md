# 🧪 Testing Overview

## Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## Test Structure

- **Unit Tests** (`__tests__/unit/`) - Test individual functions/services
- **Integration Tests** (`__tests__/integration/`) - Test service interactions
- **E2E Tests** (`__tests__/e2e/`) - Test complete user flows

## Coverage Goals

- Unit Tests: 80%+
- Integration Tests: 60%+
- E2E Tests: Critical flows

## Running Specific Tests

```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# E2E tests only
npm run test:e2e

# Specific file
npm test -- ServiceName.test.ts
```

## Test Examples

See `__tests__/` directory for:
- Service unit tests
- Integration test examples
- E2E flow tests

## Documentation

- [Testing Guide](docs/TESTING_GUIDE.md) - Complete testing documentation
- [API Documentation](docs/API_DOCUMENTATION.md) - API reference
- [User Guide](docs/USER_GUIDE.md) - User documentation

