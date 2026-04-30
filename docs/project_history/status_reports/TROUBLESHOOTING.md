# App Launch Troubleshooting Guide

## ✅ Server Status
- **Server is running on port 3000**
- **Process ID**: Check terminal for exact process
- **URL**: http://localhost:3000

## 🔍 Step-by-Step Diagnosis

### 1. Check if Server is Actually Running
Open a new terminal and run:
```powershell
netstat -ano | findstr :3000
```
You should see `LISTENING` status.

### 2. Open the App in Browser
**Manually open your browser** and go to:
```
http://localhost:3000
```

### 3. Check Browser Console for Errors
1. Press `F12` to open Developer Tools
2. Go to the **Console** tab
3. Look for any **red error messages**
4. Share those errors if you see any

### 4. Common Issues & Solutions

#### Issue: Blank White Page
**Solution:**
- Hard refresh: `Ctrl + F5`
- Clear browser cache: `Ctrl + Shift + Delete`
- Try a different browser (Chrome, Firefox, Edge)

#### Issue: "This site can't be reached"
**Solution:**
- Check if server is running: Look at terminal where you ran `npm run dev`
- Restart server: Press `Ctrl+C` then run `npm run dev` again
- Check Windows Firewall settings

#### Issue: Stuck on "Loading..." screen
**Solution:**
- Open browser console (F12) and check for JavaScript errors
- Check Network tab to see if requests are failing
- Try clearing localStorage: In console, run `localStorage.clear()`

#### Issue: Redirect Loop
**Solution:**
- Clear browser cache and localStorage
- Check browser console for redirect errors
- Restart the dev server

### 5. Force Clean Restart

If nothing works, try this:

```powershell
# Stop all Node processes
Stop-Process -Name node -Force -ErrorAction SilentlyContinue

# Delete build cache
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# Reinstall dependencies (if needed)
npm install

# Start fresh
npm run dev
```

### 6. Check Terminal Output

Look at the terminal where you ran `npm run dev`. You should see:
```
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - ready started server on 0.0.0.0:3000
```

If you see **errors** in the terminal, share them.

## 🎯 What Should Happen

1. **Browser opens** → Shows loading spinner
2. **Auto-login** → Logs in as Business Development Manager
3. **Redirect** → Goes to `/dashboard/business-development`
4. **Dashboard loads** → Shows full WMS interface with sidebar

## 📞 Still Not Working?

Share:
1. What you see in the browser (blank page, error message, etc.)
2. Any errors from browser console (F12 → Console)
3. Any errors from terminal where `npm run dev` is running
4. Screenshot if possible



