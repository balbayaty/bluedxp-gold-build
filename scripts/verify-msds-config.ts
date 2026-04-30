/**
 * Verify MSDS Batch Processing Configuration
 * Checks if API keys are properly configured for cloud OCR
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

function checkEnvFile(): void {
  const envPath = join(process.cwd(), '.env.local')
  
  if (!existsSync(envPath)) {
    console.error('❌ .env.local file not found!')
    console.log('   Create it by copying env.example:')
    console.log('   Copy-Item env.example .env.local')
    return
  }

  const envContent = readFileSync(envPath, 'utf-8')
  
  // Check for commented API keys
  const openaiCommented = /^#\s*OPENAI_API_KEY/.test(envContent) || /^#\s*NEXT_PUBLIC_OPENAI_API_KEY/.test(envContent)
  const anthropicCommented = /^#\s*ANTHROPIC_API_KEY/.test(envContent) || /^#\s*NEXT_PUBLIC_ANTHROPIC_API_KEY/.test(envContent)
  
  // Check for uncommented API keys
  const openaiUncommented = /^OPENAI_API_KEY\s*=/.test(envContent) || /^NEXT_PUBLIC_OPENAI_API_KEY\s*=/.test(envContent)
  const anthropicUncommented = /^ANTHROPIC_API_KEY\s*=/.test(envContent) || /^NEXT_PUBLIC_ANTHROPIC_API_KEY\s*=/.test(envContent)
  
  console.log('\n📋 MSDS Batch Processing Configuration Check\n')
  
  if (openaiCommented && !openaiUncommented) {
    console.warn('⚠️  OpenAI API key is COMMENTED OUT in .env.local')
    console.log('   To enable cloud OCR for scanned PDFs, uncomment:')
    console.log('   OPENAI_API_KEY=sk-proj-...')
    console.log('')
  } else if (openaiUncommented) {
    console.log('✅ OpenAI API key is configured')
  }
  
  if (anthropicCommented && !anthropicUncommented) {
    console.warn('⚠️  Anthropic API key is COMMENTED OUT in .env.local')
    console.log('   To enable cloud OCR, uncomment:')
    console.log('   ANTHROPIC_API_KEY=sk-ant-...')
    console.log('')
  } else if (anthropicUncommented) {
    console.log('✅ Anthropic API key is configured')
  }
  
  if (!openaiUncommented && !anthropicUncommented) {
    console.error('\n❌ NO API KEYS CONFIGURED')
    console.log('   Cloud OCR will NOT work for scanned PDFs')
    console.log('   Scanned/image-only PDFs will fail with:')
    console.log('   "Insufficient text extracted from document"')
    console.log('')
    console.log('   To fix:')
    console.log('   1. Open .env.local')
    console.log('   2. Uncomment OPENAI_API_KEY or ANTHROPIC_API_KEY')
    console.log('   3. Restart server: npm run dev')
  } else {
    console.log('\n✅ Configuration looks good!')
    console.log('   Cloud OCR is enabled for scanned PDFs')
  }
  
  // Check environment variables at runtime
  console.log('\n🔍 Runtime Environment Check:')
  const openaiEnv = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY
  const anthropicEnv = process.env.ANTHROPIC_API_KEY || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY
  
  if (openaiEnv) {
    console.log(`✅ OPENAI_API_KEY loaded (${openaiEnv.substring(0, 10)}...)`)
  } else {
    console.log('❌ OPENAI_API_KEY not found in process.env')
    console.log('   Note: Environment variables are only loaded when server starts')
    console.log('   Restart server after changing .env.local')
  }
  
  if (anthropicEnv) {
    console.log(`✅ ANTHROPIC_API_KEY loaded (${anthropicEnv.substring(0, 10)}...)`)
  } else {
    console.log('❌ ANTHROPIC_API_KEY not found in process.env')
  }
  
  console.log('\n')
}

checkEnvFile()

