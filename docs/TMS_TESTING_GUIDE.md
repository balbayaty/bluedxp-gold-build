# TMS Module - Testing Guide

## 🧪 Complete Testing Guide

This guide helps you test all TMS module features.

---

## 🎯 **Testing Scenarios**

### **Scenario 1: CSV Import**

#### Test Steps
1. Prepare a test CSV file with sample data
2. Navigate to `/tms/jobs/import`
3. Select the CSV file
4. Click "Import CSV"
5. Wait for import to complete

#### Expected Results
- ✅ Import completes successfully
- ✅ Jobs appear in jobs list
- ✅ All fields mapped correctly
- ✅ Lanes created automatically
- ✅ Detention calculated (if dates available)
- ✅ Transit times calculated (if dates available)

#### Test Data
Use the sample CSV structure from your Zoho export, or use minimal test data:
```csv
Job Name,Job Number,Job Type,Job Status,Customer,Transporter,Origin,Destination
Test Job 1,TEST-001,Cross Border,Pending,Test Customer,Test Transporter,Dammam,Muscat
```

---

### **Scenario 2: Job Creation**

#### Test Steps
1. Navigate to `/tms/jobs`
2. Use API to create a job:
   ```bash
   curl -X POST http://localhost:3000/api/tms/jobs \
     -H "Content-Type: application/json" \
     -d '{
       "tenantId": "flex-logistics",
       "createdBy": "test-user",
       "jobName": "Test Job",
       "jobNumber": "TEST-001",
       "jobType": "Cross Border",
       "origin": "Dammam",
       "destination": "Muscat"
     }'
   ```

#### Expected Results
- ✅ Job created successfully
- ✅ Job appears in jobs list
- ✅ Job details accessible
- ✅ Event published (`tms.job.created`)

---

### **Scenario 3: POD Capture**

#### Test Steps
1. Navigate to a job: `/tms/jobs/{jobId}`
2. Click "POD" tab
3. Fill in POD form:
   - Delivery date: Today
   - Delivery time: Current time
   - Consignee name: "Test Consignee"
   - Delivery status: "delivered"
4. Click "Capture GPS" (if available)
5. Click "Capture POD"

#### Expected Results
- ✅ POD saved successfully
- ✅ POD appears in job details
- ✅ GPS coordinates captured (if available)
- ✅ Event published (`tms.pod.created`)

---

### **Scenario 4: Detention Calculation**

#### Test Steps
1. Create or select a job with dates:
   - Shipper arrival: 2024-01-01 10:00
   - Shipper departure: 2024-01-02 14:00
   - Consignee arrival: 2024-01-03 10:00
   - Consignee departure: 2024-01-03 12:00
2. Navigate to job details
3. Click "Detention" tab
4. Or call API: `POST /api/tms/jobs/{jobId}/detention/calculate`

#### Expected Results
- ✅ Detention calculated automatically
- ✅ Loading detention: 1 day (if free time = 1 day)
- ✅ Unloading detention: 0 days (if free time = 1 day)
- ✅ Detention costs calculated
- ✅ Alerts generated (if thresholds exceeded)
- ✅ Event published (`tms.detention.created`)

---

### **Scenario 5: Transit Time Tracking**

#### Test Steps
1. Create or select a job with dates:
   - Shipper departure: 2024-01-01 10:00
   - Consignee arrival: 2024-01-03 14:00
2. Navigate to job details
3. Click "Transit" tab

#### Expected Results
- ✅ Transit time calculated: 52 hours
- ✅ Full route segment created
- ✅ Delay calculated (if planned time provided)
- ✅ On-time status determined

---

### **Scenario 6: Lane Management**

#### Test Steps
1. Import jobs with different origins/destinations
2. Navigate to `/tms/lanes`
3. View lane list

#### Expected Results
- ✅ Lanes created automatically from jobs
- ✅ Lane list displays
- ✅ Performance metrics calculated
- ✅ Lane details accessible

---

### **Scenario 7: Regulatory Integration**

#### Test Steps
1. Navigate to `/tms/regulatory`
2. Enter a Bayan number
3. Click "Check Status"

#### Expected Results
- ✅ Bayan status retrieved
- ✅ Status displayed
- ✅ Verification result shown

---

## 🔍 **API Testing**

### **Test All Endpoints**

```bash
# 1. List Jobs
curl "http://localhost:3000/api/tms/jobs?tenantId=flex-logistics"

# 2. Create Job
curl -X POST "http://localhost:3000/api/tms/jobs" \
  -H "Content-Type: application/json" \
  -d '{"tenantId":"flex-logistics","createdBy":"test","jobName":"Test","jobType":"Cross Border","origin":"Dammam","destination":"Muscat"}'

# 3. Get Job
curl "http://localhost:3000/api/tms/jobs/{jobId}?tenantId=flex-logistics"

# 4. Update Job
curl -X PUT "http://localhost:3000/api/tms/jobs/{jobId}" \
  -H "Content-Type: application/json" \
  -d '{"tenantId":"flex-logistics","updatedBy":"test","jobStatus":"In Transit"}'

# 5. Create POD
curl -X POST "http://localhost:3000/api/tms/jobs/{jobId}/pod" \
  -H "Content-Type: application/json" \
  -d '{"tenantId":"flex-logistics","createdBy":"test","deliveryDate":"2024-01-15","deliveryTime":"14:30","consigneeName":"Test","deliveryStatus":"delivered"}'

# 6. Get Detention
curl "http://localhost:3000/api/tms/jobs/{jobId}/detention?tenantId=flex-logistics"

# 7. Calculate Detention
curl -X POST "http://localhost:3000/api/tms/jobs/{jobId}/detention/calculate?tenantId=flex-logistics"

# 8. Get Transit Time
curl "http://localhost:3000/api/tms/jobs/{jobId}/transit-time?tenantId=flex-logistics"

# 9. Check Bayan
curl "http://localhost:3000/api/tms/regulatory/bayan/BAYAN123456"
```

---

## 🐛 **Error Testing**

### **Test Error Handling**

1. **Invalid CSV Import**
   - Upload invalid CSV
   - Should show error messages
   - Should report failed rows

2. **Missing Required Fields**
   - Create job without required fields
   - Should return validation error

3. **Invalid Job ID**
   - Access non-existent job
   - Should return 404

4. **Unauthorized Access**
   - Access without authentication
   - Should return 401

5. **Invalid Tenant**
   - Access with wrong tenant ID
   - Should return 403 or empty results

---

## 📊 **Performance Testing**

### **Load Testing**

1. **Large CSV Import**
   - Import CSV with 1000+ rows
   - Should complete in reasonable time
   - Should show progress

2. **Many Jobs**
   - Create 100+ jobs
   - List jobs with pagination
   - Should load quickly

3. **Complex Queries**
   - Filter jobs with multiple criteria
   - Should return results quickly

---

## ✅ **Test Checklist**

### **Functional Tests**
- [ ] CSV import works
- [ ] Job CRUD works
- [ ] POD capture works
- [ ] Detention calculation works
- [ ] Transit time tracking works
- [ ] Lane management works
- [ ] Analytics display correctly
- [ ] Regulatory checks work

### **Integration Tests**
- [ ] Database operations work
- [ ] Event publishing works
- [ ] Event subscription works
- [ ] Cross-module communication works

### **Security Tests**
- [ ] Authentication required
- [ ] Authorization enforced
- [ ] Tenant isolation works
- [ ] Input validation works

### **Performance Tests**
- [ ] Page loads quickly
- [ ] API responds quickly
- [ ] Large imports work
- [ ] No memory leaks

---

## 🎯 **Test Data**

### **Sample Job Data**

Use `data/tms/sampleJobs.ts` for test data, or create your own:

```typescript
{
  jobName: "Test Job",
  jobNumber: "TEST-001",
  jobType: "Cross Border",
  origin: "Dammam",
  destination: "Muscat",
  // ... other fields
}
```

---

## 📝 **Test Results Template**

### **Test Report**

```
Test Date: [Date]
Tester: [Name]
Environment: [Development/Staging/Production]

Results:
- CSV Import: ✅ Pass / ❌ Fail
- Job Management: ✅ Pass / ❌ Fail
- POD Capture: ✅ Pass / ❌ Fail
- Detention: ✅ Pass / ❌ Fail
- Transit Time: ✅ Pass / ❌ Fail
- Lanes: ✅ Pass / ❌ Fail
- Regulatory: ✅ Pass / ❌ Fail

Issues Found:
- [List any issues]

Notes:
- [Any additional notes]
```

---

## 🎉 **Testing Complete**

Once all tests pass, the TMS module is ready for production use!

---

**Last Updated:** 2024-12-22  
**Status:** ✅ Testing Guide Complete


