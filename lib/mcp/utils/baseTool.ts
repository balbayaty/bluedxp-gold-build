/**
 * Base MCP Tool Utilities
 * 
 * Enterprise-grade utilities for creating resilient, scalable MCP tools
 * Provides common patterns: error handling, tenant validation, retry logic, observability
 * 
 * @module mcp
 */

import type { MCPServer } from '../server'
import { observabilityService } from '@/lib/services/observability'

/**
 * MCP Tool Execution Context
 */
export interface MCPToolContext {
  tenantId: string
  userId?: string
  toolName: string
  requestId?: string
  startTime: Date
}

/**
 * MCP Tool Result
 */
export interface MCPToolResult<T = any> {
  success: boolean
  data?: T
  error?: string
  executionTime?: number
  metadata?: Record<string, any>
}

/**
 * MCP Tool Options
 */
export interface MCPToolOptions {
  timeout?: number // milliseconds
  retries?: number
  retryDelay?: number // milliseconds
  requireTenant?: boolean
  logExecution?: boolean
  trackMetrics?: boolean
}

/**
 * Validate tenant ID (multi-tenant day 1)
 */
export function validateTenant(tenantId: string | undefined, requireTenant = true): void {
  if (requireTenant && !tenantId) {
    throw new Error('tenantId is required (multi-tenant day 1)')
  }
  
  if (tenantId && (tenantId === 'default' || tenantId === 'default-tenant')) {
    throw new Error('Invalid tenantId: default tenants are not allowed in production')
  }
}

/**
 * Execute MCP tool with enterprise-grade error handling and observability
 */
export async function executeMCPTool<T>(
  toolName: string,
  handler: () => Promise<T>,
  context: Omit<MCPToolContext, 'startTime'>,
  options: MCPToolOptions = {}
): Promise<MCPToolResult<T>> {
  const {
    timeout = 30000, // 30 seconds default
    retries = 0,
    retryDelay = 1000,
    requireTenant = true,
    logExecution = true,
    trackMetrics = true,
  } = options

  const startTime = new Date()
  const requestId = context.requestId || `mcp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  
  const fullContext: MCPToolContext = {
    ...context,
    toolName,
    requestId,
    startTime,
  }

  // Validate tenant
  try {
    validateTenant(context.tenantId, requireTenant)
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      executionTime: 0,
    }
  }

  // Log execution start
  if (logExecution) {
    await observabilityService.log({
      level: 'info',
      message: `MCP Tool Execution Started: ${toolName}`,
      context: {
        toolName,
        tenantId: context.tenantId,
        userId: context.userId,
        requestId,
      },
      tenantId: context.tenantId,
    })
  }

  // Execute with retry logic
  let lastError: Error | null = null
  let attempt = 0

  while (attempt <= retries) {
    try {
      // Execute with timeout
      const result = await Promise.race([
        handler(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Tool execution timeout after ${timeout}ms`)), timeout)
        ),
      ])

      const executionTime = Date.now() - startTime.getTime()

      // Track metrics
      if (trackMetrics) {
        await observabilityService.trackMetric({
          name: 'mcp_tool_execution',
          value: executionTime,
          unit: 'milliseconds',
          tags: {
            tool: toolName,
            tenant: context.tenantId,
            success: 'true',
          },
          tenantId: context.tenantId,
        })
      }

      // Log success
      if (logExecution) {
        await observabilityService.log({
          level: 'info',
          message: `MCP Tool Execution Completed: ${toolName}`,
          context: {
            toolName,
            tenantId: context.tenantId,
            userId: context.userId,
            requestId,
            executionTime,
          },
          tenantId: context.tenantId,
        })
      }

      return {
        success: true,
        data: result,
        executionTime,
        metadata: {
          requestId,
          attempt: attempt + 1,
        },
      }
    } catch (error: any) {
      lastError = error

      // Log error
      await observabilityService.log({
        level: 'error',
        message: `MCP Tool Execution Error: ${toolName}`,
        context: {
          toolName,
          tenantId: context.tenantId,
          userId: context.userId,
          requestId,
          attempt: attempt + 1,
          error: error.message,
          stack: error.stack,
        },
        tenantId: context.tenantId,
      })

      // Track error metric
      if (trackMetrics) {
        await observabilityService.trackMetric({
          name: 'mcp_tool_execution_error',
          value: 1,
          unit: 'count',
          tags: {
            tool: toolName,
            tenant: context.tenantId,
            error: error.message,
          },
          tenantId: context.tenantId,
        })
      }

      // Retry if attempts remaining
      if (attempt < retries) {
        attempt++
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt)) // Exponential backoff
        continue
      }

      // No more retries
      break
    }
  }

  const executionTime = Date.now() - startTime.getTime()

  return {
    success: false,
    error: lastError?.message || 'Unknown error',
    executionTime,
    metadata: {
      requestId,
      attempts: attempt + 1,
    },
  }
}

/**
 * Create standardized MCP tool handler with enterprise patterns
 */
export function createMCPToolHandler<TParams = any, TResult = any>(
  toolName: string,
  handler: (params: TParams, context: MCPToolContext) => Promise<TResult>,
  options: MCPToolOptions = {}
) {
  return async (params: TParams & { tenantId?: string; userId?: string }): Promise<MCPToolResult<TResult>> => {
    const tenantId = params.tenantId
    const userId = params.userId

    return executeMCPTool(
      toolName,
      () => handler(params, {
        tenantId: tenantId || '',
        userId,
        toolName,
        startTime: new Date(),
      }),
      {
        tenantId: tenantId || '',
        userId,
        toolName,
      },
      options
    )
  }
}

/**
 * Validate required parameters
 */
export function validateParams<T extends Record<string, any>>(
  params: T,
  required: (keyof T)[]
): void {
  const missing = required.filter(key => !params[key])
  if (missing.length > 0) {
    throw new Error(`Missing required parameters: ${missing.join(', ')}`)
  }
}

/**
 * Sanitize error message for user-facing responses
 */
export function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    // Don't expose internal errors
    if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
      return 'Service temporarily unavailable. Please try again later.'
    }
    if (error.message.includes('timeout')) {
      return 'Request timed out. Please try again.'
    }
    return error.message
  }
  return 'An unexpected error occurred'
}













