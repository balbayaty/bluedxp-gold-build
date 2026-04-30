# HazalyzeCopilot Troubleshooting Guide

## Why Can't I See the Improvements?

If you're not seeing the enhanced features (reasoning steps, proactive insights, etc.), follow these steps:

### 1. Check Server Logs

Look for these log messages in your terminal/console:
- `[Enhanced Copilot] Processing message:` - Confirms enhanced service is being called
- `[Enhanced Copilot] Successfully processed message:` - Shows what features were generated
- `[Copilot API] Enhanced service failed, falling back to regular service:` - Means enhanced service failed

### 2. Hard Refresh Browser

**Critical:** The browser may be caching old JavaScript code.

**Windows/Linux:**
- Press `Ctrl + Shift + R` or `Ctrl + F5`
- Or open DevTools (F12) → Right-click refresh button → "Empty Cache and Hard Reload"

**Mac:**
- Press `Cmd + Shift + R`

### 3. Clear Next.js Cache

The `.next` folder contains compiled code. If it's stale, you won't see changes:

```bash
# Delete .next folder
rm -rf .next
# Or on Windows PowerShell:
Remove-Item -Recurse -Force .next
```

Then restart your dev server:
```bash
npm run dev
```

### 4. Check API Route

Verify the API route is using the enhanced service:

**File:** `app/api/copilot/chat/route.ts`

Should contain:
```typescript
import { enhancedCopilotService } from '@/lib/services/copilot/enhancedCopilotService'
// ...
const response = await enhancedCopilotService.processMessage(...)
```

### 5. Check Browser Console

Open browser DevTools (F12) → Console tab

Look for:
- **Errors** (red) - These will tell you what's failing
- **Warnings** (yellow) - May indicate issues
- Network tab → Check `/api/copilot/chat` requests → See the response

### 6. Verify Enhanced Service File Exists

Check that this file exists:
```
lib/services/copilot/enhancedCopilotService.ts
```

### 7. Check Type Definitions

The `CopilotMessage` interface should include enhanced metadata:

**File:** `lib/services/copilot/copilotService.ts`

Should have:
```typescript
metadata?: {
  // ... existing fields ...
  proactiveInsights?: Array<{...}>
  suggestedOptimizations?: Array<{...}>
  reasoning?: Array<{...}>
  confidenceBreakdown?: {...}
}
```

### 8. Test with a Simple Query

Try asking the copilot:
```
"Create a draft proposal for test services"
```

**Expected behavior:**
1. Should show reasoning steps (click "🧠 Show Reasoning")
2. Should show confidence breakdown
3. Should show tool execution (if tools were used)
4. May show proactive insights

### 9. Check Server-Side Logs

In your terminal where `npm run dev` is running, look for:
- `[Enhanced Copilot] Processing message:` - Service is being called
- `[Enhanced Copilot] Successfully processed message:` - Service completed
- Any error messages starting with `[Enhanced Copilot]`

### 10. Fallback Behavior

If the enhanced service fails, it should automatically fall back to the regular service. Check logs for:
```
[Copilot API] Enhanced service failed, falling back to regular service
```

This means the enhanced service had an error, but the regular service should still work.

## Common Issues

### Issue: "data.reasoning.steps is not a function"

**Cause:** Browser cache with old code

**Fix:**
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear `.next` folder
3. Restart dev server

### Issue: No reasoning steps shown

**Possible causes:**
1. Enhanced service not being called (check logs)
2. Enhanced service failing silently (check logs)
3. UI not rendering the metadata (check browser console)

**Fix:**
1. Check server logs for `[Enhanced Copilot]` messages
2. Check browser console for errors
3. Verify metadata is in the response (Network tab → Response)

### Issue: Enhanced service always fails

**Possible causes:**
1. Missing API keys
2. TypeScript compilation errors
3. Import errors

**Fix:**
1. Check terminal for TypeScript errors
2. Verify API keys are set in `.env.local`
3. Check that all imports resolve correctly

## Debug Mode

To enable more detailed logging, the enhanced service now logs:
- When it starts processing
- What features it generated
- Any errors that occur

Check your server terminal for these logs.

## Still Not Working?

1. **Check the Network Tab:**
   - Open DevTools → Network
   - Send a message to copilot
   - Find the `/api/copilot/chat` request
   - Click it → Response tab
   - Check if `reasoning`, `proactiveInsights`, etc. are in the response

2. **Check the Console:**
   - Look for JavaScript errors
   - Look for React errors
   - Check if components are rendering

3. **Verify Files:**
   - Make sure `enhancedCopilotService.ts` exists
   - Make sure API route imports it
   - Make sure widget component exists

4. **Restart Everything:**
   - Stop dev server (Ctrl+C)
   - Clear `.next` folder
   - Clear browser cache
   - Restart dev server
   - Hard refresh browser

## Expected Response Structure

When enhanced service works, the API response should include:

```json
{
  "message": {
    "content": "...",
    "metadata": {
      "reasoning": [...],
      "confidenceBreakdown": {...},
      "proactiveInsights": [...],
      "suggestedOptimizations": [...]
    }
  },
  "reasoning": {
    "steps": [...],
    "confidenceBreakdown": {...},
    "decisionPath": [...]
  },
  "proactiveInsights": [...],
  "suggestedOptimizations": [...]
}
```

If you see this structure in the Network tab but not in the UI, it's a rendering issue.
If you don't see this structure, the enhanced service isn't working.
