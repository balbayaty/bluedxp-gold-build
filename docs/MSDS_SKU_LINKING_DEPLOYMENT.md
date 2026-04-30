# MSDS-SKU Linking - Deployment Guide

## Pre-Deployment Checklist

### 1. Database Migration ✅

**Required:** Run the MSDS-SKU linking database migration:

```bash
# PostgreSQL
psql -d your_database -f lib/database/migrations/001_msds_sku_linking.sql

# Or via psql command line
psql your_database
\i lib/database/migrations/001_msds_sku_linking.sql
```

**Verify Tables Created:**
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('msds_sku_links', 'customer_approval_requests', 'matching_history', 'data_reuse_tracking');

-- Check indexes
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('msds_sku_links', 'customer_approval_requests');
```

### 2. Environment Variables

Add to your `.env.local` or production environment:

```env
# MSDS-SKU Linking (Core - Required)
# No additional env vars needed for basic functionality

# WhatsApp Integration (Optional)
WHATSAPP_ENABLED=false
WHATSAPP_PROVIDER=META_CLOUD_API
WHATSAPP_API_KEY=your_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_secure_token
```

### 3. Service Initialization

**Already Configured!** Event handlers are automatically initialized on app startup via:
- `lib/services/integration/serviceInitializer.ts`

**Verify Initialization:**
Check server logs for:
```
✅ MSDS-SKU linking event handlers initialized
```

### 4. Build Verification

```bash
# Build the application
npm run build

# Should complete without errors related to MSDS-SKU linking
```

### 5. API Routes Verification

All routes are automatically available:
- `/api/msds-sku-linking/links` - Link management
- `/api/msds-sku-linking/links/[id]` - Link operations
- `/api/msds-sku-linking/matches` - Matching
- `/api/msds-sku-linking/bulk` - Bulk operations
- `/api/customer-portal/approve` - Customer approval
- `/api/customer-portal/approval-request` - Create approval
- `/api/whatsapp/send` - WhatsApp messaging (if enabled)
- `/api/whatsapp/webhook` - WhatsApp webhook (if enabled)

## Post-Deployment Verification

### 1. Test Link Creation

```bash
# Create a test link
curl -X POST http://your-domain/api/msds-sku-linking/links \
  -H "Content-Type: application/json" \
  -d '{
    "msdsId": "test-msds-1",
    "skuId": "test-sku-1",
    "customerId": "test-customer-1"
  }'
```

### 2. Test Customer Portal

1. Create approval request via API
2. Get approval token from response
3. Visit: `https://your-domain/customer-portal/approve?token={token}`
4. Verify approval interface loads

### 3. Test Matching

```bash
# Test matching service
curl -X POST http://your-domain/api/msds-sku-linking/matches \
  -H "Content-Type: application/json" \
  -d '{
    "msdsId": "test-msds-1",
    "customerId": "test-customer-1"
  }'
```

### 4. Verify UI Pages

- ✅ `/msds-sku-linking` - Main management page
- ✅ `/msds-sku-linking/bulk` - Bulk operations
- ✅ `/msds-sku-linking/analytics` - Analytics dashboard
- ✅ `/customer-portal/approve` - Customer approval (with token)
- ✅ `/skus` - Should show MSDS linking integration

### 5. Test Integration Points

**SKU Page Integration:**
1. Go to `/skus`
2. Click on any SKU to view details
3. Verify "MSDS Links" section appears
4. Test "Link to MSDS" button
5. Verify matching suggestions appear

**Event Handlers:**
1. Approve an MSDS → Should trigger matching suggestions
2. Approve a link → Should trigger data reuse
3. Create a SKU → Should trigger MSDS matching

## Production Considerations

### 1. Database Performance

**Indexes Created:**
- ✅ `idx_msds_sku_links_msds` - Fast MSDS lookups
- ✅ `idx_msds_sku_links_sku` - Fast SKU lookups
- ✅ `idx_msds_sku_links_customer` - Fast customer filtering
- ✅ `idx_msds_sku_links_status` - Fast status filtering

**Query Optimization:**
- Links are paginated (default 50 per page)
- Use filters to reduce result sets
- Consider adding composite indexes for common queries

### 2. WhatsApp Integration

**If Using WhatsApp:**
1. Configure webhook URL in Meta/Twilio console
2. Set webhook URL: `https://your-domain/api/whatsapp/webhook`
3. Verify webhook token matches `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
4. Test sending approval link via WhatsApp

### 3. Customer Portal Security

**Security Features:**
- ✅ Token-based authentication
- ✅ Token expiration (72 hours default)
- ✅ HTTPS required for production
- ✅ No sensitive data in URLs

**Recommendations:**
- Use strong, random tokens
- Rotate tokens regularly
- Monitor approval request usage
- Set up rate limiting on approval endpoints

### 4. Data Reuse Performance

**Optimization:**
- Data reuse runs automatically on link approval
- Can be disabled per link if needed
- Consider batch processing for bulk operations
- Monitor data reuse execution time

### 5. Matching Performance

**Current Implementation:**
- In-memory matching (fast for small datasets)
- Consider caching for large SKU lists
- AI/ML matching can be added later

**Future Optimization:**
- Database-backed matching history
- Cached synonym databases
- Pre-computed similarity scores

## Monitoring

### Key Metrics to Monitor

1. **Link Creation Rate**
   - Track links created per day
   - Monitor by matching strategy

2. **Approval Rate**
   - Track approval vs rejection ratio
   - Monitor approval time

3. **Matching Accuracy**
   - Track confidence scores
   - Monitor false positives/negatives

4. **Data Reuse Effectiveness**
   - Track fields reused
   - Monitor time saved

5. **Customer Portal Usage**
   - Track approval requests
   - Monitor response time

### Logging

All services log important events:
- Link creation/updates
- Approval requests
- Matching operations
- Data reuse operations
- Errors and warnings

Check logs for:
```
[msds-sku-linking] Link created: link-123
[msds-sku-linking] Link approved: link-123
[msds-sku-linking] Data reused for SKU: sku-456
```

## Troubleshooting

### Issue: Links not appearing

**Check:**
1. Database connection
2. Migration ran successfully
3. Service initialized
4. API routes accessible

### Issue: Matching not working

**Check:**
1. MSDS and SKU data available
2. Customer ID provided
3. Matching service initialized
4. Check browser console for errors

### Issue: Customer portal not loading

**Check:**
1. Token is valid and not expired
2. HTTPS enabled (required for production)
3. API route accessible
4. Check network tab for API errors

### Issue: WhatsApp not sending

**Check:**
1. `WHATSAPP_ENABLED=true`
2. All WhatsApp env vars set
3. API credentials valid
4. Phone number format (E.164)
5. Check WhatsApp service logs

## Rollback Plan

If issues occur:

1. **Disable Feature:**
   - Remove from navigation menu
   - API routes still accessible but unused

2. **Database Rollback:**
   ```sql
   -- Drop tables (if needed)
   DROP TABLE IF EXISTS data_reuse_tracking;
   DROP TABLE IF EXISTS matching_history;
   DROP TABLE IF EXISTS customer_approval_requests;
   DROP TABLE IF EXISTS msds_sku_links;
   ```

3. **Code Rollback:**
   - Revert to previous commit
   - Or comment out feature flags

## Success Criteria

✅ All database tables created
✅ All API routes accessible
✅ UI pages load correctly
✅ Link creation works
✅ Customer portal works
✅ Matching suggestions appear
✅ Data reuse triggers on approval
✅ Event handlers initialize
✅ No build errors
✅ No runtime errors

## Support

For issues:
1. Check server logs
2. Check browser console
3. Verify database connection
4. Test API routes directly
5. Review error messages

---

**Deployment Status: ✅ READY**

All components are production-ready and fully tested!











