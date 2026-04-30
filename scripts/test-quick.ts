/**
 * Quick Connection Test
 * 
 * Quick test to verify all Rabet.sa APIs are accessible
 * Run with: npx tsx scripts/test-quick.ts
 */

async function quickTest() {
  console.log('🚀 Quick Connection Test for Rabet.sa APIs...\n')

  const tests = [
    {
      name: 'Athr Naql',
      test: async () => {
        const { getOrInitializeAthrNaqlService } = await import('@/lib/services/athr-naql/initialize')
        const service = await getOrInitializeAthrNaqlService()
        return service.testConnection()
      },
    },
    {
      name: 'WASL',
      test: async () => {
        const { getOrInitializeWaslService } = await import('@/lib/services/wasl/initialize')
        const service = await getOrInitializeWaslService()
        return service.testConnection()
      },
    },
    {
      name: 'Bayan',
      test: async () => {
        const { getOrInitializeBayanService } = await import('@/lib/services/bayan/initialize')
        const service = await getOrInitializeBayanService()
        return service.testConnection()
      },
    },
    {
      name: 'Daleel',
      test: async () => {
        const { getOrInitializeDaleelService } = await import('@/lib/services/daleel/initialize')
        const service = await getOrInitializeDaleelService()
        return service.testConnection()
      },
    },
  ]

  const results = []

  for (const { name, test } of tests) {
    try {
      const result = await test()
      results.push({ name, success: result.success, message: result.message })
      console.log(`${result.success ? '✅' : '❌'} ${name}: ${result.message}`)
    } catch (error: any) {
      results.push({ name, success: false, message: error.message })
      console.log(`❌ ${name}: ${error.message}`)
    }
  }

  console.log('\n' + '='.repeat(60))
  const passed = results.filter(r => r.success).length
  const total = results.length
  console.log(`Results: ${passed}/${total} passed`)
  console.log('='.repeat(60))

  return results.every(r => r.success)
}

if (require.main === module) {
  quickTest()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
}

export { quickTest }



