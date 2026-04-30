# 🔧 How to Enable ONVIF on Dahua Cameras
## Step-by-Step Guide

**ONVIF** (Open Network Video Interface Forum) is a standard protocol that allows cameras to communicate with different systems. Enabling it allows automatic camera discovery and integration.

---

## 📍 **WHERE TO FIND ONVIF SETTINGS**

### **Step 1: Access Camera Web Interface**

1. **Find Camera IP Address**
   - Open **DMSS app** on your phone
   - Go to device list
   - Tap on a camera → **Device Details**
   - Look for **IP Address** (e.g., `192.168.1.100`)
   - Or check your router's device list

2. **Open Web Browser**
   - Make sure your computer/phone is on the **same network** as the cameras
   - Open a web browser (Chrome, Firefox, Edge)
   - Type the camera IP address in the address bar:
     ```
     http://192.168.1.100
     ```
     (Replace with your actual camera IP)

3. **Login**
   - Enter your **admin username** (usually `admin`)
   - Enter your **admin password**
   - Click **Login**

---

### **Step 2: Navigate to ONVIF Settings**

The exact path depends on your camera model and firmware version. Try these paths in order:

#### **Path Option 1: (Most Common)**
```
Setup → Network → Advanced Settings → Integration → ONVIF
```

#### **Path Option 2:**
```
Configuration → Network → Access Platform → ONVIF
```

#### **Path Option 3:**
```
Settings → Network → Access Platform → ONVIF
```

#### **Path Option 4:**
```
Setup → Network → Access Platform → ONVIF
```

#### **Path Option 5: (Older Models)**
```
Setup → Network → Advanced → Integration → ONVIF
```

---

### **Step 3: Enable ONVIF**

Once you find the ONVIF settings page:

1. **Enable ONVIF**
   - Find the **ONVIF** toggle/checkbox
   - Set it to **"On"** or **"Enabled"**

2. **Set ONVIF Port** (if shown)
   - Default is usually **80** or **8080**
   - Keep default unless you have a specific reason to change it

3. **ONVIF Authentication** (if shown)
   - Set to **"On"** or **"Enabled"**
   - This allows secure ONVIF access

4. **Save Settings**
   - Click **"Save"** or **"Apply"**
   - Camera may restart (this is normal)

---

## 🎯 **VISUAL GUIDE**

### **Typical ONVIF Settings Page Looks Like:**

```
┌─────────────────────────────────────┐
│  ONVIF Settings                     │
├─────────────────────────────────────┤
│  ☑ Enable ONVIF                    │
│                                     │
│  Port: [80        ]                 │
│                                     │
│  ☑ Enable ONVIF Authentication     │
│                                     │
│  [Save]  [Cancel]                  │
└─────────────────────────────────────┘
```

---

## 🔍 **IF YOU CAN'T FIND ONVIF SETTINGS**

### **Method 1: Search in Web Interface**
- Look for a **search box** in the camera interface
- Type: `ONVIF` or `Integration`

### **Method 2: Check Different Menu Sections**
- Try: **Network**, **Advanced**, **Integration**, **Access Platform**, **Protocol**
- Some cameras have it under **System** → **Network** → **ONVIF**

### **Method 3: Check Camera Model**
- Older cameras might not have ONVIF
- Newer Dahua cameras (2015+) usually have ONVIF
- Check your camera model number

### **Method 4: Use DMSS App**
- Some settings can be changed in DMSS app
- Go to: **Device** → **Settings** → **Network** → **ONVIF**

---

## ✅ **VERIFY ONVIF IS ENABLED**

### **Quick Test:**

1. **Check ONVIF Port**
   - Try accessing: `http://[CAMERA_IP]:80/onvif/device_service`
   - If you see XML response, ONVIF is working

2. **Use ONVIF Device Manager** (Optional)
   - Download free tool: **ONVIF Device Manager**
   - Scan network - should find your camera if ONVIF is enabled

---

## 📱 **ALTERNATIVE: ENABLE VIA DMSS APP**

Some Dahua cameras allow ONVIF configuration through the DMSS app:

1. Open **DMSS app**
2. Go to **Device** tab
3. Tap on your camera
4. Tap **Settings** (gear icon)
5. Look for **Network** or **Advanced Settings**
6. Find **ONVIF** option
7. Enable it

---

## ⚠️ **IMPORTANT NOTES**

1. **Camera Restart**
   - Enabling ONVIF may cause camera to restart
   - This is normal and takes 30-60 seconds
   - Camera will come back online automatically

2. **Network Access**
   - Make sure your computer is on the same network as cameras
   - If cameras are on a different VLAN, you may need network access

3. **Firewall**
   - Some firewalls block ONVIF discovery
   - May need to allow ONVIF ports (usually 80, 8080, 3702)

4. **Default Credentials**
   - If you don't know the password, check:
     - Camera label/sticker
     - DMSS app (device details)
     - Default is often `admin` / `admin` (change this!)

---

## 🆘 **STILL CAN'T FIND IT?**

If you can't find ONVIF settings:

1. **Check Camera Model**
   - Tell us your camera model number
   - We can provide model-specific instructions

2. **Check Firmware Version**
   - Some older firmware versions have ONVIF in different locations
   - May need to update firmware

3. **Manual Registration Works Too**
   - Even without ONVIF, you can manually register cameras
   - Just provide IP address and credentials
   - We'll register them directly

---

## 📞 **QUICK REFERENCE**

**ONVIF Location (Most Common):**
```
Setup → Network → Advanced Settings → Integration → ONVIF
```

**What to Enable:**
- ☑ Enable ONVIF
- ☑ Enable ONVIF Authentication
- Port: 80 (default)

**After Enabling:**
- Camera will restart
- Wait 30-60 seconds
- ONVIF is now active

---

**Need Help?** If you can't find ONVIF settings, just let us know your camera model number and we'll provide specific instructions!














