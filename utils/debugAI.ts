/**
 * Debug utilities for AI functionality
 */

export function debugAPIKeys(): void {
  if (typeof window === 'undefined') {
    console.log('🔍 Server-side: Checking environment variables...')
    console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Set (hidden)' : 'Not set')
    console.log('NEXT_PUBLIC_OPENAI_API_KEY:', process.env.NEXT_PUBLIC_OPENAI_API_KEY ? 'Set (hidden)' : 'Not set')
    console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? 'Set (hidden)' : 'Not set')
    console.log('NEXT_PUBLIC_ANTHROPIC_API_KEY:', process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY ? 'Set (hidden)' : 'Not set')
    return
  }

  console.log('🔍 Client-side: Checking localStorage...')
  
  // Check all possible localStorage keys
  const keysToCheck = [
    'openai_api_key',
    'OPENAI_API_KEY',
    'openai-key',
    'ai_api_key',
    'anthropic_api_key',
    'ANTHROPIC_API_KEY',
    'anthropic-key',
    'claude_api_key',
  ]

  keysToCheck.forEach(key => {
    const value = localStorage.getItem(key)
    if (value) {
      const preview = value.length > 10 ? `${value.substring(0, 10)}...` : value
      console.log(`  ${key}: ${preview} (${value.length} chars)`)
    }
  })

  // Check sessionStorage
  console.log('🔍 Checking sessionStorage...')
  keysToCheck.forEach(key => {
    const value = sessionStorage.getItem(key)
    if (value) {
      const preview = value.length > 10 ? `${value.substring(0, 10)}...` : value
      console.log(`  ${key}: ${preview} (${value.length} chars)`)
    }
  })

  // Test isAIAvailable
  import('@/utils/aiClient').then(({ isAIAvailable, getAvailableProviders }) => {
    console.log('🔍 AI Availability Check:')
    console.log('  isAIAvailable():', isAIAvailable())
    console.log('  Available providers:', getAvailableProviders())
  })
}

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).debugAI = debugAPIKeys
}


