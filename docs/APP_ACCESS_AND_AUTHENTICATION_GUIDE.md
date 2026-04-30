# 🔐 App Access & Authentication Guide

## 📋 **Quick Answer to Your Questions**

### **Q: Do I need to login for full access and testing?**
**A:** In **development mode**, you can access the app without logging in, but you'll have **limited functionality**. For **full access and proper testing**, you should log in.

### **Q: Is it correct that I can access localhost:3002 without logging in?**
**A:** **Yes, this is correct for development mode.** The app is designed to allow access without authentication in development to make testing easier. However, this means:
- You're using a **mock authentication context**
- Some features may not work correctly
- Data may not persist properly
- You won't have full user permissions

### **Q: Do I have access?**
**A:** You have **partial access** without login. For **full access**, you need to log in.

### **Q: Am I connected to the database?**
**A:** Check the diagnostics page at `/diagnostics` to see your database connection status.

---

## 🔍 **Understanding Your Current Situation**

### **Development Mode Behavior**

When you access `localhost:3002` without logging in, here's what happens:

1. **Frontend (UI):**
   - The `Layout` component checks if you're logged in
   - If not logged in, it shows a "Login required" message
   - However, in development, the app may still render some pages

2. **Backend (API):**
   - The `apiAuthMiddleware` creates a **mock authentication context** in development
   - This mock context gives you:
     - User ID: `dev-user`
     - Tenant ID: `tenant-1` (or from `BOOTSTRAP_TENANT_ID` env var)
     - Role: `SYSTEM_ADMIN`
     - Permissions: `['*']` (all permissions)

3. **Database:**
   - The app can run **with or without** a database connection in development
   - If no database is connected, services use **in-memory fallbacks**
   - Data stored in memory will be **lost when you restart the app**

---

## ✅ **How to Check Your App Status**

### **Step 1: Visit the Diagnostics Page**

Open your browser and go to:
```
http://localhost:3002/diagnostics
```

This page will show you:
- ✅ Authentication status
- ✅ Database connection status
- ✅ System health
- ✅ Environment mode
- ✅ Auth context status

### **Step 2: Check Health Endpoints**

You can also check these API endpoints:

1. **Basic Health Check:**
   ```
   http://localhost:3002/api/health
   ```

2. **System Health (Detailed):**
   ```
   http://localhost:3002/api/system/health
   ```

---

## 🔐 **How to Log In for Full Access**

### **Step 1: Create an Admin User (First Time Only)**

If you haven't created a user yet, run:

```powershell
npm run setup:auth
```

This creates an admin user:
- **Email:** `admin@hazalyze.com`
- **Password:** `Admin@1234`

**⚠️ Important:** Change this password immediately after first login!

### **Step 2: Log In**

1. Go to: `http://localhost:3002/login`
2. Enter your email and password
3. Click "Sign In"

### **Step 3: Verify You're Logged In**

After logging in:
- You should see your email/name in the UI
- The diagnostics page will show "Authentication: OK"
- You'll have full access to all features

---

## 🗄️ **Database Connection Status**

### **Check if Database is Connected**

The app can work in two modes:

#### **Mode 1: With Database (Recommended)**
- ✅ Data persists across app restarts
- ✅ Full functionality
- ✅ Proper user management
- ✅ Real authentication

**To use this mode:**
1. Set `DATABASE_URL` in your `.env.local` file:
   ```env
   DATABASE_URL=postgresql://bluedxp:password@localhost:5432/bluedxp
   ```

2. Run migrations:
   ```powershell
   npm run prisma:migrate
   ```

3. Restart your app

#### **Mode 2: Without Database (Development Only)**
- ⚠️ Data is stored in memory
- ⚠️ Data is lost when you restart the app
- ⚠️ Limited functionality
- ⚠️ Mock authentication only

**This is OK for quick testing, but not for real development.**

---

## 🎯 **What You Should Do**

### **For Full Testing and Development:**

1. **✅ Set up Database Connection**
   - Configure `DATABASE_URL` in `.env.local`
   - Run `npm run prisma:migrate`
   - Restart your app

2. **✅ Log In**
   - Create admin user: `npm run setup:auth`
   - Go to `/login`
   - Log in with credentials

3. **✅ Verify Everything Works**
   - Visit `/diagnostics` to check all systems
   - All items should show "OK" (green)

### **For Quick Testing (Current Setup):**

If you just want to quickly test the UI:
- ✅ You can continue using the app without login
- ⚠️ Remember: Data won't persist
- ⚠️ Some features may not work correctly
- ⚠️ This is **not recommended** for real development

---

## 📊 **Understanding the Status Indicators**

When you visit `/diagnostics`, you'll see:

| Status | Color | Meaning |
|--------|-------|---------|
| ✅ **OK** | Green | Component is working correctly |
| ⚠️ **Warning** | Yellow | Working but not optimal (OK for dev) |
| ❌ **Error** | Red | Problem that needs attention |

---

## 🔧 **Troubleshooting**

### **Problem: Can't Access App**
- **Solution:** Make sure the dev server is running: `npm run dev`

### **Problem: Database Not Connected**
- **Check:** Visit `/diagnostics` to see database status
- **Solution:** Set `DATABASE_URL` in `.env.local` and restart app

### **Problem: Can't Log In**
- **Check:** Make sure you've created a user: `npm run setup:auth`
- **Check:** Verify database is connected (login requires database)

### **Problem: Data Disappears After Restart**
- **Cause:** Database not connected, using in-memory storage
- **Solution:** Set up database connection (see above)

---

## 📝 **Summary**

| Question | Answer |
|----------|--------|
| **Do I need to login?** | For full access: **Yes**. For quick testing: No (but limited) |
| **Is it correct to access without login?** | **Yes**, in development mode |
| **Do I have access?** | **Partial access** without login, **full access** with login |
| **Is database connected?** | Check `/diagnostics` page |
| **Is app running correctly?** | Check `/diagnostics` page for full status |

---

## 🚀 **Next Steps**

1. **Visit `/diagnostics`** to see your current status
2. **Set up database** if you want persistent data
3. **Log in** for full access and proper testing
4. **Check `/api/health`** for system status

---

**Need Help?** Check the diagnostics page at `/diagnostics` for real-time status of all components!




