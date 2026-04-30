# 🏢 BILLING SYSTEM - TEAM/COMPANY ENHANCEMENT PLAN

## 🎯 GOAL

Enable flexible billing for teams, companies, and employees:
- ✅ Company pays for all employees
- ✅ Some employees on company plan, others individual
- ✅ Department/team-level billing
- ✅ Mixed billing models

---

## 📊 CURRENT STATE

### **What Works:**
- ✅ Multi-tenant architecture (Tenant model)
- ✅ Users belong to companies (User.tenantId)
- ✅ Individual user billing
- ✅ Organization context in all billing models

### **What's Missing:**
- ❌ Company-wide subscriptions
- ❌ Multiple users per subscription
- ❌ Billing type flags
- ❌ Team/department billing

---

## 🚀 ENHANCEMENT PLAN

### **Step 1: Update Database Schema**

**Add to `billing_subscriptions`:**
```prisma
model billing_subscriptions {
  // ... existing fields
  billingType String @default("individual") 
    // Options: "individual", "company", "team", "department"
  
  companySubscriptionId String?  
    // If individual user on company plan, link to company subscription
  
  assignedUserIds Json?  
    // Array of user IDs covered by this subscription (for company/team)
  
  isCompanyWide Boolean @default(false)
    // Quick flag: true = company subscription
  
  teamId String?  
    // If team/department billing, link to team
  
  departmentId String?  
    // If department billing, link to department
}
```

### **Step 2: Update Types**

**Add to `types/billing.ts`:**
```typescript
export type BillingType = 
  | "individual"  // User pays for themselves
  | "company"     // Company pays for employees
  | "team"        // Team pays for team members
  | "department"; // Department pays for department members

export interface CreateSubscriptionInput {
  // ... existing fields
  billingType?: BillingType;
  companySubscriptionId?: string;  // Link to parent company subscription
  assignedUserIds?: string[];      // Users covered by this subscription
  teamId?: string;
  departmentId?: string;
}
```

### **Step 3: Update Subscription Service**

**Add methods:**
```typescript
// Create company subscription
async createCompanySubscription(input: {
  tenantId: string;
  planId: string;
  assignedUserIds: string[];  // All employees
  billingCycle: BillingCycle;
}): Promise<Subscription>

// Add employee to company subscription
async addEmployeeToCompanySubscription(
  subscriptionId: string,
  userId: string
): Promise<void>

// Remove employee from company subscription
async removeEmployeeFromCompanySubscription(
  subscriptionId: string,
  userId: string
): Promise<void>

// Get company subscription for tenant
async getCompanySubscription(tenantId: string): Promise<Subscription | null>

// Check if user is on company plan
async isUserOnCompanyPlan(userId: string): Promise<boolean>
```

### **Step 4: Update Invoice Generation**

**Company subscription → One invoice:**
```typescript
// Generate invoice for company subscription
const invoice = await invoiceService.generateInvoice({
  tenantId: "abc-corp",
  userId: "company-admin",  // Company admin user
  subscriptionId: companySubscription.id,
  type: "subscription",
  lineItems: [
    {
      description: "Professional Plan - 50 employees",
      quantity: 50,
      unitPrice: 199,
      amount: 199 * 50,
    }
  ],
  metadata: {
    billingType: "company",
    assignedUserIds: ["user-1", "user-2", ...],
  }
});
```

**Individual subscription → Separate invoice:**
```typescript
// Generate invoice for individual user
const invoice = await invoiceService.generateInvoice({
  tenantId: "abc-corp",
  userId: "user-4",  // Individual user
  subscriptionId: individualSubscription.id,
  type: "subscription",
  // ... individual billing
});
```

### **Step 5: Update Usage Aggregation**

**Company subscription aggregates all employee usage:**
```typescript
// Get usage for company subscription
const usage = await usageBillingService.calculateUsageBilling(
  companySubscriptionId,
  period
);

// Aggregates usage from all assignedUserIds
// Returns total usage across all employees
```

---

## 📋 IMPLEMENTATION CHECKLIST

- [ ] Update Prisma schema (add billingType, assignedUserIds, etc.)
- [ ] Run migration
- [ ] Update TypeScript types
- [ ] Add company subscription methods to subscriptionService
- [ ] Update invoice generation logic
- [ ] Update usage aggregation logic
- [ ] Add API endpoints for company subscriptions
- [ ] Update UI to show company vs individual billing
- [ ] Add employee management UI (add/remove from company plan)
- [ ] Test company subscription flow
- [ ] Test mixed billing (company + individual)
- [ ] Document new features

---

## 🎯 USE CASES

### **Use Case 1: Company Pays for All**
```
Company: ABC Corp
Plan: Professional (covers 100 employees)
Billing: One invoice to company
Payment: Company pays
```

### **Use Case 2: Mixed Billing**
```
Company: ABC Corp
- Employees 1-50: On company Professional plan
- Employees 51-100: Individual Starter plans
Billing: 
  - One invoice for company (50 employees)
  - 50 separate invoices for individuals
```

### **Use Case 3: Department Billing**
```
Company: ABC Corp
- Sales Department: Company plan
- IT Department: Individual plans
Billing: Separate by department
```

---

## ✅ BENEFITS

1. **Flexibility**: Support any billing model
2. **Scalability**: Easy to add employees to company plan
3. **Cost Control**: Company can manage all employee billing
4. **Mixed Models**: Some employees company, others individual
5. **Department Billing**: Granular control

---

**Status**: 📋 **ENHANCEMENT PLAN READY**

**Priority**: 🔴 **HIGH** (Important for enterprise customers)
