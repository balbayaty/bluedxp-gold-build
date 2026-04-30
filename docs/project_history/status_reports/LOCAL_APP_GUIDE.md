# 🚀 Local App Guide - What to Check

## ✅ Development Server Started

Your app is now running at: **http://localhost:3002**

---

## 📋 **Pages to Check**

### **1. ISO IMS Pages (Newly Added)**
Navigate to these pages from the sidebar under **ISO IMS**:
- **User Management** → `/user-management`
- **Incident Report** → `/incident-report`
- **Inspection Checklist** → `/inspection-checklist`
- **My CAPA Workspace** → `/my-capa-workspace`

### **2. IoT Management Pages (Newly Added)**
- **IoT Dashboard** → `/iot`
- **IoT Devices** → `/iot/devices`
- **IoT Analytics** → `/iot/analytics`
- **IoT Network** → `/iot/network`

### **3. Dashboard Pages (Newly Added)**
- **Executive Dashboard** → `/dashboards/executive`
- **ML Analytics Dashboard** → `/dashboards/ml-analytics`
- **Ultimate Dashboard** → `/dashboards/ultimate`

---

## 🎯 **How to Navigate**

1. **Open your browser** and go to: `http://localhost:3002`

2. **Check the sidebar navigation**:
   - Click the menu icon (☰) to open the sidebar
   - Look for **ISO IMS** section - you should see all 4 new pages
   - Look for **IoT Management** section - you should see IoT pages
   - Look for **Dashboard** section - you should see dashboard options

3. **Test each page**:
   - Click on each menu item
   - Verify pages load correctly
   - Check that components render properly
   - Test any interactive features

---

## 🔍 **What to Verify**

### **ISO IMS Pages:**
- ✅ User Management page loads and shows user list
- ✅ Incident Report page loads with form
- ✅ Inspection Checklist page loads
- ✅ My CAPA Workspace page loads with CAPA list

### **IoT Pages:**
- ✅ IoT Devices page shows device manager
- ✅ IoT Analytics page shows analytics panel
- ✅ IoT Network page shows network map

### **Dashboard Pages:**
- ✅ Executive Dashboard shows metrics and charts
- ✅ ML Analytics Dashboard shows ML metrics
- ✅ Ultimate Dashboard shows consolidated view

---

## ⚠️ **Known Issues**

1. **Build Error**: There's a build error in `app/trade-compliance/landed-costs/page.tsx` that prevents production builds, but the dev server should work fine.

2. **Mock Data**: Some pages may show mock data if ERPNext isn't connected. This is expected.

---

## 🛠️ **If Server Doesn't Start**

If you encounter any issues:

1. **Check if port 3002 is in use**:
   ```powershell
   netstat -ano | findstr :3002
   ```

2. **Kill any existing process**:
   ```powershell
   taskkill /PID <process_id> /F
   ```

3. **Restart the server**:
   ```powershell
   npm run dev
   ```

---

## 📝 **Quick Links**

- **Main Dashboard**: http://localhost:3002/
- **ISO IMS Dashboard**: http://localhost:3002/iso-ims
- **IoT Management**: http://localhost:3002/iot
- **Executive Dashboard**: http://localhost:3002/dashboards/executive
- **ML Analytics**: http://localhost:3002/dashboards/ml-analytics

---

## 🎉 **Enjoy Exploring!**

All the migrated features and new components are now available in your local app. Navigate through the sidebar to see everything!











