# 🧪 WMS Module - Testing Guide
## Complete Testing Checklist & Procedures

**Version:** 1.0.0  
**Last Updated:** December 2024

---

## 🎯 TESTING OVERVIEW

This guide provides comprehensive testing procedures for all WMS module enhancements, ensuring everything works correctly before production deployment.

---

## ✅ PRE-TESTING CHECKLIST

### Environment Setup
- [ ] Development environment running
- [ ] Database connected and migrated
- [ ] AI Vision API keys configured
- [ ] Evidence service accessible
- [ ] Lifecycle service initialized
- [ ] Event bus operational

### Test Data
- [ ] Test ASN created
- [ ] Test pallets available
- [ ] Test damage records available
- [ ] Test photos ready for upload

---

## 📸 PHOTO UPLOAD TESTING

### Test Case 1: Basic Photo Upload
**Objective:** Verify photo uploads successfully

**Steps:**
1. Navigate to Inbound Operations
2. Select an ASN
3. Click "Upload Photo" for Truck Photo
4. Select a test image file
5. Wait for upload to complete

**Expected Results:**
- ✅ Photo uploads successfully
- ✅ File URL returned
- ✅ Photo displays in UI
- ✅ No errors in console

**Pass Criteria:** All expected results met

---

### Test Case 2: Auto AI Vision Analysis
**Objective:** Verify AI Vision analysis triggers automatically

**Steps:**
1. Upload a photo (as in Test Case 1)
2. Wait 10-30 seconds
3. Check for analysis results

**Expected Results:**
- ✅ Status shows "Analyzing with AI..."
- ✅ Analysis completes automatically
- ✅ "AI Analyzed" badge appears on photo
- ✅ Analysis results stored

**Pass Criteria:** Analysis completes automatically without manual trigger

---

### Test Case 3: Auto Evidence Creation
**Objective:** Verify Evidence record created automatically

**Steps:**
1. Upload a photo
2. Wait for analysis to complete
3. Check Evidence service

**Expected Results:**
- ✅ Evidence record created
- ✅ Hash generated and stored
- ✅ Linked to ASN entity
- ✅ Metadata includes vision analysis
- ✅ "Evidence created" indicator shown

**Pass Criteria:** Evidence record exists with correct data

---

### Test Case 4: Auto Lifecycle Linking
**Objective:** Verify photo linked to lifecycle stage

**Steps:**
1. Upload photo to ASN with active lifecycle
2. Check lifecycle service
3. Verify evidence attached to current stage

**Expected Results:**
- ✅ Evidence linked to lifecycle stage
- ✅ Stage shows evidence in evidence list
- ✅ Lifecycle updated with evidence reference

**Pass Criteria:** Evidence appears in lifecycle stage

---

### Test Case 5: Auto Liability Assessment (Damage)
**Objective:** Verify liability assessed for damage photos

**Steps:**
1. Upload photo to damage record
2. Include damage context (type, severity, value)
3. Wait for assessment

**Expected Results:**
- ✅ Liability assessment triggered
- ✅ Assessment results stored
- ✅ Liability events published
- ✅ Results available in damage record

**Pass Criteria:** Liability assessment completes automatically

---

### Test Case 6: Error Handling
**Objective:** Verify graceful error handling

**Steps:**
1. Try uploading invalid file (non-image)
2. Try uploading very large file (>10MB)
3. Try uploading with network disconnected
4. Try uploading with invalid entity ID

**Expected Results:**
- ✅ Appropriate error messages shown
- ✅ No system crashes
- ✅ User can retry
- ✅ Errors logged properly

**Pass Criteria:** All errors handled gracefully

---

## 📊 SLA/KPI TESTING

### Test Case 7: Real Data KPI Calculations
**Objective:** Verify KPIs use real data, not mocks

**Steps:**
1. Create test picking tasks
2. Complete some tasks on-time, some late
3. Check KPI dashboard
4. Verify calculations match actual data

**Expected Results:**
- ✅ Picking Efficiency calculated from real tasks
- ✅ Values match actual completion rates
- ✅ No hardcoded/mock values
- ✅ Calculations update with new data

**Pass Criteria:** All KPIs use real database data

---

### Test Case 8: Real-Time SLA Monitoring
**Objective:** Verify real-time SLA tracking works

**Steps:**
1. Start a lifecycle stage
2. Wait for monitoring cycle (60 seconds)
3. Check for warnings at 80% threshold
4. Wait for SLA breach
5. Check for violation detection

**Expected Results:**
- ✅ Monitoring active (check logs)
- ✅ Warning triggered at 80%
- ✅ Violation detected when breached
- ✅ Events published
- ✅ Database records created

**Pass Criteria:** Real-time monitoring detects violations

---

### Test Case 9: SLA Warning System
**Objective:** Verify 80% warning threshold works

**Steps:**
1. Create lifecycle stage with 10-minute SLA
2. Wait 8 minutes (80% of time)
3. Check for warning

**Expected Results:**
- ✅ Warning triggered at 80%
- ✅ Warning event published
- ✅ Warning stored in database
- ✅ UI shows warning indicator

**Pass Criteria:** Warnings trigger correctly

---

### Test Case 10: SLA Violation Detection
**Objective:** Verify violations detected correctly

**Steps:**
1. Create lifecycle stage with 5-minute SLA
2. Wait 6 minutes (breach)
3. Check for violation

**Expected Results:**
- ✅ Violation detected
- ✅ Violation event published
- ✅ Violation stored in database
- ✅ Escalation triggered (if configured)
- ✅ UI shows violation indicator

**Pass Criteria:** Violations detected and handled

---

## 🔗 INTEGRATION TESTING

### Test Case 11: Event Bus Integration
**Objective:** Verify events published correctly

**Steps:**
1. Upload photo
2. Check event bus for events
3. Verify all expected events published

**Expected Results:**
- ✅ `photo.uploaded` event published
- ✅ `photo.analyzed` event published (if analysis succeeds)
- ✅ `evidence.created` event published
- ✅ `sla.violation` event published (if violation)
- ✅ Events contain correct data

**Pass Criteria:** All events published with correct data

---

### Test Case 12: Cross-Module Integration
**Objective:** Verify integration with other modules

**Steps:**
1. Upload photo in WMS
2. Check Evidence module for record
3. Check Lifecycle module for link
4. Check Liability module for assessment

**Expected Results:**
- ✅ Evidence visible in Evidence module
- ✅ Lifecycle shows evidence link
- ✅ Liability shows assessment (if damage)
- ✅ All modules updated correctly

**Pass Criteria:** All modules show correct data

---

## 🎯 PERFORMANCE TESTING

### Test Case 13: Photo Upload Performance
**Objective:** Verify upload doesn't block UI

**Steps:**
1. Upload large photo (5MB)
2. Try to interact with UI during upload
3. Check upload happens in background

**Expected Results:**
- ✅ UI remains responsive
- ✅ Upload happens in background
- ✅ User can continue working
- ✅ Status indicators show progress

**Pass Criteria:** Non-blocking upload confirmed

---

### Test Case 14: Concurrent Uploads
**Objective:** Verify multiple uploads work

**Steps:**
1. Upload 3 photos simultaneously
2. Check all complete successfully
3. Verify all analyzed correctly

**Expected Results:**
- ✅ All uploads complete
- ✅ All analyzed correctly
- ✅ No conflicts or errors
- ✅ All evidence created

**Pass Criteria:** Concurrent uploads work correctly

---

## 🔐 SECURITY TESTING

### Test Case 15: Tenant Isolation
**Objective:** Verify tenant data isolation

**Steps:**
1. Upload photo as Tenant A
2. Try to access as Tenant B
3. Verify isolation

**Expected Results:**
- ✅ Tenant A can see their photos
- ✅ Tenant B cannot see Tenant A photos
- ✅ Evidence records isolated
- ✅ No data leakage

**Pass Criteria:** Tenant isolation enforced

---

### Test Case 16: File Validation
**Objective:** Verify file validation works

**Steps:**
1. Try uploading non-image file
2. Try uploading malicious file
3. Try uploading oversized file

**Expected Results:**
- ✅ Invalid files rejected
- ✅ Appropriate error messages
- ✅ No security vulnerabilities
- ✅ System remains secure

**Pass Criteria:** File validation works correctly

---

## 📋 TEST EXECUTION CHECKLIST

### Photo Upload Tests
- [ ] Test Case 1: Basic Photo Upload
- [ ] Test Case 2: Auto AI Vision Analysis
- [ ] Test Case 3: Auto Evidence Creation
- [ ] Test Case 4: Auto Lifecycle Linking
- [ ] Test Case 5: Auto Liability Assessment
- [ ] Test Case 6: Error Handling

### SLA/KPI Tests
- [ ] Test Case 7: Real Data KPI Calculations
- [ ] Test Case 8: Real-Time SLA Monitoring
- [ ] Test Case 9: SLA Warning System
- [ ] Test Case 10: SLA Violation Detection

### Integration Tests
- [ ] Test Case 11: Event Bus Integration
- [ ] Test Case 12: Cross-Module Integration

### Performance Tests
- [ ] Test Case 13: Photo Upload Performance
- [ ] Test Case 14: Concurrent Uploads

### Security Tests
- [ ] Test Case 15: Tenant Isolation
- [ ] Test Case 16: File Validation

---

## 📊 TEST RESULTS TEMPLATE

### Test Execution Log
```
Date: ___________
Tester: ___________
Environment: ___________

Test Case | Status | Notes
----------|--------|------
1. Basic Upload | ✅/❌ | 
2. AI Analysis | ✅/❌ |
3. Evidence | ✅/❌ |
... | ... | ...

Overall Result: ✅ PASS / ❌ FAIL
```

---

## 🐛 KNOWN ISSUES

**None** - All issues resolved

---

## ✅ SIGN-OFF

**Testing Completed By:** _________________  
**Date:** _________________  
**Result:** ✅ PASS / ❌ FAIL  
**Notes:** _________________

---

**Version:** 1.0.0  
**Last Updated:** December 2024


