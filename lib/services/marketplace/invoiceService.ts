import { paymentService } from "./paymentService";
import { invoiceService as billingInvoiceService } from "@/lib/services/billing/invoiceService";
import { eventBus } from "@/lib/services/event-store";
import type { MarketplaceBooking } from "@/types/marketplace";

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  taxRate?: number;
  taxAmount?: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  bookingId: string;
  customerId: string;
  providerId: string;
  issueDate: string;
  dueDate: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  paymentId?: string;
  paymentMethod?: string;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  template: string;
  variables: string[];
}

class InvoiceService {
  private invoices: Map<string, Invoice> = new Map();
  private invoiceCounter = 1;

  /**
   * Generate invoice from booking
   * INTEGRATED: Now uses comprehensive billing system
   */
  async generateInvoice(
    booking: MarketplaceBooking,
    items: InvoiceItem[],
    options?: {
      taxRate?: number;
      dueDays?: number;
      notes?: string;
    },
  ): Promise<Invoice> {
    const taxRate = options?.taxRate ?? 0.15; // 15% VAT for Saudi Arabia
    const dueDays = options?.dueDays ?? 30;

    // Convert marketplace items to billing line items
    const lineItems = items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.total,
      type: "product" as const,
      metadata: {
        marketplace: true,
        bookingId: booking.id,
        providerId: booking.providerId,
      },
    }));

    // Use comprehensive billing invoice service
    const billingInvoice = await billingInvoiceService.generateInvoice({
      tenantId: booking.tenantId || "default-tenant",
      userId: booking.customerId,
      type: "one_time",
      lineItems,
      dueDate: new Date(
        Date.now() + dueDays * 24 * 60 * 60 * 1000,
      ).toISOString(),
      metadata: {
        marketplace: true,
        bookingId: booking.id,
        providerId: booking.providerId,
        customerId: booking.customerId,
        notes: options?.notes,
      },
    });

    // Convert billing invoice to marketplace invoice format
    const invoice: Invoice = {
      id: billingInvoice.id,
      invoiceNumber: billingInvoice.invoiceNumber,
      bookingId: booking.id,
      customerId: booking.customerId,
      providerId: booking.providerId,
      issueDate: billingInvoice.invoiceDate,
      dueDate: billingInvoice.dueDate,
      status: billingInvoice.status === "paid" ? "paid" : billingInvoice.status === "open" ? "sent" : "draft",
      items,
      subtotal: Number(billingInvoice.subtotal),
      tax: Number(billingInvoice.taxAmount),
      total: Number(billingInvoice.total),
      currency: billingInvoice.currency,
      notes: options?.notes,
      metadata: billingInvoice.metadata as any,
      createdAt: billingInvoice.createdAt || new Date().toISOString(),
      updatedAt: billingInvoice.updatedAt || new Date().toISOString(),
    };

    // Store in local map for backward compatibility
    this.invoices.set(invoice.id, invoice);

    // Publish event
    await eventBus.publish("marketplace.invoice.created", {
      invoiceId: invoice.id,
      bookingId: booking.id,
      customerId: booking.customerId,
      providerId: booking.providerId,
      amount: invoice.total,
    });

    return invoice;
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(id: string): Promise<Invoice | null> {
    return this.invoices.get(id) || null;
  }

  /**
   * Get invoice by booking ID
   */
  async getInvoiceByBooking(bookingId: string): Promise<Invoice | null> {
    const invoices = Array.from(this.invoices.values());
    return invoices.find((inv) => inv.bookingId === bookingId) || null;
  }

  /**
   * Get invoices for a customer
   */
  async getInvoicesByCustomer(customerId: string): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(
      (inv) => inv.customerId === customerId,
    );
  }

  /**
   * Get invoices for a provider
   */
  async getInvoicesByProvider(providerId: string): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(
      (inv) => inv.providerId === providerId,
    );
  }

  /**
   * Update invoice status
   */
  async updateInvoiceStatus(
    id: string,
    status: Invoice["status"],
    paymentId?: string,
  ): Promise<Invoice | null> {
    const invoice = this.invoices.get(id);
    if (!invoice) {
      return null;
    }

    const updated: Invoice = {
      ...invoice,
      status,
      paymentId: paymentId || invoice.paymentId,
      paidAt: status === "paid" ? new Date().toISOString() : invoice.paidAt,
      updatedAt: new Date().toISOString(),
    };

    this.invoices.set(id, updated);

    return updated;
  }

  /**
   * Mark invoice as paid
   * INTEGRATED: Now uses comprehensive billing system
   */
  async markInvoiceAsPaid(
    id: string,
    paymentId: string,
    paymentMethod?: string,
  ): Promise<Invoice | null> {
    // Update in billing system
    try {
      const billingInvoice = await billingInvoiceService.getInvoice(id);
      if (billingInvoice) {
        await billingInvoiceService.updateInvoice(id, {
          status: "paid",
          amountPaid: billingInvoice.total,
          amountDue: 0,
          metadata: {
            ...(billingInvoice.metadata as any),
            paymentId,
            paymentMethod,
            paidAt: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      console.error("[Marketplace Invoice] Error updating in billing system:", error);
    }

    // Update local map
    const invoice = this.invoices.get(id);
    if (invoice) {
      const updated: Invoice = {
        ...invoice,
        status: "paid",
        paymentId,
        paymentMethod,
        paidAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.invoices.set(id, updated);
      return updated;
    }

    return null;
  }

  /**
   * Generate ZATCA-compliant QR code data
   */
  async generateZATCAQRCode(invoice: Invoice): Promise<string> {
    // ZATCA QR code format (simplified)
    const qrData = {
      sellerName: "Provider Name", // Should come from provider data
      vatRegistrationNumber: "123456789012345", // Should come from provider data
      invoiceDate: invoice.issueDate,
      invoiceTotal: invoice.total,
      vatTotal: invoice.tax,
    };

    // In production, this would generate an actual QR code
    return JSON.stringify(qrData);
  }

  /**
   * Export invoice as PDF (placeholder - would use actual PDF library)
   */
  async exportInvoiceAsPDF(invoice: Invoice): Promise<Buffer> {
    // Placeholder - in production, use a PDF library like pdfkit or puppeteer
    const pdfContent = `Invoice ${invoice.invoiceNumber}\n\nTotal: ${invoice.total} ${invoice.currency}`;
    return Buffer.from(pdfContent);
  }

  /**
   * Get invoice statistics
   */
  async getInvoiceStats(
    providerId?: string,
    customerId?: string,
  ): Promise<{
    totalInvoices: number;
    paidInvoices: number;
    pendingInvoices: number;
    overdueInvoices: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
  }> {
    let invoices = Array.from(this.invoices.values());

    if (providerId) {
      invoices = invoices.filter((inv) => inv.providerId === providerId);
    }

    if (customerId) {
      invoices = invoices.filter((inv) => inv.customerId === customerId);
    }

    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter((inv) => inv.status === "paid").length;
    const pendingInvoices = invoices.filter(
      (inv) => inv.status === "sent" || inv.status === "draft",
    ).length;
    const overdueInvoices = invoices.filter((inv) => {
      if (inv.status === "overdue") return true;
      if (inv.status === "sent" && new Date(inv.dueDate) < new Date())
        return true;
      return false;
    }).length;

    const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const paidAmount = invoices
      .filter((inv) => inv.status === "paid")
      .reduce((sum, inv) => sum + inv.total, 0);
    const pendingAmount = invoices
      .filter((inv) => inv.status === "sent" || inv.status === "draft")
      .reduce((sum, inv) => sum + inv.total, 0);

    return {
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      totalAmount,
      paidAmount,
      pendingAmount,
    };
  }
}

export const invoiceService = new InvoiceService();
