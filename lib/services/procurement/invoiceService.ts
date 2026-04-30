/**
 * Invoice Service
 * Comprehensive invoice processing - receipt, matching, approval, payment scheduling
 * Integrates with Finance AP module (ZERO DUPLICATION)
 */

import { eventBus } from "@/lib/services/event-store";
import { purchaseOrderService } from "./purchaseOrderService";
import { goodsReceiptService } from "./goodsReceiptService";
import { financeIntegrationService } from "./integration/financeIntegration";
import type { DomainEvent } from "@/types/cqrs";
import type { InvoiceStatus, MatchingType } from "@/types/procurement";

export interface Invoice {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  vendorInvoiceNumber: string;
  vendorId: string;
  vendorName: string;
  purchaseOrderId: string;
  poNumber: string;
  invoiceDate: Date | string;
  dueDate: Date | string;
  status: InvoiceStatus;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  paymentTerms: string;
  matchingType?: MatchingType;
  matchingStatus: "PENDING" | "MATCHED" | "PARTIAL" | "DISPUTED";
  matchingDetails?: MatchingDetails;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  approvedBy?: string;
  approvedAt?: Date | string;
  rejectionReason?: string;
  paymentStatus: "PENDING" | "SCHEDULED" | "PAID" | "PARTIAL";
  paymentSchedule?: PaymentSchedule;
  apRecordId?: string;
  notes?: string;
  attachments?: Attachment[];
  createdAt: Date | string;
  createdBy: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  purchaseOrderItemId?: string;
  goodsReceiptItemId?: string;
  lineNumber: number;
  itemCode?: string;
  itemName: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  currency: string;
  taxRate?: number;
  taxAmount?: number;
  discountRate?: number;
  discountAmount?: number;
  netAmount: number;
  matchedQuantity?: number;
  matchedAmount?: number;
}

export interface MatchingDetails {
  poMatch: {
    matched: boolean;
    poTotal: number;
    invoiceTotal: number;
    variance: number;
    variancePercentage: number;
  };
  grnMatch?: {
    matched: boolean;
    grnTotal: number;
    invoiceTotal: number;
    variance: number;
    variancePercentage: number;
  };
  contractMatch?: {
    matched: boolean;
    contractTotal: number;
    invoiceTotal: number;
    variance: number;
    variancePercentage: number;
  };
  overallMatch: boolean;
  discrepancies?: Array<{
    type: "PRICE" | "QUANTITY" | "ITEM" | "OTHER";
    description: string;
    severity: "LOW" | "MEDIUM" | "HIGH";
  }>;
}

export interface PaymentSchedule {
  scheduledDate: Date | string;
  scheduledAmount: number;
  currency: string;
  earlyPaymentDiscount?: {
    discountRate: number;
    discountAmount: number;
    discountDate: Date | string;
  };
  paymentMethod?: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  uploadedAt: Date | string;
  uploadedBy: string;
}

// In-memory storage
const invoices = new Map<string, Invoice>();

// Invoice number generator
let invoiceCounter = 1;

function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const number = String(invoiceCounter++).padStart(6, "0");
  return `INV-${year}-${number}`;
}

export class InvoiceService {
  /**
   * Receive vendor invoice
   * Creates invoice record and attempts auto-matching
   */
  async receiveInvoice(
    tenantId: string,
    purchaseOrderId: string,
    vendorInvoiceNumber: string,
    invoiceDate: Date | string,
    items: Array<{
      purchaseOrderItemId?: string;
      itemName: string;
      description?: string;
      quantity: number;
      unit: string;
      unitPrice: number;
      taxRate?: number;
      discountRate?: number;
    }>,
    paymentTerms: string,
    currency: string,
    receivedBy: string,
  ): Promise<Invoice> {
    // Get Purchase Order
    const po = await purchaseOrderService.getPurchaseOrder(
      purchaseOrderId,
      tenantId,
    );
    if (!po) {
      throw new Error("Purchase order not found");
    }

    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;
    let discountAmount = 0;

    const invoiceItems: InvoiceItem[] = items.map((item, index) => {
      const itemSubtotal = item.unitPrice * item.quantity;
      const itemTax = item.taxRate ? (itemSubtotal * item.taxRate) / 100 : 0;
      const itemDiscount = item.discountRate
        ? (itemSubtotal * item.discountRate) / 100
        : 0;
      const itemNetAmount = itemSubtotal + itemTax - itemDiscount;

      subtotal += itemSubtotal;
      taxAmount += itemTax;
      discountAmount += itemDiscount;

      return {
        id: `item-${Date.now()}-${index + 1}`,
        invoiceId: "", // Will be set below
        purchaseOrderItemId: item.purchaseOrderItemId,
        lineNumber: index + 1,
        itemName: item.itemName,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        totalPrice: itemSubtotal,
        currency,
        taxRate: item.taxRate,
        taxAmount: itemTax,
        discountRate: item.discountRate,
        discountAmount: itemDiscount,
        netAmount: itemNetAmount,
      };
    });

    const totalAmount = subtotal + taxAmount - discountAmount;

    // Calculate due date from payment terms
    const dueDate = this.calculateDueDate(invoiceDate, paymentTerms);

    // Generate invoice number
    const invoiceNumber = generateInvoiceNumber();
    const invoiceId = `inv-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    // Set invoice ID on items
    invoiceItems.forEach((item) => {
      item.invoiceId = invoiceId;
    });

    // Create invoice
    const invoice: Invoice = {
      id: invoiceId,
      tenantId,
      invoiceNumber,
      vendorInvoiceNumber,
      vendorId: po.vendorId,
      vendorName: po.vendorName,
      purchaseOrderId,
      poNumber: po.poNumber,
      invoiceDate,
      dueDate,
      status: "RECEIVED",
      items: invoiceItems,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      currency,
      paymentTerms,
      matchingStatus: "PENDING",
      approvalStatus: "PENDING",
      paymentStatus: "PENDING",
      createdAt: new Date().toISOString(),
      createdBy: receivedBy,
    };

    // Attempt auto-matching
    const matchingResult = await this.matchInvoice(
      invoiceId,
      tenantId,
      "3_WAY",
    );
    invoice.matchingDetails = matchingResult.matchingDetails;
    invoice.matchingStatus = matchingResult.matchingStatus;
    invoice.matchingType = "3_WAY";

    // If matched, auto-approve if within tolerance
    if (matchingResult.matchingStatus === "MATCHED") {
      invoice.status = "MATCHED";
      // Auto-approve if no discrepancies or only low-severity
      const hasHighSeverityDiscrepancies =
        matchingResult.matchingDetails?.discrepancies?.some(
          (d) => d.severity === "HIGH",
        );
      if (!hasHighSeverityDiscrepancies) {
        invoice.approvalStatus = "APPROVED";
        invoice.status = "APPROVED";
      }
    } else {
      invoice.status = "PENDING_MATCHING";
    }

    invoices.set(invoiceId, invoice);

    // Update PO invoice status
    po.invoiceStatus = "PARTIAL"; // Will be updated to COMPLETE when all invoices are received
    po.isMatched = matchingResult.matchingStatus === "MATCHED";

    // Publish event
    await eventBus.publish({
      type: "procurement.invoice.received",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        invoiceId,
        invoiceNumber,
        tenantId,
        purchaseOrderId,
        poNumber: po.poNumber,
        vendorId: po.vendorId,
        totalAmount,
        currency,
        matchingStatus: invoice.matchingStatus,
      },
    } as DomainEvent);

    return invoice;
  }

  /**
   * Match invoice with PO, GRN, and optionally Contract
   */
  async matchInvoice(
    invoiceId: string,
    tenantId: string,
    matchingType: MatchingType,
  ): Promise<{
    matchingStatus: "MATCHED" | "PARTIAL" | "DISPUTED";
    matchingDetails: MatchingDetails;
  }> {
    const invoice = invoices.get(invoiceId);
    if (!invoice || invoice.tenantId !== tenantId) {
      throw new Error("Invoice not found");
    }

    // Get PO
    const po = await purchaseOrderService.getPurchaseOrder(
      invoice.purchaseOrderId,
      tenantId,
    );
    if (!po) {
      throw new Error("Purchase order not found");
    }

    // 2-way matching: PO vs Invoice
    const poVariance = Math.abs(po.totalAmount - invoice.totalAmount);
    const poVariancePercentage =
      po.totalAmount > 0 ? (poVariance / po.totalAmount) * 100 : 0;
    const poMatched = poVariancePercentage <= 5; // 5% tolerance

    const matchingDetails: MatchingDetails = {
      poMatch: {
        matched: poMatched,
        poTotal: po.totalAmount,
        invoiceTotal: invoice.totalAmount,
        variance: poVariance,
        variancePercentage: poVariancePercentage,
      },
      overallMatch: poMatched,
    };

    // 3-way matching: PO vs GRN vs Invoice
    if (matchingType === "3_WAY" || matchingType === "4_WAY") {
      const grns = await goodsReceiptService.listGoodsReceipts(tenantId, {
        purchaseOrderId: invoice.purchaseOrderId,
      });

      const totalGRNAmount = grns
        .filter((grn) => grn.status === "COMPLETE")
        .reduce((sum, grn) => sum + grn.totalAmount, 0);

      const grnVariance = Math.abs(totalGRNAmount - invoice.totalAmount);
      const grnVariancePercentage =
        totalGRNAmount > 0 ? (grnVariance / totalGRNAmount) * 100 : 0;
      const grnMatched = grnVariancePercentage <= 5;

      matchingDetails.grnMatch = {
        matched: grnMatched,
        grnTotal: totalGRNAmount,
        invoiceTotal: invoice.totalAmount,
        variance: grnVariance,
        variancePercentage: grnVariancePercentage,
      };

      matchingDetails.overallMatch = poMatched && grnMatched;
    }

    // 4-way matching: PO vs GRN vs Invoice vs Contract
    if (matchingType === "4_WAY" && po.contractId) {
      // TODO: Get contract and compare
      // const contract = await contractService.getContract(po.contractId, tenantId)
      // if (contract) {
      //   matchingDetails.contractMatch = { ... }
      // }
    }

    // Check for discrepancies
    const discrepancies: MatchingDetails["discrepancies"] = [];
    if (poVariancePercentage > 5) {
      discrepancies.push({
        type: "PRICE",
        description: `Price variance: ${poVariancePercentage.toFixed(2)}%`,
        severity: poVariancePercentage > 10 ? "HIGH" : "MEDIUM",
      });
    }

    if (matchingDetails.grnMatch && !matchingDetails.grnMatch.matched) {
      discrepancies.push({
        type: "QUANTITY",
        description: `GRN quantity mismatch`,
        severity: "MEDIUM",
      });
    }

    matchingDetails.discrepancies =
      discrepancies.length > 0 ? discrepancies : undefined;

    let matchingStatus: "MATCHED" | "PARTIAL" | "DISPUTED" = "MATCHED";
    if (!matchingDetails.overallMatch) {
      matchingStatus = discrepancies.some((d) => d.severity === "HIGH")
        ? "DISPUTED"
        : "PARTIAL";
    }

    return { matchingStatus, matchingDetails };
  }

  /**
   * Approve invoice
   * Creates AP record and schedules payment
   */
  async approveInvoice(
    invoiceId: string,
    tenantId: string,
    approverId: string,
    comments?: string,
  ): Promise<Invoice> {
    const invoice = invoices.get(invoiceId);
    if (!invoice || invoice.tenantId !== tenantId) {
      throw new Error("Invoice not found");
    }

    if (invoice.approvalStatus !== "PENDING") {
      throw new Error("Invoice is not pending approval");
    }

    invoice.approvalStatus = "APPROVED";
    invoice.status = "APPROVED";
    invoice.approvedBy = approverId;
    invoice.approvedAt = new Date().toISOString();

    // Create AP record in Finance module
    const apRecordId = await financeIntegrationService.createAccountsPayable(
      tenantId,
      invoice.purchaseOrderId,
      invoice.vendorId,
      invoice.vendorInvoiceNumber,
      invoice.invoiceDate,
      invoice.totalAmount,
      invoice.currency,
      invoice.items.map((item) => ({
        itemId: item.id,
        description: item.itemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
    );

    invoice.apRecordId = apRecordId;

    // Schedule payment
    const paymentSchedule = this.calculatePaymentSchedule(
      invoice.invoiceDate,
      invoice.dueDate,
      invoice.paymentTerms,
      invoice.totalAmount,
      invoice.currency,
    );
    invoice.paymentSchedule = paymentSchedule;
    invoice.paymentStatus = "SCHEDULED";

    invoices.set(invoiceId, invoice);

    // Update PO invoice status
    const po = await purchaseOrderService.getPurchaseOrder(
      invoice.purchaseOrderId,
      tenantId,
    );
    if (po) {
      po.invoiceStatus = "COMPLETE";
      po.isMatched = true;
    }

    // Publish event
    await eventBus.publish({
      type: "procurement.invoice.approved",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        tenantId,
        purchaseOrderId: invoice.purchaseOrderId,
        apRecordId,
        totalAmount: invoice.totalAmount,
        currency: invoice.currency,
        approverId,
      },
    } as DomainEvent);

    return invoice;
  }

  /**
   * Reject invoice
   */
  async rejectInvoice(
    invoiceId: string,
    tenantId: string,
    rejectorId: string,
    rejectionReason: string,
  ): Promise<Invoice> {
    const invoice = invoices.get(invoiceId);
    if (!invoice || invoice.tenantId !== tenantId) {
      throw new Error("Invoice not found");
    }

    invoice.approvalStatus = "REJECTED";
    invoice.status = "DISPUTED";
    invoice.rejectionReason = rejectionReason;
    invoice.matchingStatus = "DISPUTED";

    invoices.set(invoiceId, invoice);

    // Publish event
    await eventBus.publish({
      type: "procurement.invoice.rejected",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        tenantId,
        rejectionReason,
        rejectorId,
      },
    } as DomainEvent);

    return invoice;
  }

  /**
   * Calculate due date from payment terms
   */
  private calculateDueDate(
    invoiceDate: Date | string,
    paymentTerms: string,
  ): Date | string {
    const date = new Date(invoiceDate);
    const terms = paymentTerms.toLowerCase();

    // Parse common payment terms
    if (terms.includes("net 30") || terms.includes("n30")) {
      date.setDate(date.getDate() + 30);
    } else if (terms.includes("net 60") || terms.includes("n60")) {
      date.setDate(date.getDate() + 60);
    } else if (terms.includes("net 90") || terms.includes("n90")) {
      date.setDate(date.getDate() + 90);
    } else if (terms.includes("2/10 net 30")) {
      date.setDate(date.getDate() + 30);
    } else {
      // Default to 30 days
      date.setDate(date.getDate() + 30);
    }

    return date.toISOString();
  }

  /**
   * Calculate payment schedule with early payment discount
   */
  private calculatePaymentSchedule(
    invoiceDate: Date | string,
    dueDate: Date | string,
    paymentTerms: string,
    amount: number,
    currency: string,
  ): PaymentSchedule {
    const terms = paymentTerms.toLowerCase();
    const schedule: PaymentSchedule = {
      scheduledDate: dueDate,
      scheduledAmount: amount,
      currency,
    };

    // Check for early payment discount (e.g., "2/10 net 30")
    if (terms.includes("2/10")) {
      const discountRate = 0.02; // 2%
      const discountAmount = amount * discountRate;
      const discountDate = new Date(invoiceDate);
      discountDate.setDate(discountDate.getDate() + 10);

      schedule.earlyPaymentDiscount = {
        discountRate,
        discountAmount,
        discountDate: discountDate.toISOString(),
      };
    }

    return schedule;
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(
    invoiceId: string,
    tenantId: string,
  ): Promise<Invoice | null> {
    const invoice = invoices.get(invoiceId);
    if (!invoice || invoice.tenantId !== tenantId) {
      return null;
    }
    return invoice;
  }

  /**
   * List invoices
   */
  async listInvoices(
    tenantId: string,
    filters?: {
      purchaseOrderId?: string;
      vendorId?: string;
      status?: InvoiceStatus[];
      dateFrom?: Date | string;
      dateTo?: Date | string;
    },
  ): Promise<Invoice[]> {
    let results = Array.from(invoices.values()).filter(
      (inv) => inv.tenantId === tenantId,
    );

    if (filters) {
      if (filters.purchaseOrderId) {
        results = results.filter(
          (inv) => inv.purchaseOrderId === filters.purchaseOrderId,
        );
      }
      if (filters.vendorId) {
        results = results.filter((inv) => inv.vendorId === filters.vendorId);
      }
      if (filters.status && filters.status.length > 0) {
        results = results.filter((inv) => filters.status!.includes(inv.status));
      }
      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        results = results.filter(
          (inv) => new Date(inv.invoiceDate) >= fromDate,
        );
      }
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        results = results.filter((inv) => new Date(inv.invoiceDate) <= toDate);
      }
    }

    // Sort by invoice date (newest first)
    results.sort((a, b) => {
      return (
        new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()
      );
    });

    return results;
  }
}

// Singleton instance
export const invoiceService = new InvoiceService();
