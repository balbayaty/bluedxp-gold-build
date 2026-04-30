# 🧹 Placeholder Page Cleanup - Detailed Prompt
## For New Cursor Agent Session

**Purpose:** Remove 227 placeholder pages from navigation  
**Context:** Part of comprehensive navigation integration cleanup  
**Prerequisites:** Phase 1-3 of integration should be complete

---

## 📋 TASK OVERVIEW

Remove all placeholder pages from the navigation structure. Placeholder pages are pages that:
- Show "Coming Soon" messages
- Show "Under Development" messages
- Are auto-generated with no real implementation
- Have no real functionality or backend connections

**Total Pages to Remove:** 227 placeholder pages  
**File to Modify:** `lib/services/navigation/defaultNavigation.ts`  
**Backup:** Create backup before making changes

---

## 🔍 IDENTIFICATION CRITERIA

A page is a placeholder if it contains any of these indicators:

1. **Text Content:**
   - "Coming Soon"
   - "Under Development"
   - "This page is ready for implementation"
   - "Auto-generated page for..."
   - "Not yet implemented"
   - "Placeholder"

2. **Code Patterns:**
   - Empty component body
   - Only returns a simple message
   - No real data fetching
   - No real functionality

3. **File Patterns:**
   - Pages that are just stubs
   - Pages with minimal code (< 50 lines)
   - Pages that only show a message

---

## 📊 REFERENCE DATA

### Audit Results:
- **Total Pages in Navigation:** 609
- **Placeholder Pages:** 227 (37%)
- **Source:** `NAVIGATION_CONNECTIVITY_AUDIT.json`

### Key Files:
- **Navigation Definition:** `lib/services/navigation/defaultNavigation.ts`
- **Audit Results:** `NAVIGATION_CONNECTIVITY_AUDIT.json`
- **Page Files:** `app/**/page.tsx`

---

## 🎯 EXECUTION STEPS

### Step 1: Load Audit Data
1. Read `NAVIGATION_CONNECTIVITY_AUDIT.json`
2. Filter entries where `isPlaceholder: true`
3. Extract all routes that are placeholders
4. Create a list of routes to remove

### Step 2: Backup Navigation File
1. Create backup: `lib/services/navigation/defaultNavigation.ts.backup`
2. Copy current navigation structure

### Step 3: Identify Navigation Entries
1. Read `lib/services/navigation/defaultNavigation.ts`
2. For each placeholder route, find its navigation entry
3. Note the exact location (line numbers, parent section)

### Step 4: Remove Placeholder Entries
1. Remove navigation entries for placeholder routes
2. Be careful to:
   - Remove entire `children` arrays if they become empty
   - Remove parent sections if all children are placeholders
   - Keep structure intact
   - Don't break navigation structure

### Step 5: Verify Navigation Structure
1. Check that navigation still compiles
2. Verify no broken references
3. Ensure navigation structure is valid
4. Check that non-placeholder pages are still accessible

### Step 6: Create Report
1. List all removed routes
2. Document any parent sections removed
3. Note any exceptions (pages kept despite being placeholders)
4. Create summary of changes

---

## ⚠️ EXCEPTIONS & RULES

### Keep These (Even if Placeholders):
1. **Module Registry Pages** - If page is registered in `lib/modules/*.ts`, keep it
2. **Core Platform Pages** - Pages in `lib/modules/core.ts` should be kept
3. **Dashboard Pages** - Role-specific dashboards should be kept (they aggregate data)
4. **Landing/Marketing Pages** - Pages like `/home`, `/landing` are OK to keep

### Remove These:
1. **All "Coming Soon" pages**
2. **All "Under Development" pages**
3. **All auto-generated stubs**
4. **All pages with no real functionality**

---

## 🔧 IMPLEMENTATION APPROACH

### Method 1: Automated Script (Recommended)
1. Create script: `scripts/remove-placeholder-pages.ts`
2. Script should:
   - Read audit JSON
   - Read navigation file
   - Remove placeholder entries
   - Write updated navigation file
   - Create report

### Method 2: Manual Removal
1. Read navigation file
2. For each placeholder route:
   - Find navigation entry
   - Remove it
   - Update parent structure if needed
3. Save file

---

## 📝 SCRIPT TEMPLATE

```typescript
// scripts/remove-placeholder-pages.ts

import * as fs from 'fs';
import * as path from 'path';

// 1. Load audit data
const auditPath = path.join(process.cwd(), 'NAVIGATION_CONNECTIVITY_AUDIT.json');
const audit = JSON.parse(fs.readFileSync(auditPath, 'utf-8'));

// 2. Get placeholder routes
const placeholderRoutes = audit.byStatus.PLACEHOLDER
  .map((entry: any) => entry.route)
  .filter((route: string) => {
    // Apply exception rules
    // Keep module registry pages, core pages, dashboards, landing pages
    return !route.includes('/dashboard/') && 
           !route.includes('/home') &&
           !route.includes('/landing');
  });

// 3. Read navigation file
const navPath = path.join(process.cwd(), 'lib/services/navigation/defaultNavigation.ts');
let navContent = fs.readFileSync(navPath, 'utf-8');

// 4. Remove placeholder entries
// (Implementation depends on navigation structure)

// 5. Write updated file
fs.writeFileSync(navPath, navContent);

// 6. Create report
const report = {
  removed: placeholderRoutes,
  count: placeholderRoutes.length,
  timestamp: new Date().toISOString()
};
fs.writeFileSync(
  path.join(process.cwd(), 'PLACEHOLDER_REMOVAL_REPORT.json'),
  JSON.stringify(report, null, 2)
);
```

---

## ✅ VERIFICATION CHECKLIST

After removal, verify:

- [ ] Navigation file compiles without errors
- [ ] No broken TypeScript types
- [ ] Navigation structure is valid
- [ ] All non-placeholder pages still accessible
- [ ] No orphaned parent sections
- [ ] Module registry pages still accessible
- [ ] Dashboard pages still accessible
- [ ] Core platform pages still accessible

---

## 📊 EXPECTED RESULTS

### Before:
- **Total Navigation Entries:** 609
- **Placeholder Entries:** 227

### After:
- **Total Navigation Entries:** ~382 (609 - 227)
- **Placeholder Entries:** 0
- **Removed:** 227 entries

### Impact:
- Cleaner navigation
- Only functional pages visible
- Better user experience
- Easier maintenance

---

## 🚨 IMPORTANT NOTES

1. **Backup First:** Always create backup before making changes
2. **Test After:** Verify navigation works after removal
3. **Document Changes:** Keep track of what was removed
4. **Exception Handling:** Apply exception rules carefully
5. **Module Registry:** Check module registry before removing pages

---

## 📄 OUTPUT FILES

After execution, create:

1. **`PLACEHOLDER_REMOVAL_REPORT.json`** - List of removed routes
2. **`defaultNavigation.ts.backup`** - Backup of original navigation
3. **`PLACEHOLDER_CLEANUP_SUMMARY.md`** - Summary of changes

---

## 🎯 SUCCESS CRITERIA

✅ All placeholder pages removed from navigation  
✅ Navigation structure remains valid  
✅ No broken references  
✅ All functional pages still accessible  
✅ Report generated with removed routes  
✅ Backup created  

---

**Ready to execute in new Cursor agent session after Phase 1-3 completion!**
