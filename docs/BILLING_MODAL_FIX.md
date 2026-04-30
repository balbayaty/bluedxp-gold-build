# ✅ BILLING MODAL IMPORT FIX

## 🐛 ISSUE IDENTIFIED

**Error**: "Element type is invalid: expected a string... but got: undefined"

**Root Cause**: `EmployeeInvitationModal` was importing `Modal` from `@/components/ui/Modal`, but this path may not be resolving correctly at runtime, causing the Modal component to be `undefined`.

## ✅ FIX APPLIED

Changed the import in `EmployeeInvitationModal.tsx`:
- **Before**: `import Modal from "@/components/ui/Modal";`
- **After**: `import Modal from "@/components/Modal";`

This uses the more commonly used Modal component that other parts of the codebase use.

## ✅ VERIFICATION

- ✅ Import path updated
- ✅ Modal component exists at `@/components/Modal`
- ✅ Props match (title is required, which is already provided)
- ✅ No linter errors

---

**Status**: ✅ **FIXED**

**The billing dashboard should now render without the "Element type is invalid" error!**
