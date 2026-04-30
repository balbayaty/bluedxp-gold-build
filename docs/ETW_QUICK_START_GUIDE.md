# ETW Module - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Generate Prisma Client
```bash
npx prisma generate
```

### Step 2: Create Database Migration
```bash
npx prisma migrate dev --name add_etw_models
```

### Step 3: Start Development Server
```bash
npm run dev
```

## ✅ Verify Installation

Run the verification script:
```bash
npm run verify:etw
```

Expected output: **8/8 checks passed** ✅

## 🎯 Access the Module

1. Navigate to: `http://localhost:3002/etw`
2. Or click "e-Waybills (ETW)" in the Transportation menu

## 📋 Quick Test

1. **Create ETW**: Click "Create e-Waybill" button
2. **Fill Form**: Complete the creation form
3. **View ETW**: See your created e-Waybill in the list
4. **Add Event**: Add a chain-of-custody event
5. **Generate QR**: Generate QR code for verification
6. **Export PDF**: Export as PDF

## 🆘 Troubleshooting

### Error: Prisma Client not generated
**Solution**: Run `npx prisma generate`

### Error: Module not found
**Solution**: Restart dev server after Prisma generate

### Error: 500 Internal Server Error
**Solution**: 
1. Check Prisma models exist: `npx prisma validate`
2. Run migration: `npx prisma migrate dev`
3. Restart server

### Error: Permission denied
**Solution**: Check RBAC - ensure user has `tms.etw` feature permission

## 📚 Documentation

- **Developer Guide**: `docs/ETW_DEVELOPER_QUICK_START.md`
- **Integration Guide**: `docs/ETW_MODULE_INTEGRATION_COMPLETE.md`
- **End-User Guide**: `docs/ETW_END_USER_READINESS.md`

## ✅ Status

**Module**: ✅ Ready
**Database**: ✅ Models added
**API**: ✅ 13 routes configured
**UI**: ✅ 6 pages ready
**Testing**: ✅ Verified

---

**Ready to use!** 🎉


