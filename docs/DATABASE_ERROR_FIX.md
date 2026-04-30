# 🔧 Fix: "An error occurred during login" - Database Error

## ❌ The Problem

You're seeing this error when trying to login:
```
An error occurred during login. Please try again.
```

## 🔍 Root Cause

The **database is not connected properly**. Looking at your terminal logs:

```
❌ Database query error: error: password authentication failed for user "user"
```

This means:
1. PostgreSQL database credentials are incorrect in `.env.local`
2. OR the database isn't running
3. OR the user "user" doesn't have access

---

## ⚡ QUICK FIX: Use Demo Mode (No Database Required!)

### Option 1: Enable Demo Mode (5 seconds - EASIEST!)

**Step 1**: Open your browser and go to:
```
http://localhost:3002/demo-login
```

**Step 2**: The page will automatically:
- Enable demo mode
- Redirect you to login
- Bypass the database completely

**Step 3**: On the login page, enter **ANY** email and password:
```
Email: admin@demo.com
Password: anything
```

**Step 4**: Click "Sign In" → You'll be logged in! ✅

---

## 🛠️ PERMANENT FIX: Configure Database

If you want to use a real database instead of demo mode:

### Step 1: Check Database Status

**Is PostgreSQL running?**

**Windows (with PostgreSQL installed):**
```powershell
# Check if PostgreSQL service is running
Get-Service -Name postgresql*

# If stopped, start it:
Start-Service -Name postgresql-x64-15  # or your version
```

**Windows (with Docker):**
```powershell
# Start PostgreSQL container
docker run -d `
  --name bluedxp-postgres `
  -e POSTGRES_USER=bluedxp `
  -e POSTGRES_PASSWORD=bluedxp123 `
  -e POSTGRES_DB=bluedxp `
  -p 5432:5432 `
  postgres:15-alpine
```

### Step 2: Update .env.local

Open `.env.local` and find the `DATABASE_URL` line.

**Current (WRONG - causing error):**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/bluedxp"
```

**Fix Option A - If using Docker (from Step 1):**
```env
DATABASE_URL="postgresql://bluedxp:bluedxp123@localhost:5432/bluedxp"
```

**Fix Option B - If using local PostgreSQL:**
```env
# Replace with YOUR PostgreSQL credentials
DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/bluedxp"

# Example:
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bluedxp"
```

### Step 3: Create Database and Tables

```powershell
# Navigate to your project folder
cd C:\Users\balba\hazalyze-asn-module

# Create database tables
npx prisma migrate dev

# Seed initial data (create users, etc.)
npx prisma db seed
```

### Step 4: Restart Server

```powershell
# Stop current server (Ctrl + C)
# Start fresh
npm run dev
```

### Step 5: Test Login

Now try logging in with the seeded user credentials (check your seed file for credentials).

---

## 📋 Comparison: Demo Mode vs Database

| Feature | Demo Mode | Database Mode |
|---------|-----------|---------------|
| **Setup Time** | 5 seconds | 10-15 minutes |
| **Database Required** | ❌ No | ✅ Yes |
| **Data Persistence** | ❌ Lost on refresh* | ✅ Saved permanently |
| **User Management** | ❌ Limited | ✅ Full featured |
| **Best For** | Testing, demos | Production, real use |

*Demo mode saves to browser localStorage, so data persists between sessions but is local to your browser.

---

## 🎯 Step-by-Step: Enable Demo Mode (Detailed)

Since you're new to programming, here's the EXACT steps:

### Step 1: Open Your Browser

1. Open Chrome, Edge, or Firefox
2. Make sure your development server is running (`npm run dev`)

### Step 2: Navigate to Demo Mode Setup

In the address bar, type:
```
http://localhost:3002/demo-login
```

Press Enter.

### Step 3: Wait (1 second)

You'll see:
- A spinning loading icon
- Text: "Enabling Demo Mode..."
- Text: "Redirecting to login..."

### Step 4: Login Page Appears

The page will automatically redirect to the login page.

You'll notice:
- The page looks the same
- But now it says "BlueDXP Platform (Demo)" somewhere

### Step 5: Enter ANY Credentials

**Email:** Type anything, like:
- `test@test.com`
- `admin@demo.com`
- `yourname@example.com`

**Password:** Type anything, like:
- `password`
- `12345`
- `demo`

### Step 6: Click "Sign In"

Click the blue "Sign In" button.

### Step 7: Success!

You should be redirected to the dashboard! ✅

---

## 🔄 Disable Demo Mode

If you want to go back to using the database:

### Option 1: Via Browser Console

1. Press `F12` (opens developer tools)
2. Click "Console" tab
3. Type:
   ```javascript
   localStorage.removeItem('demo-mode')
   ```
4. Press Enter
5. Refresh the page (`F5`)

### Option 2: Visit Disable URL

Go to this URL:
```
http://localhost:3002/disable-demo
```

(We'll create this page in a moment)

---

## 🆘 Troubleshooting

### Issue: Demo mode not working

**Solution:**
1. Make sure you visited `/demo-login` URL
2. Check browser console (F12) for errors
3. Try clearing browser cache (`Ctrl + Shift + Delete`)
4. Hard refresh (`Ctrl + Shift + R`)

### Issue: Still getting "An error occurred during login"

**Solution:**
1. Open browser console (F12)
2. Check for error messages
3. Make sure `/demo-login` page loaded successfully
4. Try again: `http://localhost:3002/demo-login`

### Issue: How do I know if demo mode is enabled?

**Solution:**
1. Press `F12` (developer tools)
2. Go to "Console" tab
3. Type: `localStorage.getItem('demo-mode')`
4. Press Enter
5. Should show: `"true"` if enabled

---

## ✅ Summary

**Quick Fix (Demo Mode):**
1. Go to: `http://localhost:3002/demo-login`
2. Login with any email/password
3. ✅ Done!

**Permanent Fix (Database):**
1. Start PostgreSQL (locally or Docker)
2. Update `DATABASE_URL` in `.env.local`
3. Run: `npx prisma migrate dev`
4. Restart server: `npm run dev`
5. Login with real credentials

---

**Choose Demo Mode for now if you just want to test the platform!**

The database can be set up later when you're ready for production use.

---

**BlueDXP Platform** - Enterprise Intelligence Operating System
