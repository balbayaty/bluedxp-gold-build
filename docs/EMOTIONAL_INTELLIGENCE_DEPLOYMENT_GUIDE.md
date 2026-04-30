# 🚀 Emotional Intelligence - Deployment Guide

## ✅ **PRODUCTION READY - DEPLOYMENT STEPS**

---

## **STEP 1: Database Migration**

### **Windows:**
```powershell
powershell -ExecutionPolicy Bypass -File scripts/migrate-emotional-intelligence.ps1
```

### **Linux/macOS:**
```bash
bash scripts/migrate-emotional-intelligence.sh
```

### **Manual:**
```bash
# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name add_emotional_intelligence_models

# Or for production
npx prisma migrate deploy
```

---

## **STEP 2: Verify Environment Variables**

Ensure these are set in `.env.local`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

---

## **STEP 3: Test Database Connection**

```bash
npx prisma db pull
```

Should succeed without errors.

---

## **STEP 4: Test API Endpoints**

### **Test Sentiment Analysis:**
```bash
curl -X POST http://localhost:3000/api/emotional-intelligence/sentiment \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: test-tenant" \
  -H "x-user-id: test-user" \
  -d '{
    "text": "I am very happy with the service!",
    "entityId": "customer-123",
    "entityType": "CUSTOMER"
  }'
```

### **Test Dashboard:**
```bash
curl http://localhost:3000/api/emotional-intelligence/dashboard \
  -H "x-tenant-id: test-tenant" \
  -H "x-user-id: test-user"
```

---

## **STEP 5: Verify Multi-Tenant Isolation**

1. Create data for tenant A
2. Try to access with tenant B
3. Verify tenant B cannot see tenant A's data

---

## **STEP 6: Monitor Logs**

Check console for:
- ✅ "Emotional Intelligence" service initialization
- ✅ Database connection success
- ✅ No errors during startup

---

## **STEP 7: Test Dashboard UI**

1. Navigate to `/emotional-intelligence`
2. Verify:
   - ✅ Page loads without errors
   - ✅ Loading state shows
   - ✅ Data displays (or empty state if no data)
   - ✅ No console errors

---

## **TROUBLESHOOTING**

### **Migration Fails:**
- Check `DATABASE_URL` is correct
- Ensure database exists
- Check database permissions

### **API Returns 401:**
- Ensure authentication headers are set
- Check `x-tenant-id` and `x-user-id` headers

### **No Data in Dashboard:**
- This is normal if no data exists yet
- Create some test data via API
- Check database for records

### **Database Connection Errors:**
- Verify `DATABASE_URL` format
- Check database is running
- Verify network connectivity

---

## **✅ DEPLOYMENT CHECKLIST**

- [ ] Database migration completed
- [ ] Environment variables set
- [ ] Database connection verified
- [ ] API endpoints tested
- [ ] Multi-tenant isolation verified
- [ ] Dashboard UI tested
- [ ] No errors in logs
- [ ] Monitoring working

---

## **🎉 READY FOR PRODUCTION!**

Once all steps are complete, the system is ready for end users! 🚀


