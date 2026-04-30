# 🔗 BILLING SYSTEM - ACCESS LINKS

## 🚀 Quick Access Links

### **Main Billing Page:**
```
http://localhost:3002/billing
```

### **API Endpoints (for testing):**

**Subscriptions:**
```
GET  http://localhost:3002/api/billing/subscriptions
POST http://localhost:3002/api/billing/subscriptions
```

**Invoices:**
```
GET  http://localhost:3002/api/billing/invoices
POST http://localhost:3002/api/billing/invoices
```

**Credits:**
```
GET  http://localhost:3002/api/billing/credits
POST http://localhost:3002/api/billing/credits/add
```

**Payments:**
```
POST http://localhost:3002/api/billing/payments
```

**Analytics:**
```
GET  http://localhost:3002/api/billing/analytics
```

---

## 📋 How to Access

### **Step 1: Start Development Server**
```bash
npm run dev
```

### **Step 2: Open Browser**
Navigate to: **http://localhost:3002/billing**

---

## 🎯 What You'll See

### **Billing Dashboard Features:**
- ✅ Current subscription plan
- ✅ Credit balance
- ✅ Usage metrics
- ✅ Invoice history
- ✅ Payment methods
- ✅ Plan comparison
- ✅ Upgrade/downgrade options

### **Tabs Available:**
1. **Overview** - Quick stats and recent invoices
2. **Plans** - Compare and upgrade plans
3. **Invoices** - View all invoices
4. **Payment Methods** - Manage payment methods
5. **Usage** - View usage metrics

---

## 🔧 If Server Not Running

### **Start Server:**
```powershell
npm run dev
```

### **Check if Running:**
```powershell
# Check if port 3002 is in use
Get-NetTCPConnection -LocalPort 3002 -ErrorAction SilentlyContinue
```

### **Kill Existing Process (if needed):**
```powershell
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
```

---

## 📝 Notes

- **Port**: 3002 (as configured in package.json)
- **Authentication**: May require login (check auth setup)
- **Database**: Must be running (PostgreSQL)
- **Prisma**: Client must be generated (`npx prisma generate`)

---

**Quick Link**: **http://localhost:3002/billing**
