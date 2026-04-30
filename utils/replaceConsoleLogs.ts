/**
 * Utility script to systematically replace console.log/error/warn with proper logging
 * This is a helper script - actual replacements should be done manually for accuracy
 */

import { logger } from '@/lib/services/observability/logger'
import { errorTrackingService } from '@/lib/services/observability/errorTracking'

/**
 * Replace console.error with proper error handling
 * Use this pattern in API routes:
 * 
 * OLD:
 *   } catch (error: any) {
 *     console.error('Error message', error)
 *     return NextResponse.json({ error: error.message }, { status: 500 })
 *   }
 * 
 * NEW:
 *   } catch (error: unknown) {
 *     const err = error instanceof Error ? error : new Error(String(error))
 *     logger.error('Error message', err, { module: 'module-name', service: 'service-name' })
 *     errorTrackingService.captureException(err, { module: 'module-name', service: 'service-name' })
 *     return NextResponse.json({ error: err.message }, { status: 500 })
 *   }
 */

export function handleApiError(error: unknown, context: { module: string; service: string }): Error {
  const err = error instanceof Error ? error : new Error(String(error))
  logger.error(`Error in ${context.module}/${context.service}`, err, context)
  errorTrackingService.captureException(err, context)
  return err
}

/**
 * Replace console.log with proper logging
 * Use logger.info, logger.debug, logger.warn as appropriate
 */













