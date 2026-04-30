# 🗄️ Database Setup - Manual Instructions

**Status:** Docker needs to be started manually

---

## ⚠️ **CURRENT STATUS**

- ✅ `.env.local` file exists and is configured
- ✅ Prisma schema is ready
- ❌ Docker Desktop is not running or not in PATH
- ❌ Database containers not started

---

## 🚀 **STEP-BY-STEP SETUP**

### **STEP 1: Start Docker Desktop**

1. **Open Docker Desktop**
   - Look for Docker Desktop icon in your system tray (bottom right)
   - Or search "Docker Desktop" in Start menu
   - Click to open

2. **Wait for Docker to Start**
   - Docker Desktop will show "Starting..." 
   - Wait until it says "Running" (green)
   - This takes 1-2 minutes

3. **Verify Docker is Running**
   - Open PowerShell
   - Type: `docker --version`
   - Should show: `Docker version 24.x.x` or similar

**If Docker is not installed:**
- Download from: https://www.docker.com/products/docker-desktop/
- Install it
- Restart your computer
- Then come back to Step 1

---

### **STEP 2: Start Database Containers**

**Open PowerShell in your project folder:**
```powershell
cd C:\Users\balba\hazalyze-asn-module
```

**Start PostgreSQL and Redis:**
```powershell
docker-compose up -d postgres redis
```

**Wait 15 seconds, then verify:**
```powershell
docker ps
```

**You should see:**
- `bluedxp-postgres` (Status: Up)
- `bluedxp-redis` (Status: Up)

---

### **STEP 3: Verify .env.local**

**Check your `.env.local` file has:**
```env
DATABASE_URL="postgresql://bluedxp:change_me_in_production@localhost:5432/bluedxp?schema=public"
```

**If missing, add it to `.env.local`**

---

### **STEP 4: Generate Prisma Client**

**Make sure your app is NOT running** (close any `npm run dev` terminals)

**Then run:**
```powershell
npm run prisma:generate
```

**Expected output:**
```
✔ Generated Prisma Client
```

**If you get file lock error:**
- Close all terminals running `npm run dev`
- Close VS Code/Cursor if it's using Prisma
- Try again

---

### **STEP 5: Run Database Migrations**

```powershell
npm run prisma:migrate
```

**If it asks:**
- "Enter a name for the new migration:" → Type: `init` and press Enter
- "Apply this migration?" → Type: `y` and press Enter

**Expected output:**
```
✔ Migration applied successfully
```

---

### **STEP 6: Install pgvector Extension**

```powershell
docker exec bluedxp-postgres psql -U bluedxp -d bluedxp -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

**Expected output:**
```
CREATE EXTENSION
```

---

### **STEP 7: Verify Everything Works**

**Start your app:**
```powershell
npm run dev
```

**Test health endpoint:**
- Open: `http://localhost:3002/api/health`
- Should show: `"database": "connected"`

**Test Knowledge Base:**
1. Go to: `http://localhost:3002/knowledge-base`
2. Create a test entry
3. Restart app (`Ctrl + C` then `npm run dev`)
4. Verify entry still exists ✅

---

## 🐛 **TROUBLESHOOTING**

### **Problem: "docker is not recognized"**

**Solution:**
1. Make sure Docker Desktop is running
2. Restart PowerShell after starting Docker
3. Check Docker is in PATH:
   ```powershell
   $env:PATH -split ';' | Select-String docker
   ```

### **Problem: "Can't reach database server"**

**Solution:**
1. Check Docker is running: `docker ps`
2. Check containers are up: `docker ps | Select-String postgres`
3. Restart containers: `docker-compose restart postgres redis`

### **Problem: "EPERM: operation not permitted" (Prisma)**

**Solution:**
1. Close all terminals running `npm run dev`
2. Close VS Code/Cursor
3. Wait 5 seconds
4. Try `npm run prisma:generate` again

### **Problem: Migration fails**

**Solution:**
1. Check database is running: `docker ps`
2. Check `.env.local` has correct `DATABASE_URL`
3. Try: `docker-compose restart postgres`
4. Wait 10 seconds
5. Try migration again

---

## ✅ **QUICK CHECKLIST**

Before running migrations, verify:

- [ ] Docker Desktop is running (green icon)
- [ ] `docker ps` command works
- [ ] `docker-compose up -d postgres redis` completed successfully
- [ ] `.env.local` exists with `DATABASE_URL`
- [ ] No `npm run dev` processes running
- [ ] Prisma can generate client

---

## 🎯 **AFTER SETUP IS COMPLETE**

Once database is set up:

1. ✅ **Data persists** - Won't disappear on restart
2. ✅ **RAG works** - Vector search enabled
3. ✅ **Knowledge Base saves** - To database
4. ✅ **Ready for production** - All services can connect

---

**Next:** Continue building your business logic!

