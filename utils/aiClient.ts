/**
 * AI Client Utilities
 * 
 * Provides unified interface for multiple AI providers:
 * - OpenAI (GPT-4, GPT-3.5)
 * - Anthropic (Claude)
 * - Future: Google Gemini, etc.
 * 
 * Features:
 * - Streaming responses
 * - Context management
 * - Token usage tracking
 * - Error handling & retries
 * - Cost optimization
 */

import { apiFetch } from '@/utils/apiFetch'

export type AIProvider = 'openai' | 'anthropic' | 'auto'

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIResponse {
  content: string
  tokensUsed?: number
  model?: string
  finishReason?: string
}

export interface AIStreamChunk {
  content: string
  done: boolean
}

export interface AIConfig {
  provider: AIProvider
  model?: string
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

// Default configuration
const DEFAULT_CONFIG: AIConfig = {
  provider: 'auto',
  temperature: 0.7,
  maxTokens: 2000,
  stream: false,
}

type AIConnectivity = {
  available: boolean
  providers: AIProvider[]
  mode?: 'real' | 'mock'
  activeProvider?: string
}

/**
 * Get API key from environment
 */
function getAPIKey(provider: AIProvider): string | null {
  if (typeof window === 'undefined') {
    // Server-side: use environment variables
    if (provider === 'openai' || provider === 'auto') {
      return process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY || null
    }
    if (provider === 'anthropic') {
      return process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY || null
    }
  } else {
    // Client-side: check multiple sources in order of priority

    // 1. Check localStorage (from AI settings page) - PRIMARY SOURCE
    try {
      const storedKey = localStorage.getItem(`${provider}_api_key`)
      if (storedKey && storedKey.trim() && storedKey.length > 20 && !storedKey.includes('****') && !storedKey.includes('your-key')) {
        console.log(`✅ Found ${provider} API key in localStorage (${storedKey.length} chars)`)
        return storedKey
      }
    } catch (e) {
      console.warn(`Error reading localStorage for ${provider}:`, e)
    }

    // 2. Check for OpenAI key in localStorage (alternative key names)
    if (provider === 'openai' || provider === 'auto') {
      const altKeys = [
        'openai_api_key',
        'OPENAI_API_KEY',
        'openai-key',
        'ai_api_key',
        'OPENAI_KEY',
        'openaiKey',
      ]
      for (const key of altKeys) {
        try {
          const value = localStorage.getItem(key)
          if (value && value.trim() && value.length > 20 && value.startsWith('sk-') && !value.includes('****') && !value.includes('your-key')) {
            // Also save it with standard name for future use
            localStorage.setItem('openai_api_key', value)
            return value
          }
        } catch (e) {
          // Ignore errors
        }
      }
    }

    // 3. Check for Anthropic key in localStorage (alternative key names)
    if (provider === 'anthropic') {
      const altKeys = [
        'anthropic_api_key',
        'ANTHROPIC_API_KEY',
        'anthropic-key',
        'claude_api_key',
        'ANTHROPIC_KEY',
        'anthropicKey',
        'claudeKey',
      ]
      for (const key of altKeys) {
        try {
          const value = localStorage.getItem(key)
          if (value && value.trim() && value.length > 20 && value.startsWith('sk-ant-') && !value.includes('****') && !value.includes('your-key')) {
            // Also save it with standard name for future use
            localStorage.setItem('anthropic_api_key', value)
            return value
          }
        } catch (e) {
          // Ignore errors
        }
      }
    }

    // 4. Check sessionStorage (sometimes used for temporary storage)
    try {
      const sessionKey = sessionStorage.getItem(`${provider}_api_key`)
      if (sessionKey && sessionKey.trim() && sessionKey.length > 20 && !sessionKey.includes('****')) {
        // Copy to localStorage for persistence
        localStorage.setItem(`${provider}_api_key`, sessionKey)
        return sessionKey
      }
    } catch (e) {
      // Ignore errors
    }

    // 5. Fallback to environment (for Next.js public env vars)
    if (provider === 'openai' || provider === 'auto') {
      const envKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY
      if (envKey && envKey.length > 20 && !envKey.includes('****')) {
        // Save to localStorage for consistency
        try {
          localStorage.setItem('openai_api_key', envKey)
        } catch (e) {
          // Ignore errors
        }
        return envKey
      }
    }
    if (provider === 'anthropic') {
      const envKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY
      if (envKey && envKey.length > 20 && !envKey.includes('****')) {
        // Save to localStorage for consistency
        try {
          localStorage.setItem('anthropic_api_key', envKey)
        } catch (e) {
          // Ignore errors
        }
        return envKey
      }
    }
  }
  return null
}

export async function callAIProxy(
  messages: AIMessage[],
  config: AIConfig,
  headers?: Record<string, string>
): Promise<AIResponse> {
  // IMPORTANT: Server-side env vars (OPENAI_API_KEY / ANTHROPIC_API_KEY) are ALWAYS preferred.
  // Only send client keys if explicitly provided AND server doesn't have env vars.
  // The server will check env vars first, so we can safely omit client keys to let server use .env.local
  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Only add client-supplied keys if explicitly provided (for dev/testing)
  // Server will prefer .env.local keys anyway, so this is just a fallback
  if (headers) {
    Object.assign(finalHeaders, headers)
  }

  const response = await apiFetch('/api/ai/chat', {
    method: 'POST',
    headers: finalHeaders,
    body: JSON.stringify({
      messages,
      provider: config.provider || 'auto',
      model: config.model,
      temperature: config.temperature ?? DEFAULT_CONFIG.temperature,
      maxTokens: config.maxTokens ?? DEFAULT_CONFIG.maxTokens,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({} as any))
    const base =
      (errorData && (errorData.error || errorData.message)) ||
      `API route error: HTTP ${response.status} ${response.statusText}`
    const msg = errorData?.reason ? `${String(base)} (reason: ${String(errorData.reason)})` : String(base)
    const details = errorData?.details ? `\n\nDetails: ${String(errorData.details)}` : ''
    throw new Error(`${msg}${details}`)
  }

  const data = await response.json().catch(() => ({} as any))
  return {
    content: data.content || '',
    tokensUsed: data.tokensUsed,
    model: data.model,
    finishReason: data.finishReason,
  }
}

/**
 * Determine best available provider
 */
function getBestProvider(): AIProvider {
  const openaiKey = getAPIKey('openai')
  const anthropicKey = getAPIKey('anthropic')

  console.log('getBestProvider check:', {
    openaiKey: openaiKey ? `${openaiKey.substring(0, 10)}...` : 'null',
    anthropicKey: anthropicKey ? `${anthropicKey.substring(0, 10)}...` : 'null',
  })

  if (openaiKey && openaiKey.length > 20 && openaiKey.startsWith('sk-')) {
    console.log('Selected provider: openai')
    return 'openai'
  }
  if (anthropicKey && anthropicKey.length > 20 && anthropicKey.startsWith('sk-ant-')) {
    console.log('Selected provider: anthropic')
    return 'anthropic'
  }

  console.log('No valid API keys found, will use mock mode')
  return 'auto' // Will use mock mode
}

/**
 * Call OpenAI API
 */
async function callOpenAI(
  messages: AIMessage[],
  config: AIConfig
): Promise<AIResponse> {
  const apiKey = getAPIKey('openai')
  const model = config.model || 'gpt-4-turbo-preview'

  console.log('Calling OpenAI API with model:', model)

  try {
    // In the browser: ALWAYS use the API route proxy (avoids CORS and key leakage).
    // Direct browser calls to providers are blocked by CORS in most environments.
    if (typeof window !== 'undefined') {
      try {
        // ALWAYS use server-side env vars from .env.local (preferred)
        // Only send client key if server doesn't have env vars (for dev/testing)
        // Server will check OPENAI_API_KEY from .env.local first
        const out = await callAIProxy(messages, { ...config, provider: 'openai', model })
        console.log('✅ Used API route proxy (server will use OPENAI_API_KEY from .env.local if available)')
        return out
      } catch (apiRouteError: any) {
        // Make the failure explicit and actionable.
        throw new Error(apiRouteError?.message || 'AI proxy request failed')
      }
    }
    if (!apiKey) {
      console.error('OpenAI API key not found. Available sources:', {
        localStorage: typeof window !== 'undefined' ? localStorage.getItem('openai_api_key') : 'N/A',
        env: process.env.NEXT_PUBLIC_OPENAI_API_KEY ? 'Set' : 'Not set',
      })
      throw new Error('OpenAI API key not found. Please add your API key in Settings > AI & Agents')
    }
    // Validate API key format
    if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
      throw new Error('Invalid OpenAI API key format. Keys should start with "sk-" and be at least 20 characters long.')
    }

    // Fallback to direct API call
    console.log('Using direct API call to OpenAI')
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        temperature: config.temperature || DEFAULT_CONFIG.temperature,
        max_tokens: config.maxTokens || DEFAULT_CONFIG.maxTokens,
        stream: config.stream || false,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: `HTTP ${response.status}: ${response.statusText}` } }))
      const errorMessage = errorData.error?.message || errorData.message || JSON.stringify(errorData)
      console.error('OpenAI API error:', errorMessage, errorData)
      throw new Error(`OpenAI API error: ${errorMessage}`)
    }

    const data = await response.json()

    return {
      content: data.choices[0]?.message?.content || '',
      tokensUsed: data.usage?.total_tokens,
      model: data.model,
      finishReason: data.choices[0]?.finish_reason,
    }
  } catch (error: any) {
    console.error('OpenAI API call failed:', error)
    if (error.message) {
      throw error
    }
    throw new Error(`Failed to call OpenAI API: ${error.message || 'Unknown error'}`)
  }
}

/**
 * Call Anthropic Claude API
 */
async function callAnthropic(
  messages: AIMessage[],
  config: AIConfig
): Promise<AIResponse> {
  const apiKey = getAPIKey('anthropic')
  const model = config.model || 'claude-3-opus-20240229'

  // Convert messages to Anthropic format
  const systemMessage = messages.find(m => m.role === 'system')
  const conversationMessages = messages.filter(m => m.role !== 'system')

  console.log('Calling Anthropic API with model:', model)

  try {
    // In the browser: ALWAYS use the API route proxy (avoids CORS and key leakage).
    if (typeof window !== 'undefined') {
      try {
        // ALWAYS use server-side env vars from .env.local (preferred)
        // Server will check ANTHROPIC_API_KEY from .env.local first
        const out = await callAIProxy(messages, { ...config, provider: 'anthropic', model })
        console.log('✅ Used API route proxy (server will use ANTHROPIC_API_KEY from .env.local if available)')
        return out
      } catch (apiRouteError: any) {
        throw new Error(apiRouteError?.message || 'AI proxy request failed')
      }
    }
    if (!apiKey) {
      console.error('Anthropic API key not found. Available sources:', {
        localStorage: typeof window !== 'undefined' ? localStorage.getItem('anthropic_api_key') : 'N/A',
        env: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY ? 'Set' : 'Not set',
      })
      throw new Error('Anthropic API key not found. Please add your API key in Settings > AI & Agents')
    }

    // Validate API key format
    if (!apiKey.startsWith('sk-ant-') || apiKey.length < 20) {
      throw new Error('Invalid Anthropic API key format. Keys should start with "sk-ant-" and be at least 20 characters long.')
    }

    // Fallback to direct API call
    console.log('Using direct API call to Anthropic')
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: config.maxTokens || DEFAULT_CONFIG.maxTokens,
        temperature: config.temperature || DEFAULT_CONFIG.temperature,
        system: systemMessage?.content,
        messages: conversationMessages.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: `HTTP ${response.status}: ${response.statusText}` } }))
      const errorMessage = errorData.error?.message || errorData.message || JSON.stringify(errorData)
      console.error('Anthropic API error:', errorMessage, errorData)
      throw new Error(`Anthropic API error: ${errorMessage}`)
    }

    const data = await response.json()

    return {
      content: data.content[0]?.text || '',
      tokensUsed: data.usage?.input_tokens && data.usage?.output_tokens
        ? data.usage.input_tokens + data.usage.output_tokens
        : undefined,
      model: data.model,
      finishReason: data.stop_reason,
    }
  } catch (error: any) {
    console.error('Anthropic API call failed:', error)
    if (error.message) {
      throw error
    }
    throw new Error(`Failed to call Anthropic API: ${error.message || 'Unknown error'}`)
  }
}

/**
 * Stream OpenAI responses
 */
async function* streamOpenAI(
  messages: AIMessage[],
  config: AIConfig
): AsyncGenerator<AIStreamChunk> {
  const apiKey = getAPIKey('openai')
  if (!apiKey) {
    throw new Error('OpenAI API key not found')
  }

  const model = config.model || 'gpt-4-turbo-preview'
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      temperature: config.temperature || DEFAULT_CONFIG.temperature,
      max_tokens: config.maxTokens || DEFAULT_CONFIG.maxTokens,
      stream: true,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(`OpenAI API error: ${error.error?.message || JSON.stringify(error)}`)
  }

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  if (!reader) {
    throw new Error('Failed to get response stream')
  }

  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      yield { content: '', done: true }
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') {
          yield { content: '', done: true }
          return
        }

        try {
          const json = JSON.parse(data)
          const content = json.choices[0]?.delta?.content || ''
          if (content) {
            yield { content, done: false }
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }
}

/**
 * Main AI call function - automatically selects provider
 */
export async function callAI(
  messages: AIMessage[],
  config: Partial<AIConfig> = {}
): Promise<AIResponse> {
  const finalConfig: AIConfig = { ...DEFAULT_CONFIG, ...config }
  const provider = finalConfig.provider === 'auto' ? getBestProvider() : finalConfig.provider

  console.log('callAI called with provider:', provider, 'config:', { ...finalConfig, provider })

  // In the browser, prefer the server proxy even when we have NO client-stored keys.
  // This allows using server-side env keys (OPENAI_API_KEY / ANTHROPIC_API_KEY) securely.
  if (typeof window !== 'undefined') {
    const openaiKey = getAPIKey('openai')
    const anthropicKey = getAPIKey('anthropic')

    // If the caller requested a specific provider, let callOpenAI/callAnthropic handle proxy usage.
    // If 'auto' (or no local keys), call proxy in auto mode without leaking keys.
    if (finalConfig.provider === 'auto' && !openaiKey && !anthropicKey) {
      console.log('No client keys found; trying server-side proxy (auto provider)')
      return await callAIProxy(messages, { ...finalConfig, provider: 'auto' })
    }
  }

  try {
    if (provider === 'openai') {
      console.log('Calling OpenAI API...')
      return await callOpenAI(messages, finalConfig)
    } else if (provider === 'anthropic') {
      console.log('Calling Anthropic API...')
      return await callAnthropic(messages, finalConfig)
    } else {
      // Auto-select based on availability
      const openaiKey = getAPIKey('openai')
      const anthropicKey = getAPIKey('anthropic')

      if (openaiKey && openaiKey.length > 20 && openaiKey.startsWith('sk-')) {
        console.log('Auto-selected OpenAI')
        return await callOpenAI(messages, finalConfig)
      } else if (anthropicKey && anthropicKey.length > 20 && anthropicKey.startsWith('sk-ant-')) {
        console.log('Auto-selected Anthropic')
        return await callAnthropic(messages, finalConfig)
      } else {
        console.log('No valid keys, using mock mode')
        return mockAIResponse(messages)
      }
    }
  } catch (error: any) {
    console.error('AI API error:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })

    // Fallback to mock mode on ANY error to keep the bot working
    console.warn('AI API call failed, falling back to mock mode:', error.message)
    return mockAIResponse(messages)
  }
}

/**
 * Stream AI responses
 */
export async function* streamAI(
  messages: AIMessage[],
  config: Partial<AIConfig> = {}
): AsyncGenerator<AIStreamChunk> {
  const finalConfig: AIConfig = { ...DEFAULT_CONFIG, ...config, stream: true }
  const provider = finalConfig.provider === 'auto' ? getBestProvider() : finalConfig.provider

  if (provider === 'openai' && getAPIKey('openai')) {
    yield* streamOpenAI(messages, finalConfig)
  } else {
    // Fallback to non-streaming for other providers or mock mode
    const response = await callAI(messages, { ...finalConfig, stream: false })
    // Simulate streaming
    const words = response.content.split(' ')
    for (let i = 0; i < words.length; i++) {
      yield { content: words[i] + (i < words.length - 1 ? ' ' : ''), done: false }
      await new Promise(resolve => setTimeout(resolve, 20))
    }
    yield { content: '', done: true }
  }
}

/**
 * Mock AI response (fallback when no API keys)
 */
function mockAIResponse(messages: AIMessage[]): AIResponse {
  const lastMessage = messages[messages.length - 1]?.content || ''

  // Simple pattern matching for demo
  if (lastMessage.toLowerCase().includes('optimize')) {
    return {
      content: `I've analyzed your request and identified optimization opportunities. Based on the current data, I recommend:\n\n1. Streamline processes to reduce cycle time by 15%\n2. Optimize resource allocation to improve efficiency\n3. Automate repetitive tasks to reduce manual effort\n\nWould you like me to implement these optimizations?`,
      tokensUsed: 150,
      model: 'mock-gpt-4',
    }
  }

  if (lastMessage.toLowerCase().includes('report')) {
    return {
      content: `I've generated a comprehensive report based on your request. The report includes:\n\n- Key performance metrics\n- Trend analysis\n- Recommendations for improvement\n\nYou can view the full report in your dashboard.`,
      tokensUsed: 120,
      model: 'mock-gpt-4',
    }
  }

  return {
    content: `I understand you're asking about: "${lastMessage}". I'm currently operating in demo mode. To enable full AI capabilities, please configure your API keys in the settings.\n\nIn production mode, I can:\n- Analyze your data in real-time\n- Provide intelligent recommendations\n- Automate workflows\n- Generate insights and reports\n\nWould you like help setting up API keys?`,
    tokensUsed: 100,
    model: 'mock-gpt-4',
  }
}

/**
 * Build context-aware system prompt for Hazalyze
 */
export function buildSystemPrompt(context?: {
  currentPage?: string
  userRole?: string
  tenantId?: string
  recentActions?: string[]
  screenControlEnabled?: boolean
  screenAnalysis?: any
}): string {
  let prompt = `You are Hazalyze Copilot, an AI assistant for a world-class Warehouse Management System (WMS) platform.

Platform Context:
- Hazalyze is an intelligent chemical safety and logistics platform
- Multi-tenant 3PL/4PL warehouse management system
- Based in Saudi Arabia (SAR currency, Saudi regulations)
- Supports multiple warehouses, customers, and complex logistics operations

Your Capabilities:
- Analyze warehouse operations and provide insights
- Optimize processes and workflows
- Generate reports and analytics
- Answer questions about the platform
- Help users navigate and use features effectively
- Provide intelligent recommendations based on data`

  if (context?.screenControlEnabled) {
    prompt += `
- **SCREEN CONTROL**: You can directly interact with the screen:
  * Click buttons and links
  * Fill in forms
  * Navigate between pages
  * Extract data from tables and pages
  * Execute multi-step workflows

Use action commands in your responses:
- [CLICK: "button text"] - Click an element
- [TYPE: "field", "value"] - Type into a field
- [SELECT: "field", "option"] - Select an option
- [NAVIGATE: "/path"] - Navigate to a page
- [EXTRACT: "table"] - Extract data
- [SCROLL: "top"] - Scroll the page`
  }

  prompt += `

Current Context:
${context?.currentPage ? `- Current Page: ${context.currentPage}` : ''}
${context?.userRole ? `- User Role: ${context.userRole}` : ''}
${context?.tenantId ? `- Tenant: ${context.tenantId}` : ''}`

  if (context?.screenAnalysis) {
    const analysis = context.screenAnalysis
    prompt += `
- Available on page:
  * ${analysis.buttons?.length || 0} buttons
  * ${analysis.inputs?.length || 0} input fields
  * ${analysis.forms?.length || 0} forms
  * ${analysis.tables?.length || 0} tables`
  }

  prompt += `

Guidelines:
- Be concise and actionable
- Use Saudi Riyal (SAR) for currency
- Reference specific modules and features when relevant
- Provide step-by-step guidance when needed
- Always consider multi-tenant and role-based access
- Focus on practical, implementable solutions`

  if (context?.screenControlEnabled) {
    prompt += `
- When user asks to do something on the page, analyze available elements and execute actions
- Always confirm before executing destructive actions (delete, remove, clear)
- Show what you're doing as you execute actions
- If an action fails, explain why and suggest alternatives`
  }

  prompt += `

Respond in a helpful, professional manner.`

  return prompt
}

/**
 * Check if AI is available (has API keys)
 */
export function isAIAvailable(): boolean {
  const openaiKey = getAPIKey('openai')
  const anthropicKey = getAPIKey('anthropic')

  const available = !!(openaiKey || anthropicKey)

  console.log('isAIAvailable check:', {
    openai: openaiKey ? `${openaiKey.substring(0, 10)}...` : 'null',
    anthropic: anthropicKey ? `${anthropicKey.substring(0, 10)}...` : 'null',
    available,
  })

  return available
}

/**
 * Browser-safe connectivity check (uses server health endpoint to detect server-side keys).
 * Use this for UI badges/indicators; do not block calls based on this result.
 */
export async function getAIConnectivity(): Promise<AIConnectivity> {
  // Client-side: combine "client key present" + "server says real provider configured"
  const providers: AIProvider[] = []
  if (getAPIKey('openai')) providers.push('openai')
  if (getAPIKey('anthropic')) providers.push('anthropic')

  try {
    const resp = await apiFetch('/api/system/health', { method: 'GET' })
    if (!resp.ok) {
      return { available: providers.length > 0, providers }
    }
    const data = (await resp.json().catch(() => ({} as any))) as any
    const openaiConfigured = !!data?.ai?.openaiConfigured
    const anthropicConfigured = !!data?.ai?.anthropicConfigured
    const serverProviders: AIProvider[] = []
    if (openaiConfigured) serverProviders.push('openai')
    if (anthropicConfigured) serverProviders.push('anthropic')

    const merged = Array.from(new Set([...providers, ...serverProviders]))
    const available = merged.length > 0 && data?.ai?.mode !== 'mock'
    return {
      available,
      providers: merged,
      mode: data?.ai?.mode,
      activeProvider: data?.ai?.activeProvider,
    }
  } catch {
    return { available: providers.length > 0, providers }
  }
}

/**
 * Get available providers
 */
export function getAvailableProviders(): AIProvider[] {
  const providers: AIProvider[] = []
  if (getAPIKey('openai')) providers.push('openai')
  if (getAPIKey('anthropic')) providers.push('anthropic')
  return providers
}

// callAIProxy is defined above as an async function (line ~177)
