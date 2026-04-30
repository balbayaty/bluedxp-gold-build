/**
 * Test Utilities & Helpers
 * Shared utilities for testing across the platform
 */

import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'

/**
 * Custom render function with providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  // Add any global providers here (AuthContext, ViewContext, etc.)
  return render(ui, { ...options })
}

/**
 * Mock tenant data for tests
 */
export const mockTenant = {
  id: 'test-tenant-1',
  name: 'Test Tenant',
  slug: 'test-tenant',
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
}

/**
 * Mock user data for tests
 */
export const mockUser = {
  id: 'test-user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'OPERATOR',
  tenantId: 'test-tenant-1',
  permissions: ['read:inventory', 'write:inventory'],
}

/**
 * Mock warehouse data
 */
export const mockWarehouse = {
  id: 'test-warehouse-1',
  name: 'Test Warehouse',
  code: 'WH001',
  tenantId: 'test-tenant-1',
  address: '123 Test St',
  status: 'active',
}

/**
 * Wait for async operations
 */
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Mock API response helper
 */
export function createMockResponse<T>(data: T, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
  } as Response
}

/**
 * Mock fetch helper
 */
export function mockFetch<T>(data: T, status = 200) {
  global.fetch = jest.fn().mockResolvedValue(createMockResponse(data, status))
}

/**
 * Reset all mocks
 */
export function resetAllMocks() {
  jest.clearAllMocks()
  jest.resetAllMocks()
}

/**
 * Create mock service response
 */
export function createServiceResponse<T>(
  data: T,
  success = true,
  message?: string
) {
  return {
    success,
    data,
    message,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Mock error response
 */
export function createErrorResponse(message: string, code?: string) {
  return {
    success: false,
    error: {
      message,
      code: code || 'ERROR',
      timestamp: new Date().toISOString(),
    },
  }
}

/**
 * Test data generators
 */
export const testData = {
  generateId: () => `test-${Math.random().toString(36).substr(2, 9)}`,
  generateEmail: () => `test-${Math.random().toString(36).substr(2, 9)}@example.com`,
  generateDate: () => new Date(),
  generateString: (length = 10) => Math.random().toString(36).substr(2, length),
}













