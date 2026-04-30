# 🚀 QUICK START GUIDE - QHSE & ISO-IMS Modules

## Getting Started in 5 Minutes

### Step 1: Database Setup (2 minutes)

```bash
# 1. Generate Prisma client
npx prisma generate

# 2. Run database migration
npx prisma migrate dev --name add_qhse_iso_ims_models
```

**⚠️ Important:** Close all terminals before running the migration to avoid file lock issues on Windows.

### Step 2: Verify Installation (1 minute)

```bash
# Run comprehensive tests
npx tsx scripts/test-all-services.ts
```

Expected output:
```
✅ QHSE Incident - Create Incident (45ms)
✅ QHSE Incident - Get Incident (12ms)
✅ CAPA - Create CAPA (38ms)
...
🎉 ALL TESTS PASSED!
```

### Step 3: Start Development Server (1 minute)

```bash
npm run dev
```

### Step 4: Access the Modules (1 minute)

**QHSE Module:**
- Dashboard: `http://localhost:3000/qhse/dashboard`
- Incidents: `http://localhost:3000/qhse/incidents`
- Inspections: `http://localhost:3000/qhse/inspections`
- Training: `http://localhost:3000/qhse/training`

**ISO-IMS Module:**
- Dashboard: `http://localhost:3000/iso-ims`
- CAPA: `http://localhost:3000/iso-ims/capa`
- NCR: `http://localhost:3000/iso-ims/ncr`
- Audit: `http://localhost:3000/iso-ims/audit`
- Document: `http://localhost:3000/iso-ims/document`
- Risk: `http://localhost:3000/iso-ims/risk`
- Training: `http://localhost:3000/iso-ims/training`

---

## 🎯 Key Features

### QHSE Module
- **Incident Management** - Track and manage safety incidents
- **Inspections** - Schedule and conduct safety inspections
- **Training** - Manage employee training and compliance
- **Environmental Metrics** - Track environmental performance
- **Safety Metrics** - Monitor safety KPIs
- **Regulatory Compliance** - Ensure regulatory adherence

### ISO-IMS Module
- **CAPA System** - Corrective and Preventive Actions
- **NCR Management** - Non-Conformance Reports
- **Audit Management** - Internal and external audits
- **Document Control** - Version-controlled documents
- **Risk Management** - Risk assessment and mitigation
- **Training & Competence** - Employee competence tracking

---

## 📝 Creating Your First Record

### Create an Incident (QHSE)

```typescript
// POST /api/qhse/incidents
{
  "tenantId": "your-tenant-id",
  "type": "NEAR_MISS",
  "severity": "MEDIUM",
  "title": "Near miss in warehouse",
  "description": "Forklift operator narrowly avoided collision",
  "location": "Warehouse A",
  "occurredAt": "2024-01-15T10:30:00Z",
  "reportedBy": "user-id",
  "createdBy": "user-id"
}
```

### Create a CAPA (ISO-IMS)

```typescript
// POST /api/iso-ims/capa
{
  "tenantId": "your-tenant-id",
  "subject": "Improve forklift safety",
  "description": "Implement additional safety measures",
  "priority": "HIGH",
  "capaType": "CORRECTIVE_ACTION",
  "capaSource": "NCR",
  "assignedTo": "user-id",
  "department": "Safety",
  "owner": "user-id",
  "targetDate": "2024-02-15",
  "actionPlan": "Install proximity sensors on forklifts",
  "createdBy": "user-id"
}
```

### Create an NCR (ISO-IMS)

```typescript
// POST /api/iso-ims/ncr
{
  "tenantId": "your-tenant-id",
  "subject": "Non-conforming material received",
  "description": "Material does not meet specifications",
  "priority": "HIGH",
  "severity": "MAJOR",
  "ncType": "PRODUCT",
  "reportedBy": "user-id",
  "reportedDate": "2024-01-15T10:30:00Z",
  "createdBy": "user-id"
}
```

---

## 🎨 UI Features

### Glassmorphism Design
- Modern frosted glass effects
- Smooth animations
- Interactive hover states
- Gradient overlays

### Animations
- Spring animations on load
- Scale effects on hover
- Staggered card animations
- Progress bar animations

### Interactive Elements
- Shimmer effects on buttons
- Real-time status indicators
- Smooth transitions
- Loading states

---

## 🔧 API Usage Examples

### List Incidents with Filters

```bash
GET /api/qhse/incidents?tenantId=your-tenant-id&severity=HIGH&status=OPEN
```

### List CAPAs with Pagination

```bash
GET /api/iso-ims/capa?tenantId=your-tenant-id&page=1&pageSize=20&status=OPEN
```

### Update a Record

```bash
PUT /api/iso-ims/capa/[id]?tenantId=your-tenant-id
{
  "subject": "Updated subject",
  "status": "IN_PROGRESS",
  "updatedBy": "user-id"
}
```

### Delete a Record

```bash
DELETE /api/qhse/incidents/[id]?tenantId=your-tenant-id
```

---

## 🛠️ Troubleshooting

### Issue: Migration fails
**Solution:** 
- Close all terminals
- Check database connection string
- Verify PostgreSQL is running

### Issue: Prisma client not found
**Solution:**
```bash
npx prisma generate
```

### Issue: API returns 404
**Solution:**
- Check route registration in `lib/modules/`
- Verify API route file exists
- Check Next.js routing

### Issue: Database queries fail
**Solution:**
- Verify `DATABASE_URL` in `.env`
- Check table existence: `npx prisma studio`
- Verify migration ran successfully

---

## 📚 Next Steps

1. **Explore the Dashboards**
   - Check out the QHSE dashboard
   - Explore ISO-IMS dashboard
   - Review analytics and metrics

2. **Create Test Data**
   - Create sample incidents
   - Create sample CAPAs
   - Create sample NCRs

3. **Test Features**
   - Test filtering and search
   - Test pagination
   - Test CRUD operations

4. **Customize**
   - Adjust UI colors
   - Add custom fields
   - Configure workflows

---

## 📖 Documentation

- **Complete Implementation Summary:** `docs/COMPLETE_IMPLEMENTATION_SUMMARY.md`
- **Deployment Checklist:** `docs/DEPLOYMENT_CHECKLIST.md`
- **Final Completion Report:** `docs/FINAL_COMPLETION_REPORT.md`

---

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the documentation
3. Run the test suite: `npx tsx scripts/test-all-services.ts`
4. Check application logs

---

*Last Updated: $(date)*
*Status: Production Ready ✅*
