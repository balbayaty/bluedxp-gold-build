# 🚛 Transportation Module - Quick Start Guide

**For:** Users who want to get started quickly  
**Time:** 5 minutes

---

## ⚡ **QUICK SETUP (3 Steps)**

### **Step 1: Run Database Migration**

```bash
npm run prisma:migrate
```

**When prompted:**
- Migration name: `add_transportation_module`
- Apply migration: `y`

### **Step 2: Generate Prisma Client**

```bash
npm run prisma:generate
```

### **Step 3: Start Development Server**

```bash
npm run dev
```

---

## 🎯 **ACCESS THE MODULE**

1. Open your browser: `http://localhost:3002`
2. Look for **"Transportation"** in the left sidebar
3. Click to expand and see all features

**Or navigate directly to:**
- Dashboard: `http://localhost:3002/transportation`
- Shipments: `http://localhost:3002/shipments`
- Routes: `http://localhost:3002/routes`

---

## ✅ **VERIFY IT'S WORKING**

1. **Check Database:**
   ```bash
   npm run prisma:studio
   ```
   Look for tables starting with `transportation_`

2. **Test API:**
   - Open: `http://localhost:3002/api/transportation/intelligent-route-planning`
   - Should return API documentation or endpoint info

3. **Check UI:**
   - Navigate to `/transportation`
   - Should see transportation dashboard

---

## 🐛 **TROUBLESHOOTING**

### **Migration fails?**
- Check database is running
- Check `.env` has `DATABASE_URL`
- Try: `npm run prisma:generate` first

### **Tables not showing?**
- The adapter creates tables automatically on first use
- Or run SQL directly: `psql -f lib/database/migrations/005_transportation_module.sql`

### **Module not in sidebar?**
- Check `lib/modules/tms.ts` exists
- Restart dev server: `Ctrl+C` then `npm run dev`

---

## 📚 **MORE INFO**

- **Full Setup Guide:** `docs/TRANSPORT_MODULE_COMPLETE.md`
- **Database Details:** `docs/TRANSPORTATION_DATABASE_INTEGRATION.md`
- **Tech Stack:** `docs/TRANSPORTATION_TECH_STACK_SUMMARY.md`

---

**🎉 That's it! You're ready to use the Transportation Module!**



