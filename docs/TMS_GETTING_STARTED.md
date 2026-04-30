# 🚀 TMS Module - Getting Started Guide

## Welcome to the Enhanced TMS Module!

This guide will help you get started with the Transport Management System (TMS) module, specifically designed for **Flex Logistics** tenant integration.

---

## 📋 **Quick Start (5 Minutes)**

### Step 1: Access the TMS Module

1. **Navigate to TMS Dashboard:**
   ```
   http://localhost:3000/tms
   ```

2. **Or use the sidebar:**
   - Look for "TMS" or "Transportation" in the left menu
   - Click to expand and see all TMS features

### Step 2: Import Your Data

1. **Go to Import Page:**
   ```
   http://localhost:3000/tms/jobs/import
   ```

2. **Upload Your CSV:**
   - Click "Select CSV File"
   - Choose your Zoho export file: `zoho data.csv`
   - Click "Import CSV"

3. **Wait for Import:**
   - The system will process all rows
   - You'll see progress and results
   - Jobs will be automatically created

### Step 3: View Your Jobs

1. **Go to Jobs Page:**
   ```
   http://localhost:3000/tms/jobs
   ```

2. **Explore:**
   - See all imported jobs
   - Filter by type, status, or search
   - Click any job to see details

---

## 🎯 **Key Features Overview**

### 1. **Job Management** 📋
- View all transport jobs
- Filter and search
- Track job status
- View job details and timeline

**Access:** `/tms/jobs`

### 2. **CSV Import** 📥
- Import Zoho CSV data
- Automatic field mapping
- Validation and error reporting
- Batch processing

**Access:** `/tms/jobs/import`

### 3. **Intelligent POD** ✅
- Digital signature capture
- GPS location verification
- Photo/document evidence
- QR code scanning

**Access:** Click "POD" button on any job

### 4. **Detention Tracking** ⏱️
- Automatic detention calculation
- Cost tracking
- Alert system
- Analytics dashboard

**Access:** `/tms/detention` or job details → Detention tab

### 5. **Transit Time Analytics** 🚀
- Transit time tracking
- Delay analysis
- Performance metrics
- Predictions

**Access:** `/tms/analytics` or job details → Transit tab

### 6. **Lane Management** 🛣️
- Automatic lane creation
- Performance tracking
- Optimization recommendations
- Profitability analysis

**Access:** `/tms/lanes`

### 7. **Regulatory Integration** 🏛️
- TGA verification
- Daleeli verification
- Bayan status tracking
- Real-time status checks

**Access:** `/tms/regulatory`

---

## 📊 **Understanding Your Data**

### What Gets Imported?

The system captures **ALL** fields from your Zoho CSV:

#### Job Information
- Job name, number, type, status
- Customer and transporter details
- Request dates and ETAs

#### Driver & Vehicle
- Driver name, mobile, license, passport, Iqama
- Vehicle plate number, truck type
- Driver nationality

#### Locations
- Origin (POL) and destination (POD)
- Countries and specific locations
- Ports and terminals

#### Events & Timestamps
- Shipper arrival/departure
- Consignee arrival/departure
- Border crossings (Saudi, destination, transit)
- Storage terminal dates
- Loading and offloading times

#### Financial
- Agreed rates and costs
- Detention charges
- Bridge clearance fees
- Other expenses

#### Regulatory
- Bayan numbers (entry/exit)
- Bayan status
- DO (Delivery Order) status
- SI (Shipping Instructions) status
- Manifest status

#### Analytics
- Transit times
- Detention days
- Lane information
- Deal information

---

## 🔧 **Common Tasks**

### Task 1: Import Jobs from CSV

```bash
# Option 1: Use the UI
1. Go to /tms/jobs/import
2. Select your CSV file
3. Click "Import CSV"

# Option 2: Use the script
npx ts-node scripts/import-flex-logistics-csv.ts "path/to/zoho data.csv"
```

### Task 2: Capture POD for a Job

1. Go to job details: `/tms/jobs/{jobId}`
2. Click "POD" tab
3. Fill in delivery information:
   - Delivery date and time
   - Consignee name and phone
   - Delivery location
   - Capture GPS (optional)
   - Upload photos (optional)
   - Add signature (optional)
4. Click "Capture POD"

### Task 3: View Detention Information

1. Go to job details: `/tms/jobs/{jobId}`
2. Click "Detention" tab
3. See all detention records:
   - Detention type (loading, unloading, border, terminal)
   - Detention days
   - Detention cost
   - Status (active, resolved, disputed)

### Task 4: Check Transit Times

1. Go to job details: `/tms/jobs/{jobId}`
2. Click "Transit" tab
3. See transit time segments:
   - Full route (POL to POD)
   - POL to border
   - Border to POD
   - Transit border
4. View delays and on-time status

### Task 5: View Lane Performance

1. Go to `/tms/lanes`
2. See all lanes with:
   - Average transit time
   - On-time delivery rate
   - Total jobs
   - Status (active/inactive)

### Task 6: Check Regulatory Status

1. Go to `/tms/regulatory`
2. Enter Bayan number
3. Click "Check Status"
4. See verification results

---

## 🎨 **UI Navigation**

### Main Menu Structure

```
TMS Module
├── Dashboard (/tms)
│   └── Overview and quick actions
│
├── Jobs (/tms/jobs)
│   ├── List all jobs
│   ├── Import CSV (/tms/jobs/import)
│   └── Job Details (/tms/jobs/:id)
│       ├── Overview tab
│       ├── POD tab
│       ├── Detention tab
│       └── Transit tab
│
├── Lanes (/tms/lanes)
│   └── Lane management and performance
│
├── Analytics (/tms/analytics)
│   ├── Overview tab
│   ├── Detention tab
│   └── Transit tab
│
├── Detention (/tms/detention)
│   └── Comprehensive detention tracking
│
└── Regulatory (/tms/regulatory)
    └── TGA, Daleeli, Bayan integration
```

---

## 🔍 **Troubleshooting**

### Issue: Can't see TMS in sidebar

**Solution:**
1. Refresh the page (Ctrl+F5 or Cmd+Shift+R)
2. Check if you're logged in
3. Verify module is enabled in settings
4. Try direct URL: `http://localhost:3000/tms`

### Issue: CSV import fails

**Solution:**
1. Check CSV file format (should be from Zoho export)
2. Verify file encoding (UTF-8)
3. Check for required fields (job name or job number)
4. Review error messages in import results

### Issue: Jobs not showing after import

**Solution:**
1. Check import results for errors
2. Verify tenant ID is "flex-logistics"
3. Check database connection
4. Try refreshing the jobs page

### Issue: POD capture not working

**Solution:**
1. Ensure job exists
2. Check browser permissions (GPS, camera)
3. Verify you're logged in
4. Check browser console for errors

---

## 📚 **Additional Resources**

### Documentation
- **Architecture:** `docs/ARCHITECTURE/TMS_ENHANCED_ARCHITECTURE.md`
- **Implementation:** `docs/TMS_IMPLEMENTATION_SUMMARY.md`
- **Quick Start:** `docs/TMS_QUICK_START.md`
- **Complete Features:** `docs/TMS_COMPLETE_FEATURE_LIST.md`
- **Integration:** `docs/TMS_FINAL_INTEGRATION.md`

### API Documentation
- **Jobs API:** `/api/tms/jobs`
- **POD API:** `/api/tms/jobs/:id/pod`
- **Detention API:** `/api/tms/jobs/:id/detention`
- **Transit Time API:** `/api/tms/jobs/:id/transit-time`
- **Regulatory API:** `/api/tms/regulatory/bayan/:bayanNumber`

### Support
- Check documentation files in `docs/` folder
- Review code examples in service files
- Check API endpoints for usage examples

---

## 🎯 **Next Steps**

### Immediate Actions
1. ✅ Import your Zoho CSV data
2. ✅ Review imported jobs
3. ✅ Test POD capture on a sample job
4. ✅ Check detention calculations
5. ✅ View transit time analytics

### Short Term
1. Set up detention alerts
2. Configure lane optimization
3. Integrate with regulatory systems (TGA, Daleeli, Bayan)
4. Set up notifications
5. Customize dashboards

### Long Term
1. Build custom reports
2. Set up automated workflows
3. Integrate with other BlueDXP modules
4. Configure advanced analytics
5. Set up mobile app access

---

## ✅ **Checklist**

Use this checklist to ensure everything is set up:

- [ ] TMS module accessible in sidebar
- [ ] Can access `/tms` dashboard
- [ ] Can access `/tms/jobs` page
- [ ] Can import CSV file
- [ ] Jobs appear after import
- [ ] Can view job details
- [ ] Can capture POD
- [ ] Detention calculations work
- [ ] Transit times are tracked
- [ ] Lanes are created automatically
- [ ] Analytics dashboard works
- [ ] Regulatory integration accessible

---

## 🎉 **You're Ready!**

The TMS module is fully operational and ready for use. Start by importing your data and exploring the features!

**Happy Transporting!** 🚛

---

**Last Updated:** 2024-12-22  
**Version:** 1.0.0  
**Status:** ✅ Production Ready


