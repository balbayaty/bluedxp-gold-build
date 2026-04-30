# 🚀 Quick Start - Docker Desktop Installation

**Time:** 10-15 minutes  
**Difficulty:** Easy

---

## 📥 **DOWNLOAD (2 minutes)**

1. **Click this link or copy to browser:**
   ```
   https://www.docker.com/products/docker-desktop/
   ```

2. **Click "Download for Windows"**
   - File: `Docker Desktop Installer.exe`
   - Size: ~500 MB
   - Saves to Downloads folder

---

## 🔧 **INSTALL (5-10 minutes)**

1. **Find the file:**
   - Go to: `C:\Users\balba\Downloads\`
   - Look for: `Docker Desktop Installer.exe`

2. **Double-click to install:**
   - Click "Yes" if Windows asks for permission
   - Follow the installation wizard
   - ✅ Check "Use WSL 2 instead of Hyper-V"
   - Click "OK" and wait

3. **When done:**
   - Click "Close and restart" (if asked)
   - **Restart your computer** (important!)

---

## ✅ **START DOCKER (2 minutes)**

1. **After restart:**
   - Open Docker Desktop (from Start menu or desktop icon)
   - Wait for "Running" status (green)
   - Takes 1-2 minutes

2. **Verify it works:**
   - Open PowerShell
   - Type: `docker --version`
   - Should show version number ✅

---

## 🎯 **THEN RUN DATABASE SETUP**

Once Docker is running:

```powershell
cd C:\Users\balba\hazalyze-asn-module
powershell -ExecutionPolicy Bypass -File scripts/setup-database.ps1
```

---

**Full Guide:** See `docs/DOCKER_INSTALLATION_GUIDE.md` for detailed instructions

