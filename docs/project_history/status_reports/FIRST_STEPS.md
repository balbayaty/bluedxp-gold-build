# 🎯 BlueDXP Platform - Your First Steps

## Welcome! Let's Get You Started

This is a simple, step-by-step guide to get your platform running for the first time.

---

## ✅ Step-by-Step Checklist

### Before You Start

- [ ] You have a computer (Windows, Mac, or Linux)
- [ ] You have internet connection
- [ ] You're ready to follow instructions

### Step 1: Install Prerequisites (If Needed)

**Check if you have these:**
- [ ] Node.js (version 20 or higher)
- [ ] Docker Desktop
- [ ] Git

**Don't have them?**
- **Node.js**: Download from https://nodejs.org
- **Docker**: Download from https://www.docker.com/products/docker-desktop
- **Git**: Download from https://git-scm.com

**Already have them?** Great! Skip to Step 2.

### Step 2: Open Your Terminal

**Windows:**
- Press `Windows Key + X`
- Click "Windows PowerShell" or "Terminal"

**Mac:**
- Press `Cmd + Space`
- Type "Terminal"
- Press Enter

**Linux:**
- Press `Ctrl + Alt + T`

### Step 3: Go to Your Project Folder

Type this (replace with your actual folder path):
```bash
cd C:\Users\balba\hazalyze-asn-module
```

Press Enter.

### Step 4: Check Dependencies

Type:
```bash
npm run check:deps
```

Press Enter.

**What to expect:**
- ✅ Green checkmarks = Good to go!
- ❌ Red X = Install missing items

### Step 5: Run Setup

**Windows:**
```powershell
npm run setup:windows
```

**Mac/Linux:**
```bash
npm run setup
```

**What happens:**
- Installs all dependencies
- Sets up database
- Configures services
- Takes 5-10 minutes

**Just wait and let it finish!**

### Step 6: Start Services

Type:
```bash
docker-compose up -d
```

Press Enter.

**What happens:**
- Starts all 15+ services
- Takes 1-2 minutes
- Services start in the background

### Step 7: Verify Everything Works

Type:
```bash
npm run check:connectivity
```

Press Enter.

**What to expect:**
- ✅ All services show "connected"
- If something shows "disconnected", check the troubleshooting guide

### Step 8: Open Your Browser

Go to: **http://localhost:3002**

**You should see:**
- Your application running!

---

## 🎉 Success! What's Next?

### Explore Your Platform

1. **Main Application**: http://localhost:3002
2. **Health Check**: http://localhost:3002/api/health
3. **Monitoring Dashboard**: http://localhost:3001 (admin/admin)

### Learn More

- Read [BEGINNER_GUIDE.md](./BEGINNER_GUIDE.md) for more details
- Check [WHAT_YOU_HAVE.md](./WHAT_YOU_HAVE.md) to see what you have
- Review [docs/QUICK_REFERENCE.md](./docs/QUICK_REFERENCE.md) for commands

---

## ⚠️ Common Issues

### "Command not found"
- **Solution**: Make sure you're in the project folder
- Type `pwd` (Mac/Linux) or `cd` (Windows) to check

### "Port already in use"
- **Solution**: Another program is using the port
- Close other applications or change the port in `docker-compose.yml`

### "Docker not running"
- **Solution**: Start Docker Desktop
- Wait for it to fully start before running commands

### "npm: command not found"
- **Solution**: Node.js is not installed or not in PATH
- Install Node.js from https://nodejs.org

---

## 🆘 Need Help?

1. **Check**: [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)
2. **Read**: [BEGINNER_GUIDE.md](./BEGINNER_GUIDE.md)
3. **Review**: Service logs with `docker-compose logs`

---

## 📝 Quick Command Reference

```bash
# Start everything
docker-compose up -d

# Stop everything
docker-compose down

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Check connectivity
npm run check:connectivity

# Validate setup
npm run validate:setup
```

---

## ✅ You're Done!

Once you see your application at http://localhost:3002, you're all set!

**Congratulations! Your BlueDXP Platform is running!** 🎉

---

**Next**: Explore the application and read the documentation to learn more!

