# ✅ Complete Setup Checklist - Step by Step

**Follow this checklist in order - Don't skip steps!**

---

## 📋 **PHASE 1: DOCKER DESKTOP INSTALLATION**

### **Step 1: Download Docker Desktop** ✅
- [ ] Go to: https://www.docker.com/products/docker-desktop/
- [ ] Click: **"Download for Windows – AMD64"** (the one with Windows logo)
- [ ] Wait for download to complete (~500 MB, 2-5 minutes)
- [ ] File saved to: `C:\Users\balba\Downloads\Docker Desktop Installer.exe`

### **Step 2: Install Docker Desktop** ✅
- [ ] Find the downloaded file in Downloads folder
- [ ] Double-click `Docker Desktop Installer.exe`
- [ ] Click "Yes" if Windows asks for permission
- [ ] ✅ Check "Use WSL 2 instead of Hyper-V" (recommended)
- [ ] ✅ Check "Add shortcut to desktop" (optional)
- [ ] Click "OK" and wait for installation (5-10 minutes)
- [ ] When done, click "Close and restart" (if asked)
- [ ] **RESTART YOUR COMPUTER** (if installation asked you to)

### **Step 3: Start Docker Desktop** ✅
- [ ] After restart, open Docker Desktop (from Start menu or desktop icon)
- [ ] Wait for "Docker Desktop is starting..." (1-2 minutes)
- [ ] Status changes to "Running" (green) ✅
- [ ] Accept terms if asked

### **Step 4: Verify Docker Works** ✅
- [ ] Open PowerShell (new window)
- [ ] Type: `docker --version`
- [ ] Should show: `Docker version 24.x.x` or similar ✅
- [ ] Type: `docker ps`
- [ ] Should show list (might be empty, that's OK) ✅

**✅ Docker is ready when all above are checked!**

---

## 📋 **PHASE 2: DATABASE SETUP**

### **Step 5: Run Database Setup Script** ✅
- [ ] Open PowerShell in project folder:
  ```powershell
  cd C:\Users\balba\hazalyze-asn-module
  ```
- [ ] Run setup script:
  ```powershell
  powershell -ExecutionPolicy Bypass -File scripts/setup-database.ps1
  ```
- [ ] Wait for script to complete (5-10 minutes)
- [ ] Should see: "✅ DATABASE SETUP COMPLETE!"

**If script fails, follow manual steps below:**

---

### **Step 6: Manual Database Setup (If Script Fails)**

#### **6.1 Start Database Containers:**
- [ ] Open PowerShell in project folder
- [ ] Run: `docker-compose up -d postgres redis`
- [ ] Wait 15 seconds
- [ ] Verify: `docker ps` shows `bluedxp-postgres` and `bluedxp-redis`

#### **6.2 Verify .env.local:**
- [ ] Check file exists: `C:\Users\balba\hazalyze-asn-module\.env.local`
- [ ] Should contain: `DATABASE_URL="postgresql://bluedxp:change_me_in_production@localhost:5432/bluedxp?schema=public"`

#### **6.3 Generate Prisma Client:**
- [ ] Make sure app is NOT running (close all `npm run dev` terminals)
- [ ] Run: `npm run prisma:generate`
- [ ] Should see: `✔ Generated Prisma Client`

#### **6.4 Run Migrations:**
- [ ] Run: `npm run prisma:migrate`
- [ ] When asked for migration name, type: `init`
- [ ] When asked to apply, type: `y`
- [ ] Should see: `✔ Migration applied successfully`

#### **6.5 Install pgvector Extension:**
- [ ] Run: `docker exec bluedxp-postgres psql -U bluedxp -d bluedxp -c "CREATE EXTENSION IF NOT EXISTS vector;"`
- [ ] Should see: `CREATE EXTENSION`

---

## 📋 **PHASE 3: VERIFICATION**

### **Step 7: Test Database Connection** ✅
- [ ] Start app: `npm run dev`
- [ ] Wait for: `✓ Ready in 10.5s`
- [ ] Open browser: `http://localhost:3002/api/health`
- [ ] Should show: `{"status":"healthy","database":"connected"}` ✅

### **Step 8: Test Knowledge Base** ✅
- [ ] Go to: `http://localhost:3002/knowledge-base`
- [ ] Create a test entry:
  - Title: "Test Entry"
  - Content: "This is a test to verify database persistence"
  - Category: Any category
- [ ] Click "Save"
- [ ] Verify entry appears in list ✅

### **Step 9: Test Persistence** ✅
- [ ] Stop app: Press `Ctrl + C` in terminal
- [ ] Wait 5 seconds
- [ ] Start app again: `npm run dev`
- [ ] Go back to: `http://localhost:3002/knowledge-base`
- [ ] **Verify:** Your test entry is still there! ✅

### **Step 10: Test RAG Search** ✅
- [ ] In Knowledge Base page, use search box
- [ ] Search for: "test"
- [ ] Your entry should appear in results ✅

---

## ✅ **SUCCESS CRITERIA**

**You're done when:**
- ✅ Docker Desktop is running (green icon)
- ✅ `docker ps` shows `bluedxp-postgres` and `bluedxp-redis`
- ✅ `npm run dev` starts without errors
- ✅ `http://localhost:3002/api/health` shows database connected
- ✅ Knowledge Base entries persist after restart
- ✅ RAG search works

---

## 🎉 **AFTER SETUP IS COMPLETE**

Once everything is verified:

1. ✅ **Data persists** - Won't disappear on restart
2. ✅ **RAG works** - Vector search enabled
3. ✅ **Knowledge Base saves** - To database
4. ✅ **Ready for production** - All services can connect

**Then continue building your business logic!**

---

## 🐛 **IF SOMETHING GOES WRONG**

### **Docker Issues:**
- See: `docs/DOCKER_INSTALLATION_GUIDE.md`

### **Database Issues:**
- See: `docs/DATABASE_SETUP_INSTRUCTIONS.md`

### **General Issues:**
- Check logs in terminal
- Check Docker Desktop logs
- Restart Docker Desktop
- Restart computer if needed

---

**Status:** ⏳ **Waiting for Docker Desktop Installation**













