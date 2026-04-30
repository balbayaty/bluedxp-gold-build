# How to Fix HazalyzeCopilot "Demo Mode"

## Problem
HazalyzeCopilot is showing a demo mode message because it can't find a valid API key in your environment variables.

## Solution (Easy Steps)

### Option 1: Automatic Setup (Recommended - Easiest!)

1. **Open PowerShell in the project root folder** (Right-click on the `hazalyze-asn-module` folder → "Open in Terminal")

2. **Run the setup script:**
   ```powershell
   .\SETUP_API_KEY.ps1
   ```

3. **Follow the prompts** - the script will guide you step-by-step!

---

### Option 2: Manual Setup

#### Step 1: Get an API Key

**For OpenAI (Recommended for beginners):**
1. Go to: https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key (starts with `sk-proj-` or `sk-`)

**OR**

**For Anthropic (Alternative):**
1. Go to: https://console.anthropic.com/
2. Sign up or log in
3. Go to "API Keys"
4. Click "Create Key"
5. Copy the key (starts with `sk-ant-`)

#### Step 2: Add the Key to .env.local

1. **Open the file:** `.env.local` (in the project root folder - `c:\Users\balba\hazalyze-asn-module\.env.local`)

2. **Find these lines:**
   ```
   # OpenAI
   OPENAI_API_KEY=

   # Anthropic
   ANTHROPIC_API_KEY=
   ```

3. **Paste your key after the `=` sign:**
   
   For OpenAI:
   ```
   OPENAI_API_KEY=sk-proj-your-actual-key-here
   ```
   
   OR for Anthropic:
   ```
   ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
   ```

4. **Save the file** (Ctrl+S)

#### Step 3: Restart the Development Server

1. Find the terminal running `npm run dev`
2. Press `Ctrl+C` to stop it
3. Wait for it to stop
4. Run `npm run dev` again
5. Press Enter

---

## That's It!

Once you restart the server, HazalyzeCopilot should work with full AI capabilities! 🎉

---

## Troubleshooting

### "It still shows demo mode!"

1. Make sure you **saved** the `.env.local` file
2. Make sure you **restarted** the dev server (Ctrl+C then `npm run dev` again)
3. Make sure your API key doesn't have quotes around it (just paste the key directly)
4. Make sure there are no spaces before or after the key
5. Make sure the key starts with `sk-proj-` or `sk-` (for OpenAI) or `sk-ant-` (for Anthropic)

### "I don't know where to get an API key"

- **OpenAI is recommended** - it's easier for beginners
- Go to https://platform.openai.com/api-keys
- You'll need to create an account (it's free to sign up)
- You may need to add payment information, but OpenAI gives free credits to start

### "I need help!"

Run the automatic setup script - it will guide you:
```powershell
.\SETUP_API_KEY.ps1
```

---

## Important Security Notes

- ⚠️ **NEVER share your API key publicly**
- ⚠️ **NEVER commit `.env.local` to Git** (it's already ignored)
- ⚠️ Keep your API key secret - treat it like a password

---

## What the Copilot Can Do Once Setup

Once you have a valid API key, HazalyzeCopilot can:

- ✅ Analyze your data in real-time
- ✅ Provide intelligent recommendations
- ✅ Automate workflows
- ✅ Generate insights and reports
- ✅ Answer questions about your warehouse, shipments, compliance, etc.
- ✅ Help you navigate the platform
- ✅ Execute actions on your behalf

**Full AI power unlocked!** 🚀

---

## Technical Details (For Reference)

The copilot checks for API keys in this order:
1. `OPENAI_API_KEY` (server-side)
2. `ANTHROPIC_API_KEY` (server-side)
3. `NEXT_PUBLIC_OPENAI_API_KEY` (client-side - not recommended)
4. `NEXT_PUBLIC_ANTHROPIC_API_KEY` (client-side - not recommended)

The server-side keys are more secure and are recommended.

The copilot validates that:
- The key exists
- The key is longer than 20 characters
- The key starts with the correct prefix
- The key is not a placeholder (like "sk-your-key-here")

If no valid key is found, the copilot falls back to demo mode with limited functionality.
