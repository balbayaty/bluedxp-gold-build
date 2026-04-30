# 🚀 Ollama Quick Start Guide

## ✅ Installation Complete!

Ollama has been installed successfully. Now let's complete the setup.

---

## 🔧 Step 1: Restart Your Terminal

**IMPORTANT**: Ollama was just installed, so you need to restart your terminal for PATH to update.

1. **Close this terminal/PowerShell window**
2. **Open a new terminal/PowerShell window**
3. **Navigate back to your project**: `cd C:\Users\balba\hazalyze-asn-module`

---

## 🚀 Step 2: Start Ollama Service

In your **new terminal**, run:

```powershell
ollama serve
```

This will start Ollama in the background. **Keep this terminal open**.

You should see:
```
2024/01/01 12:00:00 routes.go:1008: INFO server config env="map[OLLAMA_HOST:0.0.0.0:11434]"
2024/01/01 12:00:00 routes.go:1011: INFO starting server...
```

---

## 📥 Step 3: Download Models (In a NEW Terminal)

Open **another new terminal** and run:

```powershell
# Download base models (this will take a few minutes)
ollama pull llama2

# Optional: Download a smaller, faster model
ollama pull mistral

# Verify models are downloaded
ollama list
```

You should see output like:
```
NAME            ID              SIZE    MODIFIED
llama2:latest   1234567890      3.8GB   2 hours ago
mistral:latest  0987654321      4.1GB   1 hour ago
```

---

## 🧪 Step 4: Test Ollama

Test that Ollama is working:

```powershell
ollama run llama2 "Hello, this is a test."
```

You should get a response from the model.

---

## 🎯 Step 5: Start BlueDXP and Test Integration

### Start Your App

```powershell
npm run dev
```

### Check Console Logs

When the app starts, you should see:
```
✅ Ollama provider registered (local LLM support)
✅ LLM Provider Registry initialized: 3 providers registered
```

### Test via API

Once your app is running on `http://localhost:3002`, test the Ollama provider:

**Option 1: Using curl (PowerShell)**
```powershell
$body = @{
    provider = "ollama"
    model = "llama2"
    messages = @(
        @{
            role = "user"
            content = "Hello! Say hi back."
        }
    )
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3002/api/llm/generate" -Method POST -Body $body -ContentType "application/json"
```

**Option 2: Using Postman/Insomnia**
```
POST http://localhost:3002/api/llm/generate
Content-Type: application/json

{
  "provider": "ollama",
  "model": "llama2",
  "messages": [
    {"role": "user", "content": "Hello! Say hi back."}
  ]
}
```

**Option 3: List All Providers**
```
GET http://localhost:3002/api/llm/providers
```

---

## ✅ Verification Checklist

- [ ] Terminal restarted (new session)
- [ ] Ollama service running (`ollama serve`)
- [ ] Models downloaded (`ollama pull llama2`)
- [ ] Model test successful (`ollama run llama2 "test"`)
- [ ] BlueDXP app started (`npm run dev`)
- [ ] Ollama provider registered (check console logs)
- [ ] API test successful

---

## 🐛 Troubleshooting

### "ollama: command not found"

**Solution**: Restart your terminal. The PATH hasn't updated yet.

### "Ollama is not responding"

**Solution**: 
1. Make sure Ollama is running: `ollama serve`
2. Check if port 11434 is available
3. Try: `curl http://localhost:11434/api/tags`

### "Model not found"

**Solution**: Download the model first:
```powershell
ollama pull llama2
```

### "Provider not registered"

**Solution**: 
1. Check console logs when app starts
2. Verify file exists: `lib/services/llm-provider/providers/ollama/index.ts`
3. Restart the app

---

## 📚 Next Steps

Once everything is working:

1. **Use Ollama in your app** - It's now available as a provider
2. **Train custom models** - See `docs/LOCAL_LLM_INTEGRATION_GUIDE.md`
3. **Deploy to Saudi Arabia** - See `docs/SAUDI_LOCAL_LLM_DEPLOYMENT_GUIDE.md`

---

## 🎉 You're All Set!

Ollama is installed and ready to use. Just restart your terminal and follow the steps above!

**Status**: ✅ **Installation Complete - Ready for Setup**


