# 🐳 Docker Desktop - Installation Guide

**For:** Windows Users  
**Time Required:** 10-15 minutes  
**Difficulty:** Easy (Step-by-step instructions)

---

## 🔍 **CHECK IF YOU HAVE DOCKER**

### **Quick Check:**

1. **Look for Docker Desktop icon:**
   - Check your system tray (bottom right corner)
   - Look for a whale icon 🐳
   - If you see it, Docker might be installed

2. **Check Start Menu:**
   - Press `Win` key
   - Search for "Docker Desktop"
   - If it appears, Docker is installed

3. **Check Program Files:**
   - Open File Explorer
   - Go to: `C:\Program Files\Docker\Docker\`
   - If folder exists, Docker is installed

---

## 📥 **HOW TO DOWNLOAD DOCKER DESKTOP**

### **Step 1: Go to Docker Website**

**Direct Download Link:**
```
https://www.docker.com/products/docker-desktop/
```

**Or search:** "Docker Desktop Windows" in Google

---

### **Step 2: Download**

1. **Click "Download for Windows"**
   - It will download `Docker Desktop Installer.exe`
   - File size: ~500 MB
   - Save it to your Downloads folder

2. **Wait for Download**
   - This takes 2-5 minutes depending on your internet speed

---

## 🔧 **HOW TO INSTALL DOCKER DESKTOP**

### **Step 1: Run the Installer**

1. **Find the downloaded file:**
   - Usually in: `C:\Users\balba\Downloads\Docker Desktop Installer.exe`
   - Or check your Downloads folder

2. **Double-click the installer**
   - Windows may ask for permission → Click "Yes"

3. **Installation Wizard Opens**
   - Follow the on-screen instructions

---

### **Step 2: Installation Options**

**During installation, you'll see:**

1. **Configuration Options:**
   - ✅ **"Use WSL 2 instead of Hyper-V"** - Check this (recommended)
   - ✅ **"Add shortcut to desktop"** - Check this (optional)
   - Click "OK"

2. **Installation Progress:**
   - Wait for installation to complete
   - This takes 5-10 minutes
   - Don't close the window

3. **When Done:**
   - You'll see "Installation succeeded"
   - Click "Close and restart" or "Close"
   - **IMPORTANT:** Restart your computer if asked

---

### **Step 3: Start Docker Desktop**

**After restart (if you restarted):**

1. **Open Docker Desktop:**
   - Look for Docker Desktop icon on desktop
   - Or search "Docker Desktop" in Start menu
   - Double-click to open

2. **First Time Setup:**
   - Docker Desktop will start
   - You'll see "Docker Desktop is starting..."
   - Wait 1-2 minutes
   - Status will change to "Running" (green)

3. **Accept Terms (if asked):**
   - Read and accept Docker Desktop terms
   - Click "Accept"

---

## ✅ **VERIFY INSTALLATION**

### **Test Docker is Working:**

1. **Open PowerShell:**
   - Press `Win + X`
   - Select "Windows PowerShell" or "Terminal"

2. **Check Docker Version:**
   ```powershell
   docker --version
   ```
   **Expected:** `Docker version 24.x.x` or similar

3. **Check Docker Compose:**
   ```powershell
   docker-compose --version
   ```
   **Expected:** `Docker Compose version v2.x.x` or similar

4. **Test Docker:**
   ```powershell
   docker ps
   ```
   **Expected:** List of containers (might be empty, that's OK)

---

## 🎯 **AFTER INSTALLATION**

### **Now You Can:**

1. **Run Database Setup:**
   ```powershell
   cd C:\Users\balba\hazalyze-asn-module
   powershell -ExecutionPolicy Bypass -File scripts/setup-database.ps1
   ```

2. **Or Follow Manual Guide:**
   - See: `docs/DATABASE_SETUP_INSTRUCTIONS.md`

---

## 🐛 **TROUBLESHOOTING**

### **Problem: "WSL 2 installation is incomplete"**

**Solution:**
1. Docker will show a link to install WSL 2
2. Click the link
3. Download and install WSL 2
4. Restart computer
5. Start Docker Desktop again

### **Problem: "Docker Desktop won't start"**

**Solution:**
1. Make sure virtualization is enabled in BIOS
2. Check Windows features:
   - Press `Win + R`
   - Type: `optionalfeatures`
   - Enable "Virtual Machine Platform" and "Windows Subsystem for Linux"
   - Restart computer

### **Problem: "Docker is not recognized"**

**Solution:**
1. Restart PowerShell after installing Docker
2. Make sure Docker Desktop is running (green icon)
3. Check PATH:
   ```powershell
   $env:PATH -split ';' | Select-String docker
   ```

---

## 📋 **SYSTEM REQUIREMENTS**

**Before installing, make sure you have:**

- ✅ **Windows 10 64-bit** (version 1903 or higher)
- ✅ **OR Windows 11 64-bit**
- ✅ **4GB RAM minimum** (8GB recommended)
- ✅ **Virtualization enabled** in BIOS
- ✅ **Administrator access** (for installation)

---

## 🚀 **QUICK INSTALLATION SUMMARY**

1. **Download:** https://www.docker.com/products/docker-desktop/
2. **Run installer:** Double-click `Docker Desktop Installer.exe`
3. **Follow wizard:** Click "Next" through installation
4. **Restart computer:** If asked
5. **Start Docker Desktop:** Wait for "Running" status
6. **Verify:** Run `docker --version` in PowerShell

---

## ✅ **INSTALLATION CHECKLIST**

After installation, verify:

- [ ] Docker Desktop icon appears in system tray
- [ ] Docker Desktop shows "Running" status
- [ ] `docker --version` command works
- [ ] `docker-compose --version` command works
- [ ] `docker ps` command works (may show empty list)

---

## 🎉 **NEXT STEPS**

Once Docker is installed and running:

1. **Run database setup:**
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/setup-database.ps1
   ```

2. **Or follow manual setup:**
   - See: `docs/DATABASE_SETUP_INSTRUCTIONS.md`

---

**Need Help?** Check Docker Desktop documentation: https://docs.docker.com/desktop/

