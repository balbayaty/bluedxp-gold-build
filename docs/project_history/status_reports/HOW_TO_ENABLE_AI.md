# 🚀 How to Enable Real AI Extraction

## ⚠️ **Current Status**

**The MSDS module IS connected to the AI service**, but it's likely using the **Mock Provider** because no API keys are configured.

This is why you're seeing:
- "Unknown Chemical" for all submissions
- Generic data instead of real extraction
- CAS numbers not being extracted

## ✅ **Solution: Add API Keys**

### **Step 1: Create `.env.local` File**

Create a file named `.env.local` in your project root (same directory as `package.json`):

```env
# OpenAI (Option 1)
OPENAI_API_KEY=sk-***REDACTED***

# OR Anthropic (Option 2)
ANTHROPIC_API_KEY=sk-***REDACTED***
```

### **Step 2: Get API Keys**

#### **OpenAI**:
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy the key (starts with `sk-`)
4. Add to `.env.local`

#### **Anthropic**:
1. Go to https://console.anthropic.com/
2. Create a new API key
3. Copy the key (starts with `sk-ant-`)
4. Add to `.env.local`

### **Step 3: Restart Dev Server**

After adding the API key:
```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### **Step 4: Verify Connection**

1. **Check Browser Console** - Look for:
   - `[ai-service] ✅ Using AI provider: OpenAI` (or Anthropic)
   - NOT `[ai-service] ⚠️ Using fallback: Mock AI Provider`

2. **Upload a Test MSDS** - Should see:
   - Real chemical names extracted
   - CAS numbers extracted
   - Actual data instead of "Unknown Chemical"

## 🔍 **How to Check Current Status**

### **Browser Console Logs**:
Look for these messages when uploading:
- `[ai-service] Using AI provider: OpenAI` ← ✅ Real AI
- `[ai-service] Using fallback: Mock AI Provider` ← ⚠️ No API keys

### **Server Logs**:
Check terminal for:
- `[sds-parser] AI Provider: OpenAI` ← ✅ Real AI
- `[sds-parser] AI Provider: Mock AI Provider` ← ⚠️ No API keys

## 📊 **What Happens With Each Provider**

### **With Real AI (OpenAI/Anthropic)**:
- ✅ Real chemical name extraction
- ✅ CAS number extraction by AI
- ✅ Manufacturer extraction
- ✅ All fields extracted accurately
- ✅ High confidence scores

### **With Mock Provider (No API Keys)**:
- ⚠️ Generic "Unknown Chemical"
- ⚠️ No CAS extraction by AI
- ⚠️ Generic manufacturer
- ✅ Regex fallback still works for CAS
- ⚠️ Low confidence scores

## 🎯 **Quick Test**

1. **Check if keys are set**:
   ```bash
   # In terminal
   echo $OPENAI_API_KEY
   # Should show your key (or nothing if not set)
   ```

2. **Upload a test MSDS** and check console:
   - Look for `[ai-service]` logs
   - See which provider is being used
   - Check if CAS is extracted

3. **If using Mock**:
   - Add API key to `.env.local`
   - Restart server
   - Try again

---

**The module IS connected - it just needs API keys to use real AI!**











