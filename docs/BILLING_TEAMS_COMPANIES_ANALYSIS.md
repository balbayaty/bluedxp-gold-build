# 🏢 BILLING SYSTEM - TEAMS & COMPANIES SUPPORT

## 📊 CURRENT STATUS

### ✅ **WHAT EXISTS:**

**1. Multi-Tenant Architecture:**
- ✅ `Tenant` model (companies/organizations)
- ✅ Users belong to tenants (`User.tenantId`)
- ✅ All billing models have `tenantId` field
- ✅ Billing can be filtered by tenant

**2. User-Level Billing:**
- ✅ Each user can have their own subscription
- ✅ `billing_subscriptions.userId` links subscription to user
- ✅ Individual invoices per user
- ✅ Individual usage tracking per user

**3. Foundation for Team Billing:**
- ✅ `quantity` field in subscriptions (could be used for team size)
- ✅ `tenantId` in all billing models (organization context)
- ✅ Usage aggregation possible by tenant

---

### ⚠️ **WHAT'S MISSING (For Full Team/Company Support):**

**1. Company-Level Subscriptions:**
- ❌ No way to create subscription for entire company/tenant
- ❌ No flag to mark subscription as "company-wide" vs "individual"
- ❌ No linking of multiple users to one subscription

**2. Flexible Billing Models:**
- ❌ Can't have: "Company pays for all employees"
- ❌ Can't have: "Some employees on company plan, others individual"
- ❌ Can't have: "Department-level billing"

**3. Team Management:**
- ❌ No team/group model
- ❌ No way to assign employees to company subscription
- ❌ No billing aggregation at team level

---

## 🎯 HOW IT WORKS NOW

### **Current Flow:**

```
Company (Tenant)
    ↓
Employees (Users with same tenantId)
    ↓
Each Employee → Own Subscription
    ↓
Separate Billing Per Employee
```

**Example:**
- Company: "ABC Corp" (tenantId: "abc-corp")
- Employee 1: John (userId: "user-1", tenantId: "abc-corp")
  - Has own subscription: "Professional Plan"
  - Own invoices, own payments
- Employee 2: Jane (userId: "user-2", tenantId: "abc-corp")
  - Has own subscription: "Starter Plan"
  - Own invoices, own payments

**Result:** Each employee billed separately ❌

---

## 🚀 WHAT NEEDS TO BE ADDED

### **Option 1: Company-Wide Subscription**

**Add to `billing_subscriptions`:**
```typescript
billingType: "individual" | "company" | "team"  // NEW FIELD
companySubscriptionId?: string  // If individual, link to company sub
assignedUserIds?: string[]  // If company, list of users covered
```

**Flow:**
```
Company (Tenant)
    ↓
Company Subscription (billingType: "company")
    ↓
All Employees (assignedUserIds: ["user-1", "user-2", ...])
    ↓
One Invoice for Company
    ↓
Company Pays
```

### **Option 2: Mixed Billing**

**Support both:**
- Company subscription for some employees
- Individual subscriptions for others

**Flow:**
```
Company (Tenant)
    ├─→ Company Subscription (covers employees 1-50)
    └─→ Individual Subscriptions (employees 51-100)
```

### **Option 3: Department/Team Billing**

**Add Team model:**
```typescript
Team {
  id: string
  tenantId: string
  name: string
  subscriptionId?: string  // Team subscription
  memberIds: string[]  // Team members
}
```

---

## 💡 RECOMMENDED IMPLEMENTATION

### **Phase 1: Add Company Subscription Support**

**1. Update Schema:**
```prisma
model billing_subscriptions {
  // ... existing fields
  billingType String @default("individual") // individual, company, team
  companySubscriptionId String?  // Link to parent company subscription
  assignedUserIds Json?  // Array of user IDs covered by this subscription
  isCompanyWide Boolean @default(false)
}
```

**2. Update Service:**
```typescript
// Create company subscription
await subscriptionService.createCompanySubscription({
  tenantId: "abc-corp",
  planId: "professional",
  assignedUserIds: ["user-1", "user-2", "user-3"], // All employees
  billingType: "company"
});

// Create individual subscription (separate from company)
await subscriptionService.createSubscription({
  tenantId: "abc-corp",
  userId: "user-4", // Employee not on company plan
  planId: "starter",
  billingType: "individual"
});
```

**3. Update Invoice Generation:**
- Company subscription → One invoice for company
- Individual subscription → Separate invoice per user

---

## 📋 SUMMARY

### **Current Capabilities:**
- ✅ Multi-tenant architecture
- ✅ User-level billing
- ✅ Organization context (tenantId)
- ✅ Foundation exists

### **Missing for Full Team Support:**
- ❌ Company-wide subscriptions
- ❌ Linking multiple users to one subscription
- ❌ Mixed billing (company + individual)
- ❌ Team/department billing

### **Recommendation:**
**Add company subscription support** to enable:
1. Company pays for all employees
2. Some employees on company plan, others individual
3. Flexible billing models

---

**Status**: ⚠️ **PARTIALLY SUPPORTED** - Foundation exists, needs enhancement for full team/company billing
