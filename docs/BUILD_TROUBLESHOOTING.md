# 🔧 Build Troubleshooting Guide

## Understanding Build Errors

### Why Commands Get "Rejected"

When you see "Rejected command" in the IDE, it's usually because:

1. **PowerShell Syntax Issues**: Complex PowerShell commands with pipes (`|`) and special characters can be rejected by the execution environment
2. **Security Restrictions**: Some command combinations are blocked for security
3. **Pattern Parsing Errors**: Special characters in regex patterns can cause parsing failures

### What You're NOT Doing Wrong

**You're not doing anything wrong!** This is a technical limitation of how commands are executed in the IDE environment.

---

## Common Build Errors & Fixes

### 1. Duplicate Definitions

**Error**: `the name 'X' is defined multiple times`

**What it means**: The same class, function, or variable is defined twice in the same file.

**How to fix**:
1. Open the file mentioned in the error
2. Search for the duplicate name (e.g., `export class FacilityIntegrationService`)
3. Remove one of the duplicate definitions
4. Keep the one that's complete and correct

**Example**:
```typescript
// ❌ WRONG - Defined twice
export class MyService { ... }
export class MyService { ... } // Duplicate!

// ✅ CORRECT - Defined once
export class MyService { ... }
```

---

### 2. Missing Imports

**Error**: `Cannot find name 'X'` or `'X' is not defined`

**What it means**: You're using something that hasn't been imported.

**How to fix**:
1. Find where `X` is exported from
2. Add the import at the top of your file

**Example**:
```typescript
// ❌ WRONG - Using without import
knowledgeBaseService.create(...)

// ✅ CORRECT - Import first
import { knowledgeBaseService } from '@/lib/services/knowledge-base'
knowledgeBaseService.create(...)
```

---

### 3. Type Errors

**Error**: `Type 'X' is not assignable to type 'Y'`

**What it means**: You're trying to use a value of one type where a different type is expected.

**How to fix**:
1. Check what type is expected
2. Make sure your value matches that type
3. Use type casting if needed: `value as ExpectedType`

---

## How to Check Build Status

### Simple Method (Recommended)

Instead of complex PowerShell commands, use simple commands:

```powershell
# Just run the build
npm run build

# Or check for TypeScript errors
npx tsc --noEmit
```

### What to Look For

**Success looks like**:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
```

**Failure looks like**:
```
✗ Failed to compile
Error: [error message]
```

---

## Step-by-Step: Fixing Build Errors

### Step 1: Read the Error Message

The error will tell you:
- **What file** has the problem
- **What line** (approximately)
- **What the problem is**

Example:
```
./lib/services/facility/integration/facilityIntegrationService.ts
Error: the name `FacilityIntegrationService` is defined multiple times
```

### Step 2: Open the File

Open the file mentioned in the error.

### Step 3: Find the Duplicate

Search for the name that's duplicated:
- In VS Code: `Ctrl+F` and type the name
- Look for `export class`, `export function`, or `export const`

### Step 4: Remove the Duplicate

- Keep the first/complete definition
- Delete the duplicate
- Make sure you don't break anything else

### Step 5: Check for Missing Imports

If you see errors about undefined names, add the import.

### Step 6: Try Building Again

Run `npm run build` again to see if it's fixed.

---

## Why This Happens

### Duplicate Definitions

This usually happens when:
- Code was copied and pasted
- A merge conflict wasn't resolved properly
- Code was refactored but old code wasn't removed

### Missing Imports

This happens when:
- Code was moved to a different file
- A service was created but imports weren't added
- Dependencies changed

---

## Prevention Tips

1. **Before committing**: Always run `npm run build` to check for errors
2. **Use TypeScript**: It catches many errors before runtime
3. **Check linter**: Run `npm run lint` to find issues
4. **One definition per file**: Don't define the same thing twice

---

## Quick Reference

| Error | Cause | Fix |
|-------|-------|-----|
| `defined multiple times` | Duplicate definition | Remove duplicate |
| `Cannot find name` | Missing import | Add import statement |
| `Type 'X' is not assignable` | Wrong type | Fix type or cast |
| `Unexpected token` | Syntax error | Fix syntax |
| `Module not found` | Wrong import path | Fix import path |

---

## Getting Help

If you're stuck:
1. Read the full error message
2. Check the file and line mentioned
3. Look for similar patterns in working files
4. Ask for help with the specific error message

---

**Remember**: Build errors are normal during development. They're just the computer telling you what needs to be fixed!













