# 🎥 Dahua Camera Integration Guide
## Complete Integration Guide for Hazalyze Platform

**Date:** 2025-01-27  
**Status:** ✅ Integration Service Complete - Ready for Configuration

---

## 📋 **EXECUTIVE SUMMARY**

This guide provides complete instructions for integrating Dahua cameras with your Hazalyze platform. The integration supports:

- ✅ **ONVIF Protocol** - Standard IP camera communication
- ✅ **RTSP Streaming** - Real-time video streaming
- ✅ **HLS Conversion** - Browser-compatible streaming (requires media server)
- ✅ **DMSS Compatibility** - Works with existing DMSS app setup
- ✅ **Camera Discovery** - Automatic network scanning
- ✅ **Health Monitoring** - Automatic status checking
- ✅ **Warehouse Integration** - Links cameras to warehouse locations

---

## 🎯 **INTEGRATION METHODS**

### **Method 1: Automatic Discovery (Recommended)**

The platform can automatically discover Dahua cameras on your network:

```bash
POST /api/cameras/discover
{
  "networkRange": ["192.168.1.0/24"],
  "port": 80,
  "timeout": 5000
}
```

**Requirements:**
- Cameras must be on the same network or accessible network
- ONVIF must be enabled on cameras
- Network scanning permissions

### **Method 2: Manual Registration**

Register cameras individually with known credentials:

```bash
POST /api/cameras
{
  "ipAddress": "192.168.1.100",
  "port": 80,
  "username": "admin",
  "password": "your-password",
  "model": "IPC-HDW2431T-AS-S2",
  "serialNumber": "ABC123456789"
}
```

---

## 📝 **INFORMATION NEEDED FROM YOUR SIDE**

To ensure 100% working integration, please provide the following information for each camera:

### **1. Basic Camera Information** (Required)

- **IP Address**: Camera's IP address on your network
  - Example: `192.168.1.100`
- **Port**: HTTP port (usually 80 or 8080)
- **Username**: Admin username for camera access
- **Password**: Admin password for camera access
- **Model Number**: Exact Dahua model number
  - Example: `IPC-HDW2431T-AS-S2`
  - Found on camera label or in DMSS app
- **Serial Number**: Camera serial number
  - Found on camera label or in DMSS app

### **2. Network Configuration** (Required)

- **Network Range**: IP range where cameras are located
  - Example: `192.168.1.0/24`
- **Subnet Mask**: Network subnet
- **Gateway**: Network gateway IP
- **DNS Servers**: DNS configuration
- **VLAN**: If cameras are on separate VLAN

### **3. Camera Capabilities** (Helpful)

- **Number of Channels**: How many video channels per camera
- **PTZ Support**: Pan-Tilt-Zoom capability (Yes/No)
- **Audio Support**: Audio recording capability (Yes/No)
- **Night Vision**: IR/night vision capability (Yes/No)
- **AI Features**: Any AI features enabled
  - Example: Motion detection, face recognition, license plate recognition

### **4. Location Information** (Required for Warehouse Integration)

- **Warehouse ID**: Which warehouse this camera belongs to
- **Zone/Area**: Specific zone within warehouse
  - Example: "Main Gate", "Loading Dock", "Storage Area A"
- **Coordinates**: Physical location coordinates (optional)
- **Purpose**: What the camera monitors
  - Example: "Security", "Safety Compliance", "Process Monitoring"

### **5. Recording Configuration** (Optional)

- **Recording Enabled**: Is continuous recording enabled?
- **Recording Schedule**: Recording schedule if applicable
- **Storage Location**: Where recordings are stored (NVR, cloud, etc.)
- **NVR Information**: If using NVR, provide NVR details

### **6. DMSS App Information** (Helpful)

- **DMSS Account**: Email/username used in DMSS app
- **Device List**: List of devices visible in DMSS app
- **Current Access Method**: How cameras are currently accessed
  - Example: "P2P", "IP/DDNS", "Local Network"

### **7. Security & Access** (Important)

- **ONVIF Enabled**: Is ONVIF protocol enabled? (Should be Yes)
- **RTSP Port**: RTSP streaming port (usually 554)
- **HTTPS Support**: Does camera support HTTPS?
- **Firewall Rules**: Any firewall rules affecting camera access
- **VPN Access**: If cameras need VPN access

---

## 🔧 **STEP-BY-STEP INTEGRATION PROCESS**

### **Step 1: Gather Camera Information**

Use the checklist above to gather all required information for each camera. You can find most information in:

1. **DMSS App**: Device details, serial numbers, IP addresses
2. **Camera Web Interface**: Access via `http://[IP_ADDRESS]`
3. **Camera Labels**: Physical labels on cameras
4. **Network Admin**: Network configuration details

### **Step 2: Enable ONVIF (If Not Already Enabled)**

**📖 See detailed guide: `docs/HOW_TO_ENABLE_ONVIF_DAHUA.md`**

Quick steps:
1. Access camera web interface: `http://[IP_ADDRESS]`
2. Login with admin credentials
3. Navigate to: **Setup → Network → Advanced Settings → Integration → ONVIF**
   - (Path may vary by model - see detailed guide)
4. Enable **ONVIF** protocol
5. Set ONVIF port (usually 80 or 8080)
6. Enable **ONVIF Authentication**
7. Save settings (camera may restart)

### **Step 3: Test Camera Connectivity**

Before integration, test that cameras are accessible:

```bash
# Test HTTP access
curl http://[IP_ADDRESS]:[PORT]

# Test RTSP stream (requires VLC or similar)
rtsp://[USERNAME]:[PASSWORD]@[IP_ADDRESS]:554/cam/realmonitor?channel=1&subtype=0
```

### **Step 4: Register Cameras**

#### **Option A: Automatic Discovery**

```bash
POST /api/cameras/discover
Content-Type: application/json

{
  "networkRange": ["192.168.1.0/24"],
  "port": 80,
  "timeout": 10000
}
```

#### **Option B: Manual Registration**

For each camera:

```bash
POST /api/cameras
Content-Type: application/json

{
  "ipAddress": "192.168.1.100",
  "port": 80,
  "username": "admin",
  "password": "your-password",
  "model": "IPC-HDW2431T-AS-S2",
  "serialNumber": "ABC123456789"
}
```

### **Step 5: Configure Camera Locations**

Link cameras to warehouse locations:

```bash
PUT /api/cameras/[CAMERA_ID]
Content-Type: application/json

{
  "location": {
    "warehouseId": "wh-001",
    "zone": "Main Gate - Inbound",
    "coordinates": { "x": 10, "y": 20 }
  },
  "name": "Main Gate - Inbound Camera"
}
```

### **Step 6: Test Stream Access**

Get stream URLs:

```bash
# Get RTSP stream
GET /api/cameras/[CAMERA_ID]/stream?format=rtsp&channel=1

# Get HLS stream (for browser viewing)
GET /api/cameras/[CAMERA_ID]/stream?format=hls&channel=1

# Get snapshot
GET /api/cameras/[CAMERA_ID]/stream?format=snapshot&channel=1
```

### **Step 7: Verify Integration**

1. Check camera status: `GET /api/cameras/[CAMERA_ID]`
2. Test connection: `POST /api/cameras/[CAMERA_ID]/test`
3. View in warehouse security dashboard
4. Verify stream playback

---

## 🌐 **STREAMING FORMATS**

### **RTSP (Real-Time Streaming Protocol)**

- **Format**: `rtsp://[USERNAME]:[PASSWORD]@[IP]:554/cam/realmonitor?channel=1&subtype=0`
- **Use Case**: Direct camera access, VLC player, media servers
- **Browser Support**: ❌ Not directly supported (requires conversion)

### **HLS (HTTP Live Streaming)**

- **Format**: `/api/cameras/[CAMERA_ID]/stream/hls?channel=1`
- **Use Case**: Browser viewing, mobile apps
- **Browser Support**: ✅ Fully supported
- **Requirement**: Media server (MediaMTX, Wowza, or similar) to convert RTSP → HLS

### **Snapshot**

- **Format**: `http://[USERNAME]:[PASSWORD]@[IP]/cgi-bin/snapshot.cgi?channel=1`
- **Use Case**: Static images, thumbnails, AI analysis
- **Browser Support**: ✅ Fully supported

---

## 🔐 **SECURITY CONSIDERATIONS**

### **Password Storage**

- Passwords are encrypted before storage
- Never expose passwords in API responses
- Use environment variables for default credentials

### **Network Security**

- Use HTTPS for camera web interfaces when possible
- Restrict camera access to internal network
- Use VPN for remote access
- Enable firewall rules to protect cameras

### **ONVIF Security**

- Use strong ONVIF passwords
- Disable default accounts
- Regularly update camera firmware
- Monitor for security vulnerabilities

---

## 🚀 **MEDIA SERVER SETUP (For Browser Streaming)**

To enable browser viewing of RTSP streams, you need a media server to convert RTSP to HLS:

### **Option 1: MediaMTX (Recommended - Free & Open Source)**

```bash
# Docker installation
docker run -d \
  -p 8554:8554 \
  -p 1935:1935 \
  -p 8888:8888 \
  --name mediamtx \
  bluenviron/mediamtx:latest
```

### **Option 2: Wowza Streaming Engine**

Commercial solution with advanced features.

### **Option 3: AWS MediaLive**

Cloud-based solution for scalable streaming.

---

## 📊 **API ENDPOINTS REFERENCE**

### **Camera Management**

- `GET /api/cameras` - List all cameras
- `POST /api/cameras` - Register new camera
- `GET /api/cameras/[cameraId]` - Get camera details
- `PUT /api/cameras/[cameraId]` - Update camera
- `DELETE /api/cameras/[cameraId]` - Remove camera

### **Camera Discovery**

- `POST /api/cameras/discover` - Discover cameras on network

### **Streaming**

- `GET /api/cameras/[cameraId]/stream` - Get stream URLs
  - Query params: `format` (rtsp|hls|snapshot), `channel`, `streamType`

### **Testing**

- `POST /api/cameras/[cameraId]/test` - Test camera connection

### **Warehouse Integration**

- `GET /api/warehouse/security/cameras?warehouseId=[ID]` - Get cameras for warehouse

---

## 🐛 **TROUBLESHOOTING**

### **Camera Not Discovered**

1. Check network connectivity
2. Verify ONVIF is enabled
3. Check firewall rules
4. Try manual registration

### **Stream Not Working**

1. Test RTSP URL in VLC player
2. Verify credentials are correct
3. Check camera port (554 for RTSP)
4. Verify network allows RTSP traffic

### **Connection Timeout**

1. Check camera IP address
2. Verify camera is online
3. Test network ping
4. Check firewall/security settings

### **Authentication Failed**

1. Verify username/password
2. Check for special characters in password
3. Try resetting camera credentials
4. Verify user has admin permissions

---

## 📞 **SUPPORT & NEXT STEPS**

### **What We Need From You**

1. ✅ Complete the information checklist above
2. ✅ Provide camera IP addresses and credentials
3. ✅ Confirm network configuration
4. ✅ Specify warehouse locations for each camera
5. ✅ Test camera connectivity before integration

### **What We'll Do**

1. ✅ Configure camera service with your information
2. ✅ Register all cameras in the system
3. ✅ Link cameras to warehouse locations
4. ✅ Set up streaming (RTSP/HLS)
5. ✅ Integrate with warehouse security dashboard
6. ✅ Test and verify all functionality

---

## ✅ **INTEGRATION CHECKLIST**

- [ ] Camera information gathered (IP, credentials, model, serial)
- [ ] Network configuration documented
- [ ] ONVIF enabled on all cameras
- [ ] Camera connectivity tested
- [ ] Cameras registered in system
- [ ] Camera locations configured
- [ ] Stream URLs tested and working
- [ ] Warehouse integration verified
- [ ] Security dashboard showing cameras
- [ ] Health monitoring active

---

**Last Updated:** 2025-01-27  
**Status:** Ready for Camera Information Collection

