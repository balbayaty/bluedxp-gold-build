# Troubleshooting Blank White Page

## Quick Fixes to Try:

### 1. **Check Browser Console**
Open your browser's Developer Tools (F12) and check the Console tab for any red errors.

### 2. **Check Network Tab**
In Developer Tools, check the Network tab to see if files are loading.

### 3. **Try Direct URLs**
Instead of going to `/`, try these direct URLs:
- http://localhost:3002/ultimate
- http://localhost:3002/iso-ims
- http://localhost:3002/iot

### 4. **Clear Browser Cache**
- Press Ctrl+Shift+Delete
- Clear cached images and files
- Refresh the page

### 5. **Check if Server is Running**
Look at your terminal/command prompt where you ran `npm run dev`. You should see:
- "Ready" message
- "Local: http://localhost:3002"
- No red error messages

### 6. **Restart Dev Server**
1. Stop the server (Ctrl+C in the terminal)
2. Delete `.next` folder: `Remove-Item -Recurse -Force .next`
3. Restart: `npm run dev`

### 7. **Check for Import Errors**
The blank page might be caused by:
- Import errors in new files
- Missing dependencies
- TypeScript compilation errors

## Most Likely Causes:

1. **JavaScript Error** - Check browser console (F12)
2. **Server Not Running** - Check terminal output
3. **Compilation Error** - Check terminal for build errors
4. **Redirect Loop** - Check if page keeps redirecting

## Quick Test:

Open browser console (F12) and type:
```javascript
window.location.href
```

This will show you the current URL. If it's different from what you expect, there might be a redirect issue.











