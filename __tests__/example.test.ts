/**
 * Example Test
 * Demonstrates testing infrastructure
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { clearTestData, createTestUser } from '@/lib/services/testing/testHelpers'

describe('Example Test Suite', () => {
  beforeEach(async () => {
    await clearTestData()
  })

  afterEach(async () => {
    await clearTestData()
  })

  it('should create test user', () => {
    const user = createTestUser()
    expect(user).toBeDefined()
    expect(user.id).toBe('test-user-id')
    expect(user.email).toBe('test@example.com')
  })

  it('should perform basic assertion', () => {
    expect(1 + 1).toBe(2)
  })
})

