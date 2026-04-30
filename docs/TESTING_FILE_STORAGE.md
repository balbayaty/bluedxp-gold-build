# 🧪 Testing Unified File Storage

## Quick Test Guide

### Option 1: Run Test Script (Recommended)

```bash
npm run test:file-storage
```

This will:
- ✅ Check storage provider configuration
- ✅ Test service initialization
- ✅ Upload a test file
- ✅ Download the test file
- ✅ Test presigned URLs
- ✅ Test file search
- ✅ Test deduplication

### Option 2: Test via API Endpoint

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Open browser or use curl:**
   ```bash
   # Browser
   http://localhost:3002/api/storage/test

   # Or curl
   curl http://localhost:3002/api/storage/test
   ```

   This will return a JSON response with test results.

### Option 3: Manual Test via API

1. **Upload a file:**
   ```bash
   curl -X POST http://localhost:3002/api/storage/files/upload \
     -H "x-tenant-id: test-tenant" \
     -H "x-user-id: test-user" \
     -F "file=@test.pdf" \
     -F "module=test" \
     -F "entityType=test" \
     -F "entityId=test-1"
   ```

2. **Get file URL:**
   ```bash
   curl "http://localhost:3002/api/storage/files/url?fileId=YOUR_FILE_ID" \
     -H "x-tenant-id: test-tenant"
   ```

3. **Search files:**
   ```bash
   curl "http://localhost:3002/api/storage/files/search?module=test" \
     -H "x-tenant-id: test-tenant"
   ```

---

## Prerequisites

### 1. Storage Provider Configuration

**For MinIO (Recommended):**
```bash
# In .env or .env.local
STORAGE_PROVIDER=minio
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
```

**Start MinIO:**
```bash
docker-compose up -d minio
```

**For AWS S3:**
```bash
STORAGE_PROVIDER=s3
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=me-south-1
```

### 2. Database (Optional but Recommended)

For full features (deduplication, search, analytics), you need a database:

```bash
# Run migration
psql $DATABASE_URL -f lib/database/migrations/005_unified_file_storage.sql

# Or if using Prisma
npx prisma db push
```

**Note:** The system works without a database, but some features (deduplication, search) will be limited.

---

## Expected Results

### ✅ Success Indicators

1. **Storage Provider Check:**
   ```
   ✅ Storage Provider: MINIO
   ✅ Storage adapter is available
   ```

2. **Service Initialization:**
   ```
   ✅ Service initialized successfully
   ```

3. **File Upload:**
   ```
   ✅ File uploaded successfully!
   File ID: file-1234567890-abc123
   Storage URL: http://localhost:9000/...
   ```

4. **File Download:**
   ```
   ✅ File downloaded successfully!
   Content matches: This is a test file...
   ```

### ⚠️ Warnings (OK)

- "Presigned URL generation failed" - OK if storage provider doesn't support it
- "File search failed" - OK if database not configured
- "Deduplication test failed" - OK if database not configured

### ❌ Errors (Need Fixing)

1. **Storage Provider Not Available:**
   ```
   ❌ Storage provider check failed: MinIO client not initialized
   ```
   **Fix:** Check MinIO is running: `docker-compose ps minio`

2. **Service Initialization Failed:**
   ```
   ❌ Service initialization failed: Connection refused
   ```
   **Fix:** Check storage service is running and credentials are correct

3. **File Upload Failed:**
   ```
   ❌ File upload failed: Access denied
   ```
   **Fix:** Check storage credentials and permissions

---

## Troubleshooting

### Problem: "Storage adapter not available"

**Solutions:**
1. Check `STORAGE_PROVIDER` is set in `.env`
2. Verify storage service is running:
   ```bash
   # MinIO
   docker-compose ps minio
   
   # Or check manually
   curl http://localhost:9000/minio/health/live
   ```

3. Check credentials:
   ```bash
   # MinIO
   echo $MINIO_ROOT_USER
   echo $MINIO_ROOT_PASSWORD
   ```

### Problem: "Database not available"

**Solutions:**
1. Database is optional - system works without it
2. For full features, configure database:
   ```bash
   # Check DATABASE_URL
   echo $DATABASE_URL
   
   # Run migration
   psql $DATABASE_URL -f lib/database/migrations/005_unified_file_storage.sql
   ```

### Problem: "File upload failed"

**Solutions:**
1. Check file size limits (default: 100MB)
2. Check allowed file types
3. Verify storage service has write permissions
4. Check network connectivity to storage service

---

## Next Steps After Testing

Once tests pass:

1. ✅ **Integrate with MSDS module** - Replace `.tmp` storage
2. ✅ **Integrate with Evidence service** - Use for file attachments
3. ✅ **Integrate with other modules** - Documents, certificates, etc.
4. ✅ **Run migration** - Move existing files from `.tmp` to permanent storage

---

## Test Results Interpretation

### All Tests Pass ✅
- System is ready for production use
- All features working correctly
- Ready to integrate with modules

### Some Warnings ⚠️
- Basic functionality working
- Some advanced features may be limited (search, deduplication)
- Consider configuring database for full features

### Tests Failed ❌
- Check storage configuration
- Verify storage service is running
- Review error messages for specific issues
- See troubleshooting section above

---

## Need Help?

If tests fail:
1. Check the error messages
2. Review troubleshooting section
3. Verify prerequisites are met
4. Check storage service logs:
   ```bash
   docker-compose logs minio
   ```

