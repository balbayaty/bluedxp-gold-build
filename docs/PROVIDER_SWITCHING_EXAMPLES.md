# 🔄 LLM Provider Switching - Examples

## ✅ **Super Easy - One Parameter Change!**

---

## 📝 Quick Examples

### **Example 1: Simple Switch**

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

**Same format - just change `provider`!**

---

### **Example 2: Smart Selection (Automatic)**

```bash
# Let system choose best provider
POST /api/llm/smart-select
{
  "messages": [{"role": "user", "content": "Analyze this MSDS..."}],
  "dataSensitivity": "high",  // System will choose Ollama
  "taskType": "analysis"
}

# Response includes which provider was selected and why
{
  "success": true,
  "provider": "ollama",
  "model": "llama2",
  "selectionReason": "Selected Ollama (local) for data sovereignty and compliance",
  "content": "..."
}
```

---

### **Example 3: Code-Based Switching**

```typescript
import { providerRegistry } from '@/lib/services/llm-provider/core/providerRegistry'

// Easy switching in code
async function generateWithProvider(provider: string) {
  const llmProvider = providerRegistry.get(provider)
  return await llmProvider.generate({
    messages: [{ role: 'user', content: 'Hello!' }]
  })
}

// Use any provider
const response1 = await generateWithProvider('ollama')
const response2 = await generateWithProvider('openai')
const response3 = await generateWithProvider('anthropic')
```

---

## 🎯 When to Use Which Provider

### **Use Ollama (Local) When:**
- ✅ Sensitive data (MSDS, compliance)
- ✅ Saudi Arabia compliance required
- ✅ High volume (cost savings)
- ✅ Offline needed
- ✅ Custom domain models

### **Use OpenAI When:**
- ✅ Best performance needed
- ✅ Vision/image tasks
- ✅ Latest models (GPT-4o)
- ✅ Quick prototyping

### **Use Anthropic When:**
- ✅ Complex analysis
- ✅ Long context needed
- ✅ Superior reasoning
- ✅ Code generation

---

## 🔄 Switching Strategies

### **Strategy 1: Manual Selection**
```typescript
const provider = 'ollama'  // You choose
```

### **Strategy 2: Smart Selection**
```typescript
POST /api/llm/smart-select
{
  "dataSensitivity": "high",  // Auto-selects Ollama
  "taskType": "analysis"      // Auto-selects Anthropic
}
```

### **Strategy 3: Fallback**
```typescript
// Try providers in order
const providers = ['ollama', 'openai', 'anthropic']
for (const provider of providers) {
  try {
    return await generate(provider, request)
  } catch {
    continue  // Try next
  }
}
```

---

## ✅ Summary

**Switching is super easy:**
- ✅ Change one parameter: `"provider": "ollama"` → `"provider": "openai"`
- ✅ Same request format for all providers
- ✅ Smart selection available
- ✅ Fallback support
- ✅ No code changes needed

**Status**: ✅ **Fully Flexible - Switch Anytime!**


