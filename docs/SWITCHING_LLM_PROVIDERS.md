# 🔄 Switching LLM Providers - Easy Guide

## ✅ **YES - Super Easy!**

You can switch between **any providers** with just **one parameter change**!

---

## 🎯 How Easy Is It?

### **One Parameter Change!**

```typescript
// Use Ollama (Local)
{ "provider": "ollama" }

// Switch to OpenAI
{ "provider": "openai" }

// Switch to Anthropic
{ "provider": "anthropic" }

// Switch to Google Gemini (when added)
{ "provider": "google" }
```

**That's it!** No code changes needed.

---

## 📝 Examples

### **Example 1: Switch in API Call**

```bash
# Use Ollama (Local)
POST /api/llm/generate
{
  "provider": "ollama",
  "model": "llama2",
  "messages": [{"role": "user", "content": "Hello!"}]
}

# Switch to OpenAI (just change provider!)
POST /api/llm/generate
{
  "provider": "openai",  // ← Changed this!
  "model": "gpt-4o",
  "messages": [{"role": "user", "content": "Hello!"}]
}

# Switch to Anthropic
POST /api/llm/generate
{
  "provider": "anthropic",  // ← Changed this!
  "model": "claude-3-5-sonnet-20241022",
  "messages": [{"role": "user", "content": "Hello!"}]
}
```

**Same request format - just change `provider`!**

---

### **Example 2: Switch in Code**

```typescript
import { providerRegistry } from '@/lib/services/llm-provider/core/providerRegistry'

// Get any provider
const ollama = providerRegistry.get('ollama')
const openai = providerRegistry.get('openai')
const anthropic = providerRegistry.get('anthropic')

// Use any provider - same interface!
const response1 = await ollama.generate({
  messages: [{ role: 'user', content: 'Hello!' }],
  model: 'llama2'
})

const response2 = await openai.generate({
  messages: [{ role: 'user', content: 'Hello!' }],
  model: 'gpt-4o'
})

const response3 = await anthropic.generate({
  messages: [{ role: 'user', content: 'Hello!' }],
  model: 'claude-3-5-sonnet-20241022'
})
```

**Same code - just change provider!**

---

### **Example 3: Smart Provider Selection**

```typescript
// Automatically choose best provider
function getBestProvider(task: string, dataSensitivity: 'high' | 'low'): string {
  if (dataSensitivity === 'high') {
    return 'ollama'  // Use local for sensitive data
  }
  
  if (task.includes('vision') || task.includes('image')) {
    return 'openai'  // GPT-4 Vision
  }
  
  if (task.includes('analysis') || task.includes('reasoning')) {
    return 'anthropic'  // Claude is great for analysis
  }
  
  return 'ollama'  // Default to local
}

// Use it
const provider = getBestProvider('Analyze MSDS', 'high')
const response = await providerRegistry.get(provider)!.generate({...})
```

---

## 🔄 Provider Comparison

| Provider | When to Use | Cost | Privacy | Speed |
|----------|-------------|------|---------|-------|
| **Ollama (Local)** | Sensitive data, compliance, cost savings | $0 | ✅ 100% | Medium |
| **OpenAI** | Best performance, vision, latest models | $$ | ⚠️ Shared | Fast |
| **Anthropic** | Analysis, reasoning, long context | $$ | ⚠️ Shared | Fast |
| **Google Gemini** | Multimodal, cost-effective | $ | ⚠️ Shared | Fast |

---

## 🎯 Use Cases

### **Use Local (Ollama) For:**
- ✅ Sensitive data (MSDS, compliance)
- ✅ Saudi Arabia compliance (data sovereignty)
- ✅ Cost savings (high volume)
- ✅ Offline capability
- ✅ Custom domain models

### **Use Cloud (OpenAI/Anthropic) For:**
- ✅ Maximum performance
- ✅ Latest models (GPT-4o, Claude 3.5)
- ✅ Vision capabilities
- ✅ Complex reasoning
- ✅ Quick prototyping

---

## 🔀 Switching Strategies

### **Strategy 1: Manual Selection**

```typescript
// You choose provider
const provider = 'ollama'  // or 'openai', 'anthropic'
const response = await providerRegistry.get(provider)!.generate({...})
```

### **Strategy 2: Automatic Fallback**

```typescript
// Try providers in order
async function generateWithFallback(request: LLMRequest) {
  const providers = ['ollama', 'openai', 'anthropic']
  
  for (const provider of providers) {
    try {
      const llmProvider = providerRegistry.get(provider)
      if (llmProvider && llmProvider.getStatus().status === 'online') {
        return await llmProvider.generate(request)
      }
    } catch (error) {
      console.warn(`${provider} failed, trying next...`)
      continue
    }
  }
  
  throw new Error('All providers failed')
}
```

### **Strategy 3: Data-Driven Selection**

```typescript
// Choose based on data sensitivity
function selectProvider(dataSensitivity: 'high' | 'medium' | 'low'): string {
  if (dataSensitivity === 'high') {
    return 'ollama'  // Must stay local
  }
  if (dataSensitivity === 'medium') {
    return 'anthropic'  // Good balance
  }
  return 'openai'  // Best performance
}
```

### **Strategy 4: Task-Based Selection**

```typescript
// Choose based on task type
function selectProviderForTask(task: string): string {
  if (task.includes('compliance') || task.includes('MSDS')) {
    return 'ollama'  // Local for compliance
  }
  if (task.includes('vision') || task.includes('image')) {
    return 'openai'  // GPT-4 Vision
  }
  if (task.includes('analysis') || task.includes('reasoning')) {
    return 'anthropic'  // Claude for analysis
  }
  return 'ollama'  // Default to local
}
```

---

## 📊 List All Available Providers

```bash
GET /api/llm/providers
```

**Response:**
```json
{
  "success": true,
  "providers": [
    {
      "id": "ollama",
      "name": "Ollama (Local)",
      "category": "local",
      "status": "online",
      "supportedModels": ["llama2", "mistral", ...]
    },
    {
      "id": "openai",
      "name": "OpenAI",
      "category": "text",
      "status": "online",
      "supportedModels": ["gpt-4o", "gpt-4", "gpt-3.5-turbo", ...]
    },
    {
      "id": "anthropic",
      "name": "Anthropic Claude",
      "category": "text",
      "status": "online",
      "supportedModels": ["claude-3-5-sonnet", "claude-3-opus", ...]
    }
  ],
  "stats": {
    "totalProviders": 3,
    "online": 3,
    "offline": 0
  }
}
```

---

## 🔧 Configuration

### **Provider-Specific Configuration**

Each provider can have its own config:

```typescript
// Configure OpenAI
await providerRegistry.initializeProvider('openai', {
  apiKey: process.env.OPENAI_API_KEY,
  baseUrl: 'https://api.openai.com/v1',
  timeout: 30000,
})

// Configure Anthropic
await providerRegistry.initializeProvider('anthropic', {
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseUrl: 'https://api.anthropic.com/v1',
  timeout: 30000,
})

// Configure Ollama (Local)
await providerRegistry.initializeProvider('ollama', {
  baseUrl: 'http://localhost:11434',
  timeout: 60000,  // Longer timeout for local
})
```

**All use the same interface!**

---

## 🎯 Real-World Examples

### **Example 1: Compliance Task (Use Local)**

```typescript
// MSDS analysis - must stay local for compliance
POST /api/llm/generate
{
  "provider": "ollama",  // Local for compliance
  "model": "hazalyze-msds-analyzer",  // Your trained model
  "messages": [
    {"role": "user", "content": "Analyze this MSDS: [sensitive data]"}
  ]
}
```

### **Example 2: General Task (Use Cloud)**

```typescript
// General question - can use cloud
POST /api/llm/generate
{
  "provider": "openai",  // Cloud for performance
  "model": "gpt-4o",
  "messages": [
    {"role": "user", "content": "Explain quantum computing"}
  ]
}
```

### **Example 3: Analysis Task (Use Anthropic)**

```typescript
// Complex analysis - use Claude
POST /api/llm/generate
{
  "provider": "anthropic",  // Claude for analysis
  "model": "claude-3-5-sonnet-20241022",
  "messages": [
    {"role": "user", "content": "Analyze this complex scenario..."}
  ]
}
```

---

## 🔄 Dynamic Switching

### **Switch Based on Conditions**

```typescript
async function generateWithSmartSelection(
  request: LLMRequest,
  context: {
    dataSensitivity: 'high' | 'medium' | 'low'
    taskType: string
    requiredCapabilities: string[]
  }
): Promise<LLMResponse> {
  // 1. Check data sensitivity
  if (context.dataSensitivity === 'high') {
    return await providerRegistry.get('ollama')!.generate(request)
  }
  
  // 2. Check required capabilities
  if (context.requiredCapabilities.includes('vision')) {
    const openai = providerRegistry.get('openai')
    if (openai?.supportsVision) {
      return await openai.generate(request)
    }
  }
  
  // 3. Check task type
  if (context.taskType === 'analysis') {
    return await providerRegistry.get('anthropic')!.generate(request)
  }
  
  // 4. Default to local
  return await providerRegistry.get('ollama')!.generate(request)
}
```

---

## 📋 Provider Status Check

```typescript
// Check which providers are available
const providers = providerRegistry.list()
const availableProviders = providers.filter(p => 
  p.getStatus().status === 'online'
)

console.log('Available providers:', availableProviders.map(p => p.id))
// Output: ['ollama', 'openai', 'anthropic']
```

---

## 🎯 Best Practices

### **1. Use Local for Sensitive Data**
```typescript
if (isSensitiveData(data)) {
  provider = 'ollama'  // Always local
}
```

### **2. Use Cloud for Performance**
```typescript
if (needsHighPerformance(task)) {
  provider = 'openai'  // Best performance
}
```

### **3. Fallback Strategy**
```typescript
// Try local first, fallback to cloud
const providers = ['ollama', 'openai', 'anthropic']
for (const provider of providers) {
  try {
    return await generate(provider, request)
  } catch (error) {
    continue
  }
}
```

### **4. Cost Optimization**
```typescript
// Use local for high volume, cloud for low volume
if (requestCount > 1000) {
  provider = 'ollama'  // Save costs
} else {
  provider = 'openai'  // Better performance
}
```

---

## ✅ Summary

### **How Easy Is It?**

**Super Easy!** Just change one parameter:

```typescript
// Switch from Ollama to OpenAI
{ "provider": "ollama" }  →  { "provider": "openai" }
```

### **What's Available?**

- ✅ **Ollama** (Local) - Already integrated
- ✅ **OpenAI** - Already integrated
- ✅ **Anthropic** - Already integrated
- ⏳ **Google Gemini** - Easy to add (just create provider file)
- ⏳ **50+ More** - Easy to add (plugin system)

### **Benefits:**

- ✅ **Unified Interface** - All providers work the same way
- ✅ **Easy Switching** - One parameter change
- ✅ **Smart Selection** - Choose based on task/data
- ✅ **Fallback Support** - Try multiple providers
- ✅ **No Code Changes** - Just change provider name

---

## 🚀 Quick Reference

```typescript
// Switch providers - just change this!
const provider = 'ollama'      // Local
const provider = 'openai'      // OpenAI
const provider = 'anthropic'   // Anthropic
const provider = 'google'       // Gemini (when added)

// Use it
const response = await providerRegistry.get(provider)!.generate({...})
```

---

**Status**: ✅ **Fully Flexible - Switch Anytime!**

**You can switch between any providers with just one parameter change!**


