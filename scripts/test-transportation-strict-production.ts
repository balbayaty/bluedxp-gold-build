/**
 * Transportation / Target-2 Strict Production - Self Test
 *
 * This script is designed to be run in CI to prevent regressions where
 * production could start with unsafe defaults (mock auth, in-memory ledgers, etc).
 *
 * Run:
 *   npm run test:transportation:strict
 */

import { checkProductionReadiness } from '@/lib/services/production/productionGate'
import { verifyToken } from '@/middleware/apiAuth'

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message)
}

async function main(): Promise<void> {
  const oldEnv = { ...process.env }

  try {
    // 1) Production readiness must fail when required vars are missing
    process.env.NODE_ENV = 'production'
    delete process.env.DATABASE_URL
    delete process.env.REDIS_URL
    delete process.env.EVENT_STORE_BACKEND
    delete process.env.JWT_SECRET
    delete process.env.JWT_JWKS_URL
    delete process.env.MINIO_ENDPOINT
    delete process.env.MINIO_ROOT_USER
    delete process.env.MINIO_ROOT_PASSWORD

    const readiness = checkProductionReadiness()
    assert(readiness.ok === false, 'Expected production readiness to fail when env vars are missing.')
    assert(readiness.ok === false && readiness.errors.length >= 3, 'Expected multiple production readiness errors.')

    // 2) Mock tokens must be rejected in production
    const ctx = await verifyToken('dev-token')
    assert(ctx === null, 'Expected verifyToken("dev-token") to be rejected in production.')

    console.log('✅ Transportation strict production self-test passed.')
  } finally {
    process.env = oldEnv
  }
}

main().catch((e) => {
  console.error('❌ Transportation strict production self-test failed.')
  console.error(e)
  process.exit(1)
})


