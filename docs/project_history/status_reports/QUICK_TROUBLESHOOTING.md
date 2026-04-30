# 🆘 Quick Troubleshooting Guide

## Common Problems & Quick Fixes

### Problem: "npm: command not found"

**What it means**: Node.js is not installed or not in your PATH.

**Fix**:
1. Download Node.js from https://nodejs.org
2. Install it
3. Restart your terminal
4. Try again

---

### Problem: "docker: command not found"

**What it means**: Docker is not installed or not running.

**Fix**:
1. Download Docker Desktop from https://www.docker.com/products/docker-desktop
2. Install and start Docker Desktop
3. Wait for Docker to fully start (whale icon in system tray)
4. Try again

---

### Problem: "Port 3002 is already in use"

**What it means**: Another program is using port 3002.

**Fix**:
1. Find what's using the port:
   - Windows: `netstat -ano | findstr :3002`
   - Mac/Linux: `lsof -i :3002`
2. Close that program
3. Or change the port in `docker-compose.yml`

---

### Problem: "Cannot connect to Docker daemon"

**What it means**: Docker Desktop is not running.

**Fix**:
1. Open Docker Desktop
2. Wait for it to fully start
3. Look for the whale icon in your system tray
4. Try again

---

### Problem: Services won't start

**What it means**: Something is preventing services from starting.

**Fix**:
1. Check Docker is running: `docker ps`
2. Check logs: `docker-compose logs`
3. Restart Docker Desktop
4. Try: `docker-compose down` then `docker-compose up -d`

---

### Problem: "Database connection failed"

**What it means**: PostgreSQL container is not running.

**Fix**:
1. Check if postgres is running: `docker-compose ps postgres`
2. If not, start it: `docker-compose up -d postgres`
3. Wait 30 seconds
4. Try again

---

### Problem: "Redis connection failed"

**What it means**: Redis container is not running.

**Fix**:
1. Check if redis is running: `docker-compose ps redis`
2. If not, start it: `docker-compose up -d redis`
3. Wait 10 seconds
4. Try again

---

### Problem: Setup script fails

**What it means**: Something went wrong during setup.

**Fix**:
1. Check the error message
2. Make sure all prerequisites are installed
3. Check internet connection
4. Try running steps manually (see QUICK_START.md)

---

### Problem: "Permission denied" (Mac/Linux)

**What it means**: You don't have permission to run the command.

**Fix**:
1. Make script executable: `chmod +x scripts/setup-infrastructure.sh`
2. Or use: `bash scripts/setup-infrastructure.sh`

---

### Problem: Application won't load in browser

**What it means**: Application is not running or port is wrong.

**Fix**:
1. Check if app is running: `docker-compose ps app`
2. Check logs: `docker-compose logs app`
3. Verify port: Should be http://localhost:3002
4. Try restarting: `docker-compose restart app`

---

## 🔍 Diagnostic Commands

### Check Everything at Once
```bash
npm run validate:setup
```

### Check Service Connectivity
```bash
npm run check:connectivity
```

### Check Dependencies
```bash
npm run check:deps
```

### View All Service Status
```bash
docker-compose ps
```

### View Service Logs
```bash
docker-compose logs [service-name]
```

### Restart Everything
```bash
docker-compose down
docker-compose up -d
```

---

## 📚 More Help

- **Detailed Troubleshooting**: [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)
- **Beginner Guide**: [BEGINNER_GUIDE.md](./BEGINNER_GUIDE.md)
- **Quick Start**: [QUICK_START.md](./QUICK_START.md)

---

## ✅ Still Stuck?

1. Check the detailed troubleshooting guide
2. Review service logs
3. Verify all prerequisites are installed
4. Make sure Docker is running
5. Try restarting everything

---

**Most problems are solved by:**
1. Making sure Docker is running
2. Restarting services: `docker-compose restart`
3. Checking logs: `docker-compose logs`

