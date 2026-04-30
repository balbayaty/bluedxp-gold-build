/**
 * API Key Importer Utility
 * 
 * Helps import API keys from various sources:
 * - Other project directories
 * - Environment files
 * - Configuration files
 * - Manual entry
 */

export interface APIKeySource {
  source: string
  openai?: string
  anthropic?: string
}

/**
 * Search for API keys in a directory
 */
export async function searchDirectoryForAPIKeys(directoryPath: string): Promise<APIKeySource | null> {
  try {
    // This would need to be implemented server-side or via an API route
    // For now, return null as we can't access file system from client-side
    return null
  } catch (error) {
    console.error('Error searching directory:', error)
    return null
  }
}

/**
 * Import API keys from environment file content
 */
export function parseEnvFileContent(content: string): APIKeySource {
  const keys: APIKeySource = {
    source: 'env-file',
  }

  // Parse .env file format
  const lines = content.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('#') || !trimmed.includes('=')) continue

    const [key, ...valueParts] = trimmed.split('=')
    const value = valueParts.join('=').replace(/^["']|["']$/g, '').trim()

    if (key.includes('OPENAI') && value && value.startsWith('sk-') && !value.includes('****')) {
      keys.openai = value
    }
    if (key.includes('ANTHROPIC') && value && value.startsWith('sk-ant-') && !value.includes('****')) {
      keys.anthropic = value
    }
  }

  return keys
}

/**
 * Import API keys from JSON config
 */
export function parseJSONConfig(content: string): APIKeySource {
  try {
    const config = JSON.parse(content)
    const keys: APIKeySource = {
      source: 'json-config',
    }

    // Check common key locations
    if (config.openai?.apiKey && config.openai.apiKey.startsWith('sk-') && !config.openai.apiKey.includes('****')) {
      keys.openai = config.openai.apiKey
    }
    if (config.anthropic?.apiKey && config.anthropic.apiKey.startsWith('sk-ant-') && !config.anthropic.apiKey.includes('****')) {
      keys.anthropic = config.anthropic.apiKey
    }
    if (config.apiKeys?.openai && config.apiKeys.openai.startsWith('sk-') && !config.apiKeys.openai.includes('****')) {
      keys.openai = config.apiKeys.openai
    }
    if (config.apiKeys?.anthropic && config.apiKeys.anthropic.startsWith('sk-ant-') && !config.apiKeys.anthropic.includes('****')) {
      keys.anthropic = config.apiKeys.anthropic
    }
    if (config.OPENAI_API_KEY && config.OPENAI_API_KEY.startsWith('sk-') && !config.OPENAI_API_KEY.includes('****')) {
      keys.openai = config.OPENAI_API_KEY
    }
    if (config.ANTHROPIC_API_KEY && config.ANTHROPIC_API_KEY.startsWith('sk-ant-') && !config.ANTHROPIC_API_KEY.includes('****')) {
      keys.anthropic = config.ANTHROPIC_API_KEY
    }

    return keys
  } catch (error) {
    console.error('Error parsing JSON:', error)
    return { source: 'json-config' }
  }
}

/**
 * Import API keys from JavaScript/TypeScript config
 */
export function parseJSConfig(content: string): APIKeySource {
  const keys: APIKeySource = {
    source: 'js-config',
  }

  // Extract API keys using regex patterns
  const openaiPatterns = [
    /OPENAI[_\s]*API[_\s]*KEY[_\s]*[:=][_\s]*['"`](sk-[^'"`\s]+)['"`]/gi,
    /openai[_\s]*apiKey[_\s]*[:=][_\s]*['"`](sk-[^'"`\s]+)['"`]/gi,
    /openai[_\s]*key[_\s]*[:=][_\s]*['"`](sk-[^'"`\s]+)['"`]/gi,
  ]

  const anthropicPatterns = [
    /ANTHROPIC[_\s]*API[_\s]*KEY[_\s]*[:=][_\s]*['"`](sk-ant-[^'"`\s]+)['"`]/gi,
    /anthropic[_\s]*apiKey[_\s]*[:=][_\s]*['"`](sk-ant-[^'"`\s]+)['"`]/gi,
    /anthropic[_\s]*key[_\s]*[:=][_\s]*['"`](sk-ant-[^'"`\s]+)['"`]/gi,
    /claude[_\s]*apiKey[_\s]*[:=][_\s]*['"`](sk-ant-[^'"`\s]+)['"`]/gi,
  ]

  for (const pattern of openaiPatterns) {
    const match = content.match(pattern)
    if (match && match[1] && !match[1].includes('****')) {
      keys.openai = match[1]
      break
    }
  }

  for (const pattern of anthropicPatterns) {
    const match = content.match(pattern)
    if (match && match[1] && !match[1].includes('****')) {
      keys.anthropic = match[1]
      break
    }
  }

  return keys
}

/**
 * Import API keys from file content (auto-detect format)
 */
export function importAPIKeysFromFile(fileContent: string, fileName: string): APIKeySource {
  const extension = fileName.split('.').pop()?.toLowerCase()

  if (extension === 'env' || fileName.includes('.env')) {
    return parseEnvFileContent(fileContent)
  } else if (extension === 'json') {
    return parseJSONConfig(fileContent)
  } else if (['js', 'ts', 'jsx', 'tsx'].includes(extension || '')) {
    return parseJSConfig(fileContent)
  } else {
    // Try all parsers
    const envResult = parseEnvFileContent(fileContent)
    if (envResult.openai || envResult.anthropic) return envResult

    const jsonResult = parseJSONConfig(fileContent)
    if (jsonResult.openai || jsonResult.anthropic) return jsonResult

    const jsResult = parseJSConfig(fileContent)
    if (jsResult.openai || jsResult.anthropic) return jsResult
  }

  return { source: 'unknown' }
}

/**
 * Save imported keys to localStorage
 */
export function saveImportedKeys(keys: APIKeySource): void {
  if (typeof window === 'undefined') return

  if (keys.openai) {
    localStorage.setItem('openai_api_key', keys.openai)
  }
  if (keys.anthropic) {
    localStorage.setItem('anthropic_api_key', keys.anthropic)
  }
}


