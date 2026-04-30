# 📖 WMS Module - User Guide
## Complete User Documentation

**Version:** 1.0.0  
**Last Updated:** December 2024

---

## 🎯 OVERVIEW

The WMS (Warehouse Management System) module now includes **automatic AI-powered photo analysis** and **real-time SLA tracking**. This guide explains how to use these features.

---

## 📸 PHOTO UPLOAD WITH AUTO-ANALYSIS

### How It Works

When you upload a photo to an ASN, Pallet, or Damage record:

1. **Photo Uploads** → File is stored securely
2. **AI Vision Analyzes** → Automatically analyzes the photo
3. **Evidence Created** → Creates evidence record for liability
4. **Lifecycle Linked** → Links to process stage
5. **Liability Assessed** → Automatically assesses liability (if damage)

**All of this happens automatically!** No manual steps required.

### Uploading Photos

#### In ASN Details

1. Navigate to **Inbound Operations** → Select an ASN
2. In the **Overview** tab, find the **Photos & Documents** section
3. Click on the photo type you want to upload:
   - **Truck Photo** - Upload truck/vehicle photo
   - **Driver License** - Upload driver license photo
   - **Paperwork** - Upload truck paperwork
4. Select your photo file
5. Wait for upload and analysis (shown in status indicators)

#### Status Indicators

- **Uploading...** - Photo is being uploaded
- **Analyzing with AI...** - AI Vision is analyzing
- **Creating evidence...** - Evidence record is being created
- **Assessing liability...** - Liability is being assessed (damage only)
- **✅ AI Analyzed** - Analysis complete
- **✅ Evidence created** - Evidence record created

### Viewing Analysis Results

After upload, you'll see:
- **Green badge** - "AI Analyzed" on the photo
- **Evidence status** - "Evidence created" below photo
- **Analysis details** - Expandable section with AI insights

---

## 📊 SLA & KPI TRACKING

### Real-Time SLA Monitoring

The system automatically monitors:
- **ASN Processing Time** - Time from receipt to goods receipt
- **Picking Efficiency** - On-time picking completion
- **Putaway Efficiency** - On-time putaway completion
- **Cycle Count Accuracy** - Inventory count accuracy

### SLA Warnings

You'll receive warnings when:
- **80% of time used** - Stage is taking longer than expected
- **SLA at risk** - May breach SLA target

### SLA Violations

Violations are detected when:
- **Target duration exceeded** - Stage took longer than SLA target
- **Automatic escalation** - Managers notified automatically

### Viewing SLA Status

1. Navigate to **ASN Details** → **Compliance** tab
2. View **SLA Compliance Dashboard**
3. See:
   - Overall compliance percentage
   - Individual SLA status
   - Violations and warnings
   - Trends and recommendations

---

## 🎯 KPI DASHBOARD

### Available KPIs

1. **Picking Efficiency**
   - Target: 95%
   - Shows: On-time completion rate

2. **Putaway Efficiency**
   - Target: 90%
   - Shows: On-time completion rate

3. **ASN Processing Time**
   - Target: 4 hours
   - Shows: Average processing time

4. **Picking Accuracy**
   - Target: 99.5%
   - Shows: Accuracy rate

5. **Cycle Count Accuracy**
   - Target: 99%
   - Shows: Count accuracy

### Viewing KPIs

1. Navigate to **ASN Details** → **Compliance** tab
2. Scroll to **KPI Dashboard**
3. View:
   - Current values
   - Targets
   - Trends
   - Status (on target / at risk / below target)

---

## 🔍 EVIDENCE TRACKING

### Automatic Evidence Creation

When you upload a photo:
- **Evidence record** is automatically created
- **Hash verification** ensures integrity
- **Lifecycle linking** tracks process stage
- **Full audit trail** maintained

### Viewing Evidence

1. Navigate to **ASN Details** → **Overview** tab
2. Find uploaded photos
3. Look for **"Evidence created"** indicator
4. Evidence is automatically linked to lifecycle stage

### Evidence Integrity

- **Hash verification** - Ensures photo hasn't been tampered with
- **Chain of custody** - Tracks who uploaded and when
- **Liability protection** - Full evidence trail for disputes

---

## ⚠️ TROUBLESHOOTING

### Photo Upload Issues

**Problem:** Photo upload fails  
**Solution:**
- Check file size (max 10MB recommended)
- Check file format (JPG, PNG supported)
- Check internet connection
- Try again - system will retry automatically

**Problem:** AI analysis not showing  
**Solution:**
- Wait a few seconds - analysis runs in background
- Check status indicator - should show "Analyzing with AI..."
- Refresh page if analysis doesn't appear after 30 seconds
- Contact support if issue persists

### SLA Tracking Issues

**Problem:** SLA violations not detected  
**Solution:**
- Verify lifecycle stages are configured
- Check SLA rules are set correctly
- Ensure real-time monitoring is active
- Contact support if monitoring not working

**Problem:** KPI values seem incorrect  
**Solution:**
- Verify data is being collected
- Check time range for calculations
- Ensure tasks are being completed properly
- Contact support if values don't match expectations

---

## 💡 BEST PRACTICES

### Photo Upload

1. **Take clear photos** - Better AI analysis results
2. **Upload immediately** - Evidence created right away
3. **Include context** - Photos with context analyzed better
4. **Multiple angles** - For damage, upload multiple photos

### SLA Compliance

1. **Monitor regularly** - Check compliance dashboard daily
2. **Address warnings** - Act on 80% warnings to prevent violations
3. **Review violations** - Understand root causes
4. **Optimize processes** - Use insights to improve

### KPI Management

1. **Track trends** - Monitor KPI trends over time
2. **Set targets** - Adjust targets based on capabilities
3. **Take action** - Act on below-target KPIs
4. **Celebrate success** - Recognize when targets are met

---

## 📞 SUPPORT

### Getting Help

- **In-App Help** - Click help icon in top right
- **Documentation** - See full documentation
- **Support Team** - Contact support@example.com
- **Emergency** - Call support hotline

### Reporting Issues

When reporting issues, include:
- **Screenshot** - Of the issue
- **Steps to reproduce** - What you did
- **Expected vs Actual** - What should happen vs what happened
- **Error messages** - Any error messages shown

---

## 🎓 TRAINING RESOURCES

### Video Tutorials
- Photo Upload with Auto-Analysis
- Understanding SLA Tracking
- KPI Dashboard Overview
- Evidence Management

### Documentation
- Complete API Documentation
- Integration Guide
- Best Practices Guide
- Troubleshooting Guide

---

**Version:** 1.0.0  
**Last Updated:** December 2024  
**For Support:** support@example.com


