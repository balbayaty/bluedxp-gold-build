# 🔧 WMS Module - Troubleshooting Guide
## Common Issues & Solutions

**Version:** 1.0.0  
**Last Updated:** December 2024

---

## 🚨 COMMON ISSUES

### Issue 1: Photo Upload Fails

**Symptoms:**
- Photo doesn't upload
- Error message appears
- Upload button doesn't work

**Possible Causes:**
1. File too large (>10MB)
2. Invalid file format (not image)
3. Network connection issue
4. File storage service down

**Solutions:**
1. **Check file size:** Reduce image size or compress
2. **Check file format:** Use JPG, PNG, or WebP
3. **Check network:** Verify internet connection
4. **Check storage:** Verify file storage service is running
5. **Retry:** Try uploading again
6. **Check console:** Look for error messages in browser console

**Prevention:**
- Validate file size before upload
- Show clear error messages
- Provide file format guidance

---

### Issue 2: AI Vision Analysis Not Appearing

**Symptoms:**
- Photo uploads successfully
- No analysis results shown
- Status shows "Analyzing..." but never completes

**Possible Causes:**
1. AI Vision API key missing/invalid
2. API quota exceeded
3. Analysis still processing (background)
4. Network timeout

**Solutions:**
1. **Check API keys:** Verify OPENAI_API_KEY or ANTHROPIC_API_KEY set
2. **Check quota:** Verify API quota not exceeded
3. **Wait longer:** Analysis runs in background (10-30 seconds)
4. **Refresh page:** Results may appear after refresh
5. **Check logs:** Look for analysis errors in server logs
6. **Check evidence:** Analysis results stored in evidence record

**Prevention:**
- Monitor API quotas
- Set up alerts for API failures
- Provide clear status indicators

---

### Issue 3: Evidence Not Created

**Symptoms:**
- Photo uploads and analyzes
- No evidence record created
- "Evidence created" indicator not shown

**Possible Causes:**
1. Evidence service unavailable
2. Database connection issue
3. Permission/authorization issue
4. Error in evidence creation

**Solutions:**
1. **Check evidence service:** Verify service is running
2. **Check database:** Verify database connection
3. **Check permissions:** Verify user has create evidence permission
4. **Check logs:** Look for evidence creation errors
5. **Manual check:** Verify evidence in Evidence module

**Prevention:**
- Health checks for evidence service
- Proper error handling
- User feedback on failures

---

### Issue 4: SLA Violations Not Detected

**Symptoms:**
- Lifecycle stages exceed SLA
- No violations detected
- No warnings shown

**Possible Causes:**
1. Real-time monitoring not started
2. SLA rules not configured
3. Lifecycle not initialized
4. Monitoring interval too long

**Solutions:**
1. **Check monitoring:** Verify real-time service started
   ```typescript
   // Check logs for: "Real-time SLA monitoring started"
   ```
2. **Check SLA rules:** Verify SLA rules configured in lifecycle
3. **Check lifecycle:** Verify lifecycle initialized for entity
4. **Check interval:** Monitoring runs every 60 seconds
5. **Manual check:** Check violations in database

**Prevention:**
- Auto-start monitoring in production
- Verify SLA rules during setup
- Health checks for monitoring service

---

### Issue 5: KPI Values Seem Incorrect

**Symptoms:**
- KPI values don't match expectations
- Values seem too high/low
- Values don't change with new data

**Possible Causes:**
1. Still using mock data (shouldn't happen)
2. Data not being collected
3. Calculation errors
4. Time range issues

**Solutions:**
1. **Verify real data:** Check if calculations use database queries
2. **Check data collection:** Verify tasks/events being recorded
3. **Check calculations:** Review calculation logic
4. **Check time range:** Verify correct time period
5. **Check cache:** Clear KPI cache if exists

**Prevention:**
- Regular data validation
- Monitor calculation accuracy
- Clear documentation of formulas

---

### Issue 6: Photo Analysis Takes Too Long

**Symptoms:**
- Analysis takes >30 seconds
- UI feels slow
- User waits too long

**Possible Causes:**
1. Large image file
2. AI API slow response
3. Network latency
4. Server overload

**Solutions:**
1. **Optimize images:** Compress before upload
2. **Check API status:** Verify AI service status
3. **Check network:** Verify network connection
4. **Background processing:** Analysis runs in background (non-blocking)
5. **Show progress:** Status indicators show progress

**Prevention:**
- Image optimization before upload
- Background processing (already implemented)
- Clear status indicators

---

### Issue 7: Events Not Publishing

**Symptoms:**
- Photo uploaded but no events
- Other modules not receiving updates
- Event handlers not triggered

**Possible Causes:**
1. Event bus not initialized
2. Event handlers not registered
3. Event publishing failed
4. Network/connection issue

**Solutions:**
1. **Check event bus:** Verify event bus service running
2. **Check handlers:** Verify handlers registered
3. **Check logs:** Look for event publishing errors
4. **Test events:** Manually trigger event to test
5. **Check integration:** Verify event bus integration

**Prevention:**
- Auto-initialize event handlers
- Health checks for event bus
- Event publishing retry logic

---

## 🔍 DEBUGGING STEPS

### Step 1: Check Browser Console
```javascript
// Open browser DevTools (F12)
// Check Console tab for errors
// Look for:
// - Photo upload errors
// - API call failures
// - Network errors
```

### Step 2: Check Server Logs
```bash
# Check application logs
# Look for:
# - Photo upload logs
# - AI Vision analysis logs
# - Evidence creation logs
# - SLA monitoring logs
```

### Step 3: Check Database
```sql
-- Check evidence records
SELECT * FROM "EvidenceItem" WHERE entity_id = 'your-entity-id';

-- Check SLA violations
SELECT * FROM "SlaViolation" WHERE entity_id = 'your-entity-id';

-- Check lifecycle stages
SELECT * FROM "Lifecycle" WHERE entity_id = 'your-entity-id';
```

### Step 4: Check API Endpoints
```bash
# Test photo upload API
curl -X POST /api/storage/files/upload \
  -F "file=@test.jpg" \
  -F "entityType=ASN" \
  -F "entityId=test-id"

# Test AI Vision API
curl -X POST /api/ai/vision/v2/analyze \
  -F "image=@test.jpg" \
  -F "module=wms"
```

---

## 🛠️ TOOLS & UTILITIES

### Health Check Endpoints
```typescript
// Photo Upload Health
GET /api/health/photo-upload

// AI Vision Health
GET /api/health/ai-vision

// SLA Tracking Health
GET /api/health/sla-tracking

// Evidence Service Health
GET /api/health/evidence
```

### Debug Mode
```typescript
// Enable debug logging
localStorage.setItem('wms-debug', 'true')

// Check debug logs in console
```

---

## 📞 ESCALATION

### Level 1: User Self-Service
- Check this troubleshooting guide
- Review user guide
- Try common solutions

### Level 2: Support Team
- Check logs
- Verify configuration
- Test functionality

### Level 3: Development Team
- Code-level debugging
- System architecture review
- Performance optimization

---

## ✅ PREVENTION CHECKLIST

### Regular Maintenance
- [ ] Monitor API quotas
- [ ] Check service health
- [ ] Review error logs
- [ ] Verify data accuracy
- [ ] Test integrations

### Proactive Monitoring
- [ ] Photo upload success rate
- [ ] AI analysis success rate
- [ ] Evidence creation rate
- [ ] SLA violation rate
- [ ] Event publishing rate

---

## 📚 RELATED DOCUMENTATION

- **User Guide:** `WMS_USER_GUIDE.md`
- **Deployment Guide:** `WMS_PRODUCTION_DEPLOYMENT_GUIDE.md`
- **Implementation Guide:** `WMS_CRITICAL_FIXES_IMPLEMENTATION_GUIDE.md`

---

**Version:** 1.0.0  
**Last Updated:** December 2024


