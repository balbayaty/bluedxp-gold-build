# 🚀 LLM Provider System - Quick Start Guide

## Adding a New Provider (3 Steps!)

### Step 1: Create Provider File

Create a new file: `lib/services/llm-provider/providers/your-provider/YourProvider.ts`

```typescript
import { BaseLLMProvider } from '../base/BaseLLMProvider'
import type { LLMRequest, LLMResponse } from '../../../core/providerInterface'

export class YourProvider extends BaseLLMProvider {
  id = 'your-provider'
  name = 'Your Provider Name'
  version = '1.0.0'
  description = 'Description of your provider'
  
  supportsStreaming = true
  supportsFunctionCalling = false
  supportsVision = false
  supportsAudio = false
  maxContextLength = 4096
  supportedModels = ['model-1', 'model-2']
  
  requiredConfig = {
    type: 'object',
    properties: {
      apiKey: { type: 'string', required: true, secret: true },
    },
    required: ['apiKey'],
  }
  
  async generate(request: LLMRequest): Promise<LLMResponse> {
    // Your implementation here
    // Call your provider's API
    // Return LLMResponse
  }
}
```

### Step 2: Register Provider

Create: `lib/services/llm-provider/providers/your-provider/index.ts`

```typescript
import { YourProvider } from './YourProvider'
import { providerRegistry } from '../../core/providerRegistry'

export const yourProvider = new YourProvider()
providerRegistry.register(yourProvider)
```

### Step 3: Import in Service Initializer

Add to `lib/services/integration/serviceInitializer.ts`:

```typescript
// Import your provider
import '@/lib/services/llm-provider/providers/your-provider'
```

**That's it!** Your provider is now available system-wide. No other code changes needed!

---

## Using Providers

### Via Service

```typescript
import { providerRegistry } from '@/lib/services/llm-provider/core/providerRegistry'

const provider = providerRegistry.get('your-provider')
const response = await provider.generate({
  messages: [{ role: 'user', content: 'Hello!' }],
  model: 'model-1',
})
```

### Via API

```typescript
POST /api/llm/generate
{
  "provider": "your-provider",
  "messages": [...],
  "model": "model-1"
}
```

---

## Provider Features

- ✅ **Unlimited providers** - Add as many as you want
- ✅ **Zero code changes** - Just add provider file
- ✅ **Automatic registration** - Auto-discovered on import
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Encrypted keys** - Automatic encryption
- ✅ **Cost tracking** - Automatic cost calculation
- ✅ **Health monitoring** - Built-in health checks
- ✅ **Streaming support** - Optional streaming implementation

---

## Example Providers Included

- ✅ OpenAI (already implemented)
- ✅ Anthropic (already implemented)
- ✅ Mistral AI (example implementation)
- 🔄 Google (in progress)
- 🔄 50+ more providers (ready to add)

---

**Status**: Ready for unlimited provider expansion!


