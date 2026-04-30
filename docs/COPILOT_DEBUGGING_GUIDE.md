# 🔍 HazalyzeCopilot Debugging Guide

## Common Issues & Solutions

### Issue 1: "I'm having trouble connecting right now"

**Possible Causes:**
1. Missing API key in `.env.local`
2. Invalid API key format
3. Network connectivity issues
4. Zero-trust middleware blocking request

**Solutions:**
1. Check `.env.local` has:
   ```
   OPENAI_API_KEY=sk-... (valid key, not placeholder)
   # OR
   ANTHROPIC_API_KEY=sk-ant-... (valid key, not placeholder)
   ```
2. Verify API key is valid (starts with `sk-` for OpenAI or `sk-ant-` for Anthropic)
3. Check browser console for detailed error messages
4. Check server logs for API errors

### Issue 2: "Request verification failed"

**Cause:** Zero-trust security middleware is blocking the request

**Solutions:**
1. Check if `ZERO_TRUST_ENABLED=false` in `.env.local` (for development)
2. Verify authentication is working
3. Check browser console for detailed error
4. Refresh the page

### Issue 3: "No valid API key found"

**Cause:** API key is missing, invalid format, or is a placeholder

**Solutions:**
1. Add to `.env.local`:
   ```
   OPENAI_API_KEY=sk-your-actual-key-here
   ```
2. Restart the development server after adding key
3. Verify key is not a placeholder like `sk-your-key-here`
4. Check key length (should be >20 characters)

### Issue 4: Messages not sending

**Possible Causes:**
1. Network error
2. API route error
3. Authentication failure
4. Rate limiting

**Debug Steps:**
1. Open browser console (F12)
2. Look for `[Copilot]` error messages
3. Check Network tab for failed requests
4. Check response status codes:
   - 401 = Authentication failed
   - 403 = Permission denied
   - 429 = Rate limited
   - 500 = Server error

### Issue 5: Command/Create buttons not working

**Fixed:** Buttons now have proper event handling with `stopPropagation()`

**If still not working:**
1. Check browser console for errors
2. Verify mode state is updating
3. Check if buttons are being blocked by drag handler

### Issue 6: Scrolling not working

**Fixed:** Added proper scroll container with `overflow-y-auto` and `scroll-smooth`

**If still not working:**
1. Check if messages container has proper height
2. Verify `flex-1` is applied to messages container
3. Check for CSS conflicts

## Debugging Checklist

- [ ] Check `.env.local` has valid API key
- [ ] Restart dev server after changing `.env.local`
- [ ] Check browser console for errors
- [ ] Check Network tab for failed requests
- [ ] Verify authentication is working
- [ ] Check server logs for errors
- [ ] Verify tenantId and userId are set
- [ ] Check API route is accessible
- [ ] Verify zero-trust middleware isn't blocking

## Console Commands for Debugging

```javascript
// Check if copilot widget is mounted
document.querySelector('[data-copilot-widget]')

// Check localStorage for saved state
localStorage.getItem('copilot-widget-state-main-copilot')

// Check if API key is accessible (server-side only)
// Check server logs for: [Copilot] AI call failed
```

## Testing the API Directly

```bash
# Test copilot API endpoint
curl -X POST http://localhost:3000/api/copilot/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{
    "message": "Hello",
    "context": {},
    "options": {
      "useRAG": true,
      "useMemory": true,
      "useTools": true
    }
  }'
```

## Common Error Messages

| Error Message | Cause | Solution |
|--------------|-------|----------|
| "No valid API key found" | Missing/invalid API key | Add valid key to `.env.local` |
| "Request verification failed" | Zero-trust blocking | Check auth, disable for dev |
| "Authentication required" | Not logged in | Login first |
| "Rate limit exceeded" | Too many requests | Wait and retry |
| "Failed to fetch" | Network error | Check connection |
| "Internal Server Error" | Server error | Check server logs |

## Getting Help

1. Check browser console for `[Copilot]` logs
2. Check server logs for detailed errors
3. Verify all environment variables are set
4. Test API endpoint directly
5. Check authentication status


