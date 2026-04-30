# 🚀 ASN Module - Launch Guide

**Quick Start to See Your App Running**

---

## ✅ What I've Done

1. ✅ **Generated Prisma Client** - Database client ready
2. ✅ **Started Development Server** - Running in background on port 3002
3. ✅ **Integrated OCR & Vision Services** - All integrations complete

---

## ⚠️ What You Need to Do

### Step 1: Start Docker (Required for Database)

**Option A: Docker Desktop (Recommended)**
1. Open Docker Desktop application
2. Wait for it to fully start (green icon in system tray)
3. Then run: `docker-compose up -d postgres`

**Option B: Start Just PostgreSQL**
```bash
docker-compose up -d postgres
```

This starts the PostgreSQL database that the app needs.

### Step 2: Run Database Migration (5 minutes)

Once Docker is running:

```bash
# Run the migration to create ASN tables
npx prisma migrate dev --name add_asn_models
```

This will:
- Create all ASN database tables
- Set up indexes and relationships
- Make the module fully functional

### Step 3: Access Your App

Open your browser and go to:

**Main ASN Page:**
```
http://localhost:3002/asn
```

**ASN Dashboard:**
```
http://localhost:3002/asn/dashboard
```

**ASN Processing:**
```
http://localhost:3002/asn/processing
```

---

## 🎯 Quick Status Check

### Check if Server is Running
The dev server should be running. Check:
- Browser: `http://localhost:3002`
- Terminal: Look for "Ready" message

### Check if Database is Running
```bash
docker ps
```
You should see `bluedxp-postgres` container running.

### Check Migration Status
```bash
npx prisma migrate status
```

---

## 🐛 Troubleshooting

### "Can't reach database server"
**Solution:** Start Docker Desktop and run `docker-compose up -d postgres`

### "Module not found" or "Page not found"
**Solution:** The server might still be starting. Wait 30 seconds and refresh.

### "Tables don't exist"
**Solution:** Run `npx prisma migrate dev --name add_asn_models`

### Port 3002 already in use
**Solution:** 
```bash
# Find what's using the port
netstat -ano | findstr :3002

# Or change port in package.json
# "dev": "next dev -p 3003"
```

---

## 📋 Complete Launch Checklist

- [ ] Docker Desktop is running
- [ ] PostgreSQL container is running (`docker ps`)
- [ ] Database migration completed (`npx prisma migrate dev`)
- [ ] Dev server is running (check `http://localhost:3002`)
- [ ] Can access `/asn` page
- [ ] Can see ASN dashboard

---

## 🎉 Once Everything is Running

You'll be able to:
- ✅ View ASN dashboards
- ✅ Create new ASNs
- ✅ Process ASN documents with OCR
- ✅ Analyze photos with AI Vision
- ✅ View analytics and predictions
- ✅ Manage exceptions

---

## 📞 Need Help?

**Server Status:**
- Check terminal output for errors
- Look for "Ready" message

**Database Status:**
- Run `docker ps` to see containers
- Check `npx prisma migrate status` for migration status

**App Access:**
- Open `http://localhost:3002/asn` in browser
- Check browser console for errors

---

**Your app is starting! Once Docker is running and migration is complete, you're ready to go! 🚀**
