# 🧪 Testing Guide

## Overview

This guide covers testing strategies, test structure, and best practices for BlueDXP Platform.

---

## 📁 Test Structure

```
__tests__/
├── unit/              # Unit tests
│   ├── services/      # Service unit tests
│   ├── components/    # Component unit tests
│   └── utils/         # Utility tests
├── integration/       # Integration tests
│   ├── services/      # Service integration
│   └── modules/       # Module integration
└── e2e/              # End-to-end tests
    ├── flows/         # User flows
    └── scenarios/     # Test scenarios
```

---

## 🧪 Unit Tests

### Service Tests

Test individual services in isolation:

```typescript
describe('ServiceName', () => {
  it('should perform action', async () => {
    const result = await service.action()
    expect(result).toBeDefined()
  })
})
```

### Component Tests

Test React components:

```typescript
import { render, screen } from '@testing-library/react'
import Component from '@/components/Component'

describe('Component', () => {
  it('should render', () => {
    render(<Component />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
})
```

---

## 🔗 Integration Tests

### Service Integration

Test interactions between services:

```typescript
describe('Service Integration', () => {
  it('should integrate Service A with Service B', async () => {
    const resultA = await serviceA.action()
    const resultB = await serviceB.action(resultA.id)
    expect(resultB).toBeDefined()
  })
})
```

### Module Integration

Test module interactions:

```typescript
describe('Module Integration', () => {
  it('should integrate WMS with TMS', async () => {
    // Test cross-module functionality
  })
})
```

---

## 🎭 End-to-End Tests

### User Flows

Test complete user workflows:

```typescript
describe('E2E: Shipment Flow', () => {
  it('should complete shipment lifecycle', async () => {
    // 1. Create shipment
    // 2. Assign carrier
    // 3. Track shipment
    // 4. Deliver shipment
    // 5. Verify completion
  })
})
```

---

## 🚀 Running Tests

### All Tests

```bash
npm test
```

### Unit Tests Only

```bash
npm run test:unit
```

### Integration Tests Only

```bash
npm run test:integration
```

### E2E Tests Only

```bash
npm run test:e2e
```

### Watch Mode

```bash
npm run test:watch
```

### Coverage

```bash
npm run test:coverage
```

---

## 📊 Test Coverage Goals

- **Unit Tests:** 80%+ coverage
- **Integration Tests:** 60%+ coverage
- **E2E Tests:** Critical flows covered

---

## ✅ Best Practices

### 1. Test Isolation

- Each test should be independent
- Use `beforeEach`/`afterEach` for setup/cleanup
- Mock external dependencies

### 2. Descriptive Names

```typescript
// Good
it('should return COMMITTED state when probability > 0.7', () => {})

// Bad
it('should work', () => {})
```

### 3. Arrange-Act-Assert

```typescript
it('should calculate accuracy', () => {
  // Arrange
  const prediction = { value: 100, confidence: 0.8 }
  const outcome = { value: 95 }

  // Act
  const accuracy = calculateAccuracy(prediction, outcome)

  // Assert
  expect(accuracy).toBeGreaterThan(0.9)
})
```

### 4. Mock External Services

```typescript
jest.mock('@/lib/services/external-api', () => ({
  externalService: {
    call: jest.fn().mockResolvedValue({ success: true }),
  },
}))
```

### 5. Test Error Cases

```typescript
it('should handle errors gracefully', async () => {
  await expect(service.action()).rejects.toThrow('Expected error')
})
```

---

## 🔧 Test Utilities

### Mock Data

```typescript
export const mockShipment: Shipment = {
  id: 'test-shipment-1',
  tenantId: 'test-tenant',
  // ... other fields
}
```

### Test Helpers

```typescript
export async function createTestShipment() {
  return await shipmentService.create(mockShipment)
}
```

---

## 📝 Writing New Tests

### 1. Identify What to Test

- Core functionality
- Edge cases
- Error handling
- Integration points

### 2. Write Test First (TDD)

- Write failing test
- Implement feature
- Make test pass
- Refactor

### 3. Keep Tests Fast

- Use mocks for slow operations
- Avoid real database calls in unit tests
- Use test databases for integration tests

---

## 🐛 Debugging Tests

### Run Single Test

```bash
npm test -- ServiceName.test.ts
```

### Debug Mode

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Verbose Output

```bash
npm test -- --verbose
```

---

## 📈 Continuous Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Scheduled nightly runs

---

## 🎯 Test Checklist

- [ ] Unit tests for all services
- [ ] Integration tests for key flows
- [ ] E2E tests for critical paths
- [ ] Error handling tests
- [ ] Edge case tests
- [ ] Performance tests
- [ ] Security tests

---

For more details, see individual test files in `__tests__/` directory.

