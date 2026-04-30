# Proposal Generation - Debugging Steps

## If Generate Button Doesn't Work

### Step 1: Check Browser Console (F12)
1. Open browser Developer Tools (F12)
2. Go to "Console" tab
3. Click "Generate Proposal" button
4. Look for any red error messages
5. Share the error message with me

### Step 2: Check Network Tab
1. Open Developer Tools (F12)
2. Go to "Network" tab
3. Click "Generate Proposal"
4. Look for request to `/api/proposals/simple-create`
5. Check:
   - Status code (should be 200)
   - Response body (should have `success: true`)
   - Request payload (should have `title` and `customerName`)

### Step 3: Check Server Terminal
1. Look at the terminal where you're running `npm run dev`
2. Look for logs starting with `[Simple Create]`
3. Check for any error messages

### Step 4: Verify Form Fields
- Make sure "Proposal Title" field has text
- Make sure "Customer" field has text
- Button should be enabled (not grayed out)

### Step 5: Test API Directly
Open browser console and run:
```javascript
fetch('/api/proposals/simple-create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Test Proposal',
    customerName: 'Test Customer',
    proposalType: 'CUSTOM',
    tenantId: 'default',
    userId: 'test-user'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

## Common Issues

### Issue 1: Button is Disabled
**Symptom**: Button is grayed out
**Cause**: Missing title or customer name
**Fix**: Fill in both fields

### Issue 2: "Failed to generate proposal"
**Symptom**: Error message appears
**Cause**: API error or database error
**Fix**: Check server terminal for error details

### Issue 3: Nothing Happens
**Symptom**: Button click does nothing
**Cause**: JavaScript error preventing execution
**Fix**: Check browser console for errors

### Issue 4: "Proposal Not Found" After Generation
**Symptom**: Redirects but shows "not found"
**Cause**: Proposal created but not retrievable
**Fix**: Check database or API endpoint

## What to Share When Reporting Issues

1. **Browser Console Errors**: Copy any red error messages
2. **Network Tab**: Screenshot of the `/api/proposals/simple-create` request
3. **Server Terminal**: Copy error logs
4. **Form Values**: What you entered in Title and Customer fields
5. **Browser**: Which browser you're using (Chrome, Firefox, etc.)

---

*The button should work now. If not, follow these steps and share what you find!*
