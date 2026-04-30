/**
 * 💰 COMPREHENSIVE BILLING SYSTEM TYPES
 * 
 * World-class billing types covering all scenarios:
 * - Subscriptions (recurring, usage-based, hybrid)
 * - Invoices (automated, manual, recurring)
 * - Payments (multiple methods, retries, refunds)
 * - Proration (upgrades, downgrades, mid-cycle)
 * - Taxes (multi-jurisdiction, compliance)
 * - Discounts (coupons, promotions, credits)
 * - Revenue Recognition (ASC 606, IFRS 15)
 * 
 * BlueDXP Platform - Enterprise-Grade Billing
 */

// ============================================================================
// CORE BILLING TYPES
// ============================================================================

export type BillingPlan = 
  | "free"
  | "starter"
  | "professional"
  | "enterprise"
  | "custom";

export type SubscriptionStatus = 
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "paused"
  | "suspended";

export type BillingCycle = 
  | "monthly"
  | "quarterly"
  | "annual"
  | "custom";

export type InvoiceStatus = 
  | "draft"
  | "open"
  | "paid"
  | "void"
  | "uncollectible"
  | "partially_paid";

export type PaymentStatus = 
  | "pending"
  | "processing"
  | "succeeded"
  | "failed"
  | "refunded"
  | "partially_refunded"
  | "disputed";

export type PaymentMethod = 
  | "card"
  | "bank_transfer"
  | "wallet"
  | "mada"
  | "apple_pay"
  | "google_pay"
  | "invoice"
  | "cash"
  | "check";

export type TaxType = 
  | "vat"
  | "gst"
  | "sales_tax"
  | "withholding_tax"
  | "custom";

export type DiscountType = 
  | "percentage"
  | "fixed_amount"
  | "free_trial"
  | "volume_discount";

export type ProrationType = 
  | "upgrade"
  | "downgrade"
  | "addon"
  | "quantity_change"
  | "plan_change";

// ============================================================================
// SUBSCRIPTION TYPES
// ============================================================================

export interface Subscription {
  id: string;
  tenantId: string;
  userId: string;
  planId: string;
  planName: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  
  // Periods
  currentPeriodStart: Date | string;
  currentPeriodEnd: Date | string;
  trialStart?: Date | string;
  trialEnd?: Date | string;
  
  // Pricing
  basePrice: number;
  usagePrice?: number;
  totalPrice: number;
  currency: string;
  
  // Quantity & Add-ons
  quantity: number;
  addons?: SubscriptionAddon[];
  
  // Payment
  paymentMethodId?: string;
  autoRenew: boolean;
  cancelAtPeriodEnd: boolean;
  
  // Dates
  canceledAt?: Date | string;
  cancelReason?: string;
  pausedAt?: Date | string;
  resumedAt?: Date | string;
  
  // Metadata
  metadata?: Record<string, any>;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface SubscriptionAddon {
  id: string;
  addonId: string;
  name: string;
  quantity: number;
  price: number;
  currency: string;
  prorated?: boolean;
}

export interface SubscriptionChange {
  id: string;
  subscriptionId: string;
  changeType: ProrationType;
  fromPlanId?: string;
  toPlanId?: string;
  fromQuantity?: number;
  toQuantity?: number;
  effectiveDate: Date | string;
  prorationAmount?: number;
  prorationCredit?: number;
  prorationDebit?: number;
  status: "pending" | "applied" | "failed";
  createdAt: Date | string;
}

// ============================================================================
// INVOICE TYPES
// ============================================================================

export interface Invoice {
  id: string;
  invoiceNumber: string;
  tenantId: string;
  userId: string;
  subscriptionId?: string;
  
  // Status
  status: InvoiceStatus;
  type: "subscription" | "one_time" | "usage" | "credit_memo" | "debit_memo";
  
  // Dates
  invoiceDate: Date | string;
  dueDate: Date | string;
  paidAt?: Date | string;
  voidedAt?: Date | string;
  
  // Amounts
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  
  // Line Items
  lineItems: InvoiceLineItem[];
  
  // Taxes
  taxes: TaxLine[];
  
  // Discounts & Credits
  discounts?: Discount[];
  credits?: Credit[];
  
  // Payment
  paymentMethodId?: string;
  paymentAttempts?: PaymentAttempt[];
  
  // Metadata
  metadata?: Record<string, any>;
  pdfUrl?: string;
  emailSent?: boolean;
  emailSentAt?: Date | string;
  
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  type: "subscription" | "usage" | "addon" | "discount" | "tax" | "credit" | "other";
  period?: {
    start: Date | string;
    end: Date | string;
  };
  metadata?: Record<string, any>;
}

export interface TaxLine {
  id: string;
  taxType: TaxType;
  taxCode: string;
  taxName: string;
  rate: number; // Percentage
  taxableAmount: number;
  taxAmount: number;
  jurisdiction: string;
  complianceStandard?: string;
}

// ============================================================================
// PAYMENT TYPES
// ============================================================================

export interface Payment {
  id: string;
  tenantId: string;
  userId: string;
  invoiceId?: string;
  subscriptionId?: string;
  
  // Amount
  amount: number;
  currency: string;
  amountRefunded: number;
  netAmount: number;
  
  // Status
  status: PaymentStatus;
  
  // Payment Method
  paymentMethod: PaymentMethod;
  paymentMethodId?: string;
  paymentMethodDetails?: PaymentMethodDetails;
  
  // Gateway
  gateway: string; // "stripe", "paypal", "mada", etc.
  gatewayTransactionId?: string;
  gatewayResponse?: Record<string, any>;
  
  // Processing
  processedAt?: Date | string;
  failedAt?: Date | string;
  failureReason?: string;
  failureCode?: string;
  
  // Refunds
  refunds?: Refund[];
  
  // Metadata
  metadata?: Record<string, any>;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface PaymentMethodDetails {
  type: PaymentMethod;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  bankName?: string;
  accountHolderName?: string;
}

export interface PaymentAttempt {
  id: string;
  invoiceId: string;
  paymentId?: string;
  attemptNumber: number;
  amount: number;
  status: PaymentStatus;
  gateway?: string;
  gatewayTransactionId?: string;
  failureReason?: string;
  attemptedAt: Date | string;
}

export interface Refund {
  id: string;
  paymentId: string;
  invoiceId?: string;
  amount: number;
  currency: string;
  reason?: string;
  status: "pending" | "succeeded" | "failed";
  gatewayRefundId?: string;
  processedAt?: Date | string;
  createdAt: Date | string;
}

// ============================================================================
// USAGE BILLING TYPES
// ============================================================================

export interface UsageRecord {
  id: string;
  tenantId: string;
  userId: string;
  subscriptionId?: string;
  
  // Usage
  metricType: string; // "api_calls", "storage", "compute", etc.
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  currency: string;
  
  // Period
  periodStart: Date | string;
  periodEnd: Date | string;
  
  // Aggregation
  aggregated: boolean;
  aggregationPeriod?: "daily" | "monthly" | "custom";
  
  // Metadata
  metadata?: Record<string, any>;
  createdAt: Date | string;
}

export interface UsageBillingCalculation {
  subscriptionId: string;
  period: {
    start: Date | string;
    end: Date | string;
  };
  usageRecords: UsageRecord[];
  tieredPricing?: TieredPricingTier[];
  totalUsage: number;
  totalCost: number;
  currency: string;
  breakdown: UsageBreakdown[];
}

export interface TieredPricingTier {
  tier: number;
  from: number;
  to?: number; // undefined = unlimited
  unitPrice: number;
}

export interface UsageBreakdown {
  metricType: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  tier?: number;
}

// ============================================================================
// PRORATION TYPES
// ============================================================================

export interface Proration {
  id: string;
  subscriptionId: string;
  changeType: ProrationType;
  
  // Periods
  oldPeriod: {
    start: Date | string;
    end: Date | string;
  };
  newPeriod: {
    start: Date | string;
    end: Date | string;
  };
  
  // Pricing
  oldPrice: number;
  newPrice: number;
  proratedDays: number;
  totalDays: number;
  
  // Calculation
  creditAmount: number; // Amount to credit (downgrade)
  debitAmount: number; // Amount to charge (upgrade)
  netAmount: number; // Net change
  
  // Application
  applied: boolean;
  appliedAt?: Date | string;
  invoiceId?: string;
  creditMemoId?: string;
  
  createdAt: Date | string;
}

// ============================================================================
// DISCOUNT & CREDIT TYPES
// ============================================================================

export interface Discount {
  id: string;
  code?: string;
  name: string;
  type: DiscountType;
  value: number; // Percentage or fixed amount
  currency?: string;
  
  // Applicability
  applicableTo: "subscription" | "usage" | "addon" | "all";
  minAmount?: number;
  maxAmount?: number;
  
  // Validity
  validFrom: Date | string;
  validUntil?: Date | string;
  maxUses?: number;
  usedCount: number;
  
  // Status
  active: boolean;
  
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Credit {
  id: string;
  tenantId: string;
  userId: string;
  
  // Amount
  amount: number;
  currency: string;
  balance: number; // Remaining balance
  used: number; // Amount used
  
  // Type
  type: "manual" | "refund" | "promotion" | "adjustment";
  reason?: string;
  
  // Validity
  expiresAt?: Date | string;
  
  // Application
  appliedToInvoices?: string[];
  
  // Status
  status: "active" | "expired" | "exhausted";
  
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ============================================================================
// TAX TYPES
// ============================================================================

export interface TaxConfiguration {
  id: string;
  tenantId: string;
  taxType: TaxType;
  taxCode: string;
  taxName: string;
  rate: number; // Percentage
  effectiveDate: Date | string;
  expiryDate?: Date | string;
  isActive: boolean;
  jurisdiction: string;
  complianceStandard?: "ZATCA" | "GCC" | "IFRS" | "GAAP" | "CUSTOM";
  metadata?: Record<string, any>;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface TaxCalculation {
  invoiceId: string;
  taxableAmount: number;
  taxes: TaxLine[];
  totalTax: number;
  currency: string;
  jurisdiction: string;
  calculatedAt: Date | string;
}

// ============================================================================
// REVENUE RECOGNITION TYPES
// ============================================================================

export interface RevenueRecognition {
  id: string;
  tenantId: string;
  invoiceId: string;
  subscriptionId?: string;
  
  // Amounts
  totalRevenue: number;
  recognizedRevenue: number;
  deferredRevenue: number;
  currency: string;
  
  // Recognition Schedule
  recognitionMethod: "immediate" | "over_time" | "milestone";
  recognitionStart: Date | string;
  recognitionEnd?: Date | string;
  recognitionPeriods: RevenueRecognitionPeriod[];
  
  // Compliance
  complianceStandard: "ASC_606" | "IFRS_15";
  
  // Status
  status: "pending" | "in_progress" | "completed";
  
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface RevenueRecognitionPeriod {
  period: {
    start: Date | string;
    end: Date | string;
  };
  amount: number;
  recognized: boolean;
  recognizedAt?: Date | string;
}

// ============================================================================
// DUNNING TYPES
// ============================================================================

export interface DunningAttempt {
  id: string;
  invoiceId: string;
  attemptNumber: number;
  status: "pending" | "sent" | "failed" | "succeeded";
  method: "email" | "sms" | "notification";
  sentAt?: Date | string;
  nextAttemptAt?: Date | string;
  response?: Record<string, any>;
  createdAt: Date | string;
}

export interface DunningConfiguration {
  tenantId: string;
  enabled: boolean;
  maxAttempts: number;
  attemptSchedule: number[]; // Days between attempts [1, 3, 7, 14]
  methods: ("email" | "sms" | "notification")[];
  escalationRules?: DunningEscalationRule[];
}

export interface DunningEscalationRule {
  attemptNumber: number;
  action: "suspend" | "cancel" | "notify_admin" | "custom";
  customAction?: string;
}

// ============================================================================
// BILLING ANALYTICS TYPES
// ============================================================================

export interface BillingAnalytics {
  period: {
    start: Date | string;
    end: Date | string;
  };
  
  // Revenue
  totalRevenue: number;
  recurringRevenue: number;
  usageRevenue: number;
  oneTimeRevenue: number;
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  
  // Subscriptions
  activeSubscriptions: number;
  newSubscriptions: number;
  canceledSubscriptions: number;
  churnRate: number;
  
  // Invoices
  totalInvoices: number;
  paidInvoices: number;
  unpaidInvoices: number;
  overdueInvoices: number;
  averageInvoiceAmount: number;
  
  // Payments
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  paymentSuccessRate: number;
  averagePaymentAmount: number;
  
  // Usage
  totalUsage: Record<string, number>;
  usageCosts: Record<string, number>;
  
  // Trends
  revenueTrend: "up" | "down" | "stable";
  churnTrend: "up" | "down" | "stable";
  
  currency: string;
}

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

export interface BillingWebhook {
  id: string;
  tenantId: string;
  eventType: BillingWebhookEventType;
  payload: Record<string, any>;
  status: "pending" | "sent" | "failed" | "retrying";
  url: string;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt?: Date | string;
  sentAt?: Date | string;
  responseCode?: number;
  responseBody?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type BillingWebhookEventType =
  | "subscription.created"
  | "subscription.updated"
  | "subscription.canceled"
  | "invoice.created"
  | "invoice.paid"
  | "invoice.failed"
  | "payment.succeeded"
  | "payment.failed"
  | "payment.refunded"
  | "usage.recorded"
  | "proration.calculated"
  | "discount.applied"
  | "credit.applied";

// ============================================================================
// INVOICE TEMPLATE TYPES
// ============================================================================

export interface InvoiceTemplate {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  
  // Template Content
  header?: {
    logo?: string;
    companyName?: string;
    companyAddress?: string;
    companyContact?: string;
  };
  
  footer?: {
    terms?: string;
    notes?: string;
    footerText?: string;
  };
  
  // Styling
  styles?: {
    primaryColor?: string;
    fontFamily?: string;
    fontSize?: string;
  };
  
  // Fields
  fields: InvoiceTemplateField[];
  
  active: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface InvoiceTemplateField {
  field: string;
  label: string;
  visible: boolean;
  position: number;
  format?: string;
}

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

export interface IBillingService {
  // Subscription Management
  createSubscription(input: CreateSubscriptionInput): Promise<Subscription>;
  updateSubscription(id: string, input: UpdateSubscriptionInput): Promise<Subscription>;
  cancelSubscription(id: string, reason?: string): Promise<Subscription>;
  pauseSubscription(id: string): Promise<Subscription>;
  resumeSubscription(id: string): Promise<Subscription>;
  
  // Invoice Management
  generateInvoice(input: GenerateInvoiceInput): Promise<Invoice>;
  getInvoice(id: string): Promise<Invoice>;
  voidInvoice(id: string, reason?: string): Promise<Invoice>;
  sendInvoice(id: string): Promise<void>;
  
  // Payment Processing
  processPayment(input: ProcessPaymentInput): Promise<Payment>;
  retryPayment(paymentId: string): Promise<Payment>;
  refundPayment(paymentId: string, amount?: number, reason?: string): Promise<Refund>;
  
  // Usage Billing
  calculateUsageBilling(subscriptionId: string, period: { start: Date; end: Date }): Promise<UsageBillingCalculation>;
  recordUsage(input: RecordUsageInput): Promise<UsageRecord>;
  
  // Proration
  calculateProration(input: CalculateProrationInput): Promise<Proration>;
  applyProration(prorationId: string): Promise<void>;
  
  // Analytics
  getAnalytics(tenantId: string, period: { start: Date; end: Date }): Promise<BillingAnalytics>;
}

export interface CreateSubscriptionInput {
  tenantId: string;
  userId: string;
  planId: string;
  billingCycle: BillingCycle;
  quantity?: number;
  addons?: string[];
  paymentMethodId?: string;
  trialDays?: number;
  metadata?: Record<string, any>;
}

export interface UpdateSubscriptionInput {
  planId?: string;
  quantity?: number;
  addons?: string[];
  billingCycle?: BillingCycle;
  paymentMethodId?: string;
  autoRenew?: boolean;
  metadata?: Record<string, any>;
}

export interface GenerateInvoiceInput {
  tenantId: string;
  userId: string;
  subscriptionId?: string;
  type: "subscription" | "one_time" | "usage";
  lineItems: Omit<InvoiceLineItem, "id">[];
  dueDate?: Date | string;
  discounts?: string[];
  credits?: string[];
  metadata?: Record<string, any>;
}

export interface ProcessPaymentInput {
  invoiceId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentMethodId?: string;
  paymentMethodDetails?: PaymentMethodDetails;
  metadata?: Record<string, any>;
}

export interface RecordUsageInput {
  tenantId: string;
  userId: string;
  subscriptionId?: string;
  metricType: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  periodStart: Date | string;
  periodEnd: Date | string;
  metadata?: Record<string, any>;
}

export interface CalculateProrationInput {
  subscriptionId: string;
  changeType: ProrationType;
  fromPlanId?: string;
  toPlanId?: string;
  fromQuantity?: number;
  toQuantity?: number;
  effectiveDate: Date | string;
}
