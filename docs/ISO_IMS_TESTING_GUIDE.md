# ISO IMS Comprehensive Testing Guide

## Overview

This guide provides comprehensive testing instructions for the ISO IMS module, ensuring all workflows, components, and integrations are fully functional.

## Test Scripts

### 1. API-Based Test Script
**Location:** `scripts/test-iso-ims-api.ts`

**Usage:**
```bash
npm run test:iso-ims
```

**What it tests:**
- Creates test NCRs, CAPAs, and Documents via API
- Tests all CRUD operations
- Tests query/filter functionality
- Tests workflow operations (update, approve, etc.)
- Tests stats endpoint

**Browser Usage:**
The script can also be run in the browser console:
1. Navigate to any ISO IMS page
2. Open browser console
3. Run: `testISOIMS()`

### 2. Service-Level Test Script
**Location:** `scripts/test-iso-ims-workflow.ts`

**Usage:**
```bash
npm run test:iso-ims:workflow
```

**What it tests:**
- Direct service-level operations (bypasses API)
- Creates comprehensive test data for all entity types:
  - NCRs (3 test records)
  - CAPAs (3 test records)
  - Documents (3 test records)
  - Audits (2 test records)
  - Risks (3 test records)
  - Training (2 test records)
- Tests all workflows and status changes
- Tests action items, comments, and approvals

## Manual Testing Checklist

### Dashboard (`/iso-ims`)
- [ ] Dashboard loads without errors
- [ ] Stats display correctly
- [ ] All module cards are clickable
- [ ] Compliance score displays
- [ ] Alerts section displays (if any)
- [ ] AI insights display (if any)
- [ ] Auto-refresh toggle works
- [ ] Refresh button works
- [ ] All navigation links work

### CAPA Management (`/iso-ims/capa`)
- [ ] Page loads and displays CAPAs
- [ ] Search functionality works
- [ ] Status filter works
- [ ] Priority filter works
- [ ] "New CAPA" button navigates correctly
- [ ] CAPA cards are clickable
- [ ] Empty state displays when no CAPAs
- [ ] Create CAPA form works
- [ ] Update CAPA works
- [ ] Status changes work
- [ ] Action items can be added
- [ ] Comments can be added
- [ ] CAPA can be linked to NCR

### NCR Management (`/iso-ims/ncr`)
- [ ] Page loads and displays NCRs
- [ ] Search functionality works
- [ ] Status filter works
- [ ] Severity filter works
- [ ] "New NCR" button navigates correctly
- [ ] NCR cards are clickable
- [ ] Empty state displays when no NCRs
- [ ] Create NCR form works
- [ ] Update NCR works
- [ ] Status changes work
- [ ] Root cause analysis can be added
- [ ] NCR can be linked to CAPA

### Document Management (`/iso-ims/document`)
- [ ] Page loads and displays Documents
- [ ] Search functionality works
- [ ] Status filter works
- [ ] Document type filter works
- [ ] "New Document" button navigates correctly
- [ ] Document cards are clickable
- [ ] Empty state displays when no Documents
- [ ] Create Document form works
- [ ] Update Document works
- [ ] Document approval workflow works
- [ ] Document rejection workflow works
- [ ] Version creation works
- [ ] Document linking works

### Audit Management (`/iso-ims/audit`)
- [ ] Page loads and displays Audits
- [ ] Search functionality works
- [ ] Status filter works
- [ ] Audit type filter works
- [ ] "New Audit" button navigates correctly
- [ ] Audit cards are clickable
- [ ] Empty state displays when no Audits
- [ ] Create Audit form works
- [ ] Update Audit works
- [ ] Findings can be added
- [ ] Audit can be linked to NCR/CAPA

### Risk Management (`/iso-ims/risk`)
- [ ] Page loads and displays Risks
- [ ] Search functionality works
- [ ] Risk level filter works
- [ ] Category filter works
- [ ] "New Risk" button navigates correctly
- [ ] Risk cards are clickable
- [ ] Empty state displays when no Risks
- [ ] Create Risk form works
- [ ] Update Risk works
- [ ] Risk assessment works
- [ ] Treatment plan can be added
- [ ] Risk can be linked to other entities

### Training Management (`/iso-ims/training`)
- [ ] Page loads and displays Trainings
- [ ] Search functionality works
- [ ] Status filter works
- [ ] Training type filter works
- [ ] "New Training" button navigates correctly
- [ ] Training cards are clickable
- [ ] Empty state displays when no Trainings
- [ ] Create Training form works
- [ ] Update Training works
- [ ] Participants can be registered
- [ ] Completion can be recorded
- [ ] Assessment results can be recorded

## Test Data Created

When you run the test scripts, the following test data is created:

### NCRs (3 records)
1. **Critical Safety Equipment Non-Compliance** - CRITICAL priority, CRITICAL severity
2. **Quality Defect in Batch #12345** - HIGH priority, MAJOR severity
3. **Documentation Gap in Process** - MEDIUM priority, MINOR severity

### CAPAs (3 records)
1. **Implement Enhanced Safety Training Program** - CRITICAL, linked to NCR #1
2. **Preventive Action: Quality Control Enhancement** - HIGH, linked to NCR #2
3. **Process Documentation Standardization** - MEDIUM, linked to NCR #3

### Documents (3 records)
1. **Quality Management System Manual** - POLICY, QUALITY category
2. **Safety Inspection Procedure** - PROCEDURE, SAFETY category
3. **CAPA Form Template** - FORM, QUALITY category

### Audits (2 records)
1. **Internal Quality Audit Q1 2024** - INTERNAL type
2. **External Certification Audit** - CERTIFICATION type

### Risks (3 records)
1. **Equipment Failure Risk** - OPERATIONAL category
2. **Data Security Breach Risk** - INFORMATION_SECURITY category
3. **Supplier Quality Risk** - SUPPLY_CHAIN category

### Training (2 records)
1. **ISO 9001:2015 Awareness Training** - AWARENESS type
2. **Safety Procedures Training** - COMPETENCY type

## Workflow Testing

### NCR → CAPA Workflow
1. Create an NCR
2. Create a CAPA linked to the NCR
3. Verify the link is established
4. Update NCR status
5. Verify CAPA reflects the change

### Document Approval Workflow
1. Create a Document in DRAFT status
2. Update status to UNDER_REVIEW
3. Approve the document
4. Verify status changes to APPROVED
5. Test rejection workflow

### Risk Assessment Workflow
1. Create a Risk
2. Assess the risk (set likelihood and impact)
3. Verify risk score is calculated
4. Add treatment plan
5. Verify residual risk is calculated

### Training Completion Workflow
1. Create a Training
2. Register participants
3. Record completion with assessment
4. Verify participant status updates
5. Verify training completion status

## Integration Testing

### Cross-Module Links
- [ ] NCR can link to CAPA
- [ ] CAPA can link to NCR
- [ ] Document can link to CAPA/NCR
- [ ] Audit can link to NCR/CAPA
- [ ] Risk can link to CAPA/NCR

### Event Publishing
- [ ] All create operations publish events
- [ ] All update operations publish events
- [ ] All delete operations publish events
- [ ] Events have correct structure
- [ ] Events are stored in event store

### API Endpoints
- [ ] GET endpoints return correct data
- [ ] POST endpoints create entities
- [ ] PUT endpoints update entities
- [ ] DELETE endpoints delete entities
- [ ] Query parameters work correctly
- [ ] Pagination works
- [ ] Filters work

## Common Issues and Fixes

### Issue: "Cannot read properties of undefined"
**Fix:** Ensure all optional chaining is in place (`?.`)

### Issue: "Invalid Date" in events
**Fix:** Use `createEvent()` helper instead of direct event publishing

### Issue: API returns 401 Unauthorized
**Fix:** Check authentication middleware and ensure user context is set

### Issue: Empty lists when data exists
**Fix:** Check tenantId filtering and ensure correct tenant is used

## Performance Testing

- [ ] Dashboard loads in < 2 seconds
- [ ] List pages load in < 1 second
- [ ] Search results appear instantly
- [ ] Filters apply without delay
- [ ] No memory leaks

## Browser Compatibility

- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile browsers

## Accessibility

- [ ] All buttons have aria-labels
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible

## Next Steps

After running tests:
1. Review test results
2. Fix any failed tests
3. Verify all workflows manually
4. Test edge cases
5. Test error handling
6. Test with different user roles
7. Test with different tenants

## Support

For issues or questions:
- Check console logs for errors
- Review API responses
- Check database for data
- Review event store for events
- Check service logs













