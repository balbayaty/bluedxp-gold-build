# How to View Middle East Port Geofences

## 🎯 Quick Access

### **Option 1: Direct URL**
Navigate to:
```
http://localhost:3000/transportation/geofences
```

### **Option 2: Through Navigation Menu**
1. Open the BlueDXP application
2. Go to **Transportation** menu
3. Click on **"Geofence System"**

## 📋 Step-by-Step Guide

### Step 1: Import the Port Geofences First

Before you can see the ports, you need to import them. Choose one method:

#### **Method A: Using the Seed Script (Recommended)**
```bash
# Import all Middle East ports
npx tsx scripts/seed-middle-east-port-geofences.ts tenant-1

# Or import specific country (e.g., Saudi Arabia)
npx tsx scripts/seed-middle-east-port-geofences.ts tenant-1 SA
```

#### **Method B: Using the API**
```bash
curl -X POST http://localhost:3000/api/geofence/zones/bulk-import \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "tenant-1"
  }'
```

#### **Method C: Import Specific Countries via API**
```bash
# Import Saudi Arabia ports
curl -X POST http://localhost:3000/api/geofence/zones/bulk-import \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "tenant-1",
    "country": "SA"
  }'

# Import UAE ports
curl -X POST http://localhost:3000/api/geofence/zones/bulk-import \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "tenant-1",
    "country": "AE"
  }'
```

### Step 2: View the Geofences

1. **Open the Geofence System Page**
   - Go to: `http://localhost:3000/transportation/geofences`
   - Or use the navigation menu: **Transportation → Geofence System**

2. **Select Your Tenant**
   - At the top of the page, enter your tenant ID (e.g., `tenant-1`)
   - Click "Load Zones"

3. **View Zones Tab**
   - You'll see a list of all imported port geofences
   - Each zone shows:
     - Port name (English and Arabic)
     - Zone type (Border Crossing, Dry Port, etc.)
     - Location coordinates
     - Status (Enabled/Disabled)
     - Dwell time settings

4. **Map View Tab**
   - Click on the **"Map"** tab
   - See all geofence zones displayed on an interactive map
   - Click on markers to see port details
   - Zoom in/out to explore different regions

5. **Filter and Search**
   - Use the search box to find specific ports
   - Filter by zone type
   - Filter by country (if you imported multiple countries)

## 🗺️ What You'll See

### Zones List View
- **Port Name**: e.g., "Al Khafji Border Crossing (منفذ الخفجي)"
- **Type**: Border crossing type (BORDER_EXIT_POINT, DRY_PORT, etc.)
- **Location**: Coordinates (lat, lng)
- **Geometry**: Circle with radius in meters
- **Status**: Enabled/Disabled toggle
- **Metadata**: Operating hours, processing times, facilities

### Map View
- **Interactive Map**: All geofence zones as circles on the map
- **Color Coding**: Different colors for different zone types
- **Markers**: Click to see port details
- **Zoom Controls**: Navigate to different regions

### Zone Details
When you click on a zone, you'll see:
- Full port information
- Operating hours
- Processing time estimates
- Facility capabilities (Customs, X-Ray, Cold Storage, etc.)
- Reliability score
- Congestion level
- Connected ports (if applicable)

## 🎨 Zone Type Colors

The map uses color coding:
- 🔴 **Red**: Border Entry/Exit Points
- 🟠 **Orange**: Customs Facilities
- 🔵 **Blue**: Dry Ports & Logistics Hubs
- 🟢 **Green**: Destination Facilities
- 🟣 **Purple**: Route Infrastructure

## 📊 Available Tabs

1. **Zones**: List of all geofence zones
2. **Map**: Interactive map view
3. **Events**: Zone entry/exit event history
4. **Dwell**: Dwell time tracking
5. **Test**: Test geofence detection
6. **Analytics**: Performance analytics

## 🔍 Quick Tips

### Find Specific Ports
- Use the search box: Type port name or code (e.g., "Khafji", "SA-KHF-01")
- Filter by country: Look for ports with country code (SA, AE, KW, etc.)

### View Port Details
- Click on any zone in the list
- Or click on a marker on the map
- See full metadata including:
  - Operating hours
  - Processing times
  - Facility capabilities
  - Connected ports

### Test Geofence Detection
1. Go to **"Test"** tab
2. Enter coordinates (lat, lng)
3. Click "Test Detection"
4. See which zones the location falls into

## 🚀 Example: View Saudi Arabia Ports

```bash
# 1. Import Saudi ports
npx tsx scripts/seed-middle-east-port-geofences.ts tenant-1 SA

# 2. Open browser
http://localhost:3000/transportation/geofences

# 3. Enter tenant ID: tenant-1
# 4. Click "Load Zones"
# 5. You'll see all Saudi ports:
#    - Al Khafji Border Crossing
#    - Al Salmi Border Crossing
#    - Al Batha Border Crossing
#    - Al Haditha Border Crossing
#    - Arar Border Crossing
#    - Ramlat Khaliyah Border Crossing
#    - Al Wadeah Border Crossing
#    - Riyadh Dry Port
#    - Dammam Dry Port
```

## 📱 Mobile View

The geofence system is fully responsive:
- Works on tablets and mobile devices
- Map view adapts to screen size
- Touch-friendly controls

## ❓ Troubleshooting

### No Zones Showing?
1. **Check if ports were imported**: Run the seed script first
2. **Verify tenant ID**: Make sure you're using the same tenant ID
3. **Check console**: Look for any errors in browser console
4. **Verify API**: Check if API is running: `http://localhost:3000/api/geofence/zones?tenantId=tenant-1`

### Map Not Loading?
1. Check internet connection (map tiles need internet)
2. Verify map API keys are configured
3. Check browser console for errors

### Zones Not on Map?
1. Make sure zones are **enabled** (toggle in zones list)
2. Check if coordinates are valid
3. Zoom out on map to see all zones

## 🎯 Next Steps

After viewing the geofences:
1. **Test Detection**: Use the Test tab to verify geofence detection
2. **View Events**: Check the Events tab for zone entry/exit events
3. **Analytics**: See performance metrics in Analytics tab
4. **Customize**: Edit zone settings, dwell times, operating hours

---

**Need Help?** Check the main documentation: `docs/MIDDLE_EAST_PORT_GEOFENCES.md`



