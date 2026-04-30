/**
 * ML Module Validation Utilities
 * Comprehensive validation for ML module data
 * PRODUCTION READY - Bulletproof data validation
 */

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Validate ML model data structure
 */
export function validateModelData(model: any): ValidationResult {
  const errors: string[] = []

  if (!model) {
    return { valid: false, errors: ['Model data is required'] }
  }

  if (typeof model !== 'object') {
    return { valid: false, errors: ['Model data must be an object'] }
  }

  if (!model.id || typeof model.id !== 'string') {
    errors.push('Model ID is required and must be a string')
  }

  if (!model.name || typeof model.name !== 'string') {
    errors.push('Model name is required and must be a string')
  }

  if (model.metrics) {
    if (typeof model.metrics !== 'object') {
      errors.push('Metrics must be an object')
    } else {
      if (model.metrics.accuracy !== undefined) {
        if (typeof model.metrics.accuracy !== 'number' || isNaN(model.metrics.accuracy)) {
          errors.push('Accuracy must be a valid number')
        } else if (model.metrics.accuracy < 0 || model.metrics.accuracy > 1) {
          errors.push('Accuracy must be between 0 and 1')
        }
      }

      if (model.metrics.precision !== undefined) {
        if (typeof model.metrics.precision !== 'number' || isNaN(model.metrics.precision)) {
          errors.push('Precision must be a valid number')
        } else if (model.metrics.precision < 0 || model.metrics.precision > 1) {
          errors.push('Precision must be between 0 and 1')
        }
      }

      if (model.metrics.recall !== undefined) {
        if (typeof model.metrics.recall !== 'number' || isNaN(model.metrics.recall)) {
          errors.push('Recall must be a valid number')
        } else if (model.metrics.recall < 0 || model.metrics.recall > 1) {
          errors.push('Recall must be between 0 and 1')
        }
      }

      if (model.metrics.f1Score !== undefined) {
        if (typeof model.metrics.f1Score !== 'number' || isNaN(model.metrics.f1Score)) {
          errors.push('F1 Score must be a valid number')
        } else if (model.metrics.f1Score < 0 || model.metrics.f1Score > 1) {
          errors.push('F1 Score must be between 0 and 1')
        }
      }
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Safely parse float value with default fallback
 */
export function safeParseFloat(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined) return defaultValue
  if (typeof value === 'number') {
    return isNaN(value) || !isFinite(value) ? defaultValue : value
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed === '') return defaultValue
    const parsed = parseFloat(trimmed)
    return isNaN(parsed) || !isFinite(parsed) ? defaultValue : parsed
  }
  return defaultValue
}

/**
 * Safely parse integer value with default fallback
 */
export function safeParseInt(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined) return defaultValue
  if (typeof value === 'number') {
    const intValue = Math.floor(value)
    return isNaN(intValue) || !isFinite(intValue) ? defaultValue : intValue
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed === '') return defaultValue
    const parsed = parseInt(trimmed, 10)
    return isNaN(parsed) || !isFinite(parsed) ? defaultValue : parsed
  }
  return defaultValue
}

/**
 * Validate array and ensure it's actually an array
 */
export function safeArray<T>(value: any, defaultValue: T[] = []): T[] {
  if (Array.isArray(value)) return value
  return defaultValue
}

/**
 * Validate object and ensure it's actually an object
 */
export function safeObject<T extends Record<string, any>>(
  value: any,
  defaultValue: T
): T {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as T
  }
  return defaultValue
}

/**
 * Clamp number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  if (isNaN(value) || !isFinite(value)) return min
  return Math.max(min, Math.min(max, value))
}

/**
 * Validate LLM metrics response
 */
export function validateLLMMetricsResponse(data: any): ValidationResult {
  const errors: string[] = []

  if (!data) {
    return { valid: false, errors: ['Response data is required'] }
  }

  if (typeof data !== 'object') {
    return { valid: false, errors: ['Response data must be an object'] }
  }

  if (data.success === false) {
    errors.push(data.error || 'API request was unsuccessful')
  }

  if (data.models !== undefined) {
    if (!Array.isArray(data.models)) {
      errors.push('Models must be an array')
    } else {
      data.models.forEach((model: any, index: number) => {
        const modelValidation = validateModelData(model)
        if (!modelValidation.valid) {
          errors.push(`Model ${index}: ${modelValidation.errors.join(', ')}`)
        }
      })
    }
  }

  return { valid: errors.length === 0, errors }
}


