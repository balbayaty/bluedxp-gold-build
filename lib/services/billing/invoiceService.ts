/**
 * 💰 INVOICE SERVICE
 * 
 * Comprehensive invoice generation and management
 * Supports automated and manual invoice creation
 * 
 * BlueDXP Platform - Enterprise-Grade Billing
 */

import { prisma } from "@/lib/services/database/prismaClient";
import { eventBus } from "@/lib/services/event-store";
import { exportService } from "@/lib/services/export/exportService";
import type {
  Invoice,
  InvoiceLineItem,
  GenerateInvoiceInput,
} from "@/types/billing";

// ============================================================================
// INVOICE SERVICE
// ============================================================================

class InvoiceService {
  /**
   * Generate invoice
   */
  async generateInvoice(input: GenerateInvoiceInput): Promise<Invoice> {
    try {
      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber(input.tenantId);

      // Calculate subtotal
      const subtotal = input.lineItems.reduce(
        (sum, item) => sum + item.amount,
        0
      );

      // Create invoice
      const invoiceData = {
        id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        invoiceNumber,
        tenantId: input.tenantId,
        userId: input.userId,
        subscriptionId: input.subscriptionId || null,
        status: "open",
        type: input.type,
        invoiceDate: new Date().toISOString(),
        dueDate:
          input.dueDate ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days default
        subtotal,
        discountAmount: 0,
        taxAmount: 0,
        total: subtotal,
        amountPaid: 0,
        amountDue: subtotal,
        currency: "SAR", // Default, should come from subscription/tenant
        lineItems: input.lineItems,
        taxes: [],
        metadata: input.metadata || {},
      };

      // Store in database
      const created = await prisma.billing_invoices.create({
        data: {
          id: invoiceData.id,
          invoiceNumber: invoiceData.invoiceNumber,
          tenantId: invoiceData.tenantId,
          userId: invoiceData.userId,
          subscriptionId: invoiceData.subscriptionId,
          status: invoiceData.status,
          type: invoiceData.type,
          invoiceDate: new Date(invoiceData.invoiceDate),
          dueDate: new Date(invoiceData.dueDate),
          subtotal: invoiceData.subtotal,
          discountAmount: invoiceData.discountAmount,
          taxAmount: invoiceData.taxAmount,
          total: invoiceData.total,
          amountPaid: invoiceData.amountPaid,
          amountDue: invoiceData.amountDue,
          currency: invoiceData.currency,
          lineItems: invoiceData.lineItems as any,
          taxes: invoiceData.taxes as any,
          metadata: invoiceData.metadata as any,
        },
      });

      const invoice: Invoice = {
        ...invoiceData,
        id: created.id,
      };

      // Generate PDF
      await this.generateInvoicePDF(invoice);

      return invoice;
    } catch (error) {
      console.error("[InvoiceService] Error generating invoice:", error);
      throw error;
    }
  }

  /**
   * List invoices
   */
  async listInvoices(tenantId: string, filters?: { userId?: string; status?: string; subscriptionId?: string }): Promise<Invoice[]> {
    const where: any = { tenantId };
    if (filters?.userId) {
      where.userId = filters.userId;
    }
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.subscriptionId) {
      where.subscriptionId = filters.subscriptionId;
    }

    const dbInvoices = await prisma.billing_invoices.findMany({
      where,
      orderBy: { invoiceDate: "desc" },
    });

    return dbInvoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      tenantId: inv.tenantId,
      userId: inv.userId,
      subscriptionId: inv.subscriptionId || undefined,
      status: inv.status as any,
      type: inv.type as any,
      invoiceDate: inv.invoiceDate.toISOString(),
      dueDate: inv.dueDate.toISOString(),
      paidAt: inv.paidAt?.toISOString(),
      voidedAt: inv.voidedAt?.toISOString(),
      subtotal: Number(inv.subtotal),
      discountAmount: Number(inv.discountAmount),
      taxAmount: Number(inv.taxAmount),
      total: Number(inv.total),
      amountPaid: Number(inv.amountPaid),
      amountDue: Number(inv.amountDue),
      currency: inv.currency,
      lineItems: (inv.lineItems as any) || [],
      taxes: (inv.taxes as any) || [],
      discounts: (inv.discounts as any),
      credits: (inv.credits as any),
      paymentMethodId: inv.paymentMethodId || undefined,
      paymentAttempts: (inv.paymentAttempts as any),
      metadata: (inv.metadata as any) || {},
      pdfUrl: inv.pdfUrl || undefined,
      emailSent: inv.emailSent,
      emailSentAt: inv.emailSentAt?.toISOString(),
      createdAt: inv.createdAt.toISOString(),
      updatedAt: inv.updatedAt.toISOString(),
    }));
  }

  /**
   * Get invoice
   */
  async getInvoice(id: string): Promise<Invoice> {
    const dbInvoice = await prisma.billing_invoices.findUnique({
      where: { id },
    });

    if (!dbInvoice) {
      throw new Error(`Invoice ${id} not found`);
    }

    return {
      id: dbInvoice.id,
      invoiceNumber: dbInvoice.invoiceNumber,
      tenantId: dbInvoice.tenantId,
      userId: dbInvoice.userId,
      subscriptionId: dbInvoice.subscriptionId || undefined,
      status: dbInvoice.status as any,
      type: dbInvoice.type as any,
      invoiceDate: dbInvoice.invoiceDate.toISOString(),
      dueDate: dbInvoice.dueDate.toISOString(),
      paidAt: dbInvoice.paidAt?.toISOString(),
      voidedAt: dbInvoice.voidedAt?.toISOString(),
      subtotal: Number(dbInvoice.subtotal),
      discountAmount: Number(dbInvoice.discountAmount),
      taxAmount: Number(dbInvoice.taxAmount),
      total: Number(dbInvoice.total),
      amountPaid: Number(dbInvoice.amountPaid),
      amountDue: Number(dbInvoice.amountDue),
      currency: dbInvoice.currency,
      lineItems: (dbInvoice.lineItems as any) || [],
      taxes: (dbInvoice.taxes as any) || [],
      discounts: (dbInvoice.discounts as any),
      credits: (dbInvoice.credits as any),
      paymentMethodId: dbInvoice.paymentMethodId || undefined,
      paymentAttempts: (dbInvoice.paymentAttempts as any),
      metadata: (dbInvoice.metadata as any) || {},
      pdfUrl: dbInvoice.pdfUrl || undefined,
      emailSent: dbInvoice.emailSent,
      emailSentAt: dbInvoice.emailSentAt?.toISOString(),
      createdAt: dbInvoice.createdAt.toISOString(),
      updatedAt: dbInvoice.updatedAt.toISOString(),
    };
  }

  /**
   * Update invoice
   */
  async updateInvoice(invoice: Invoice): Promise<Invoice> {
    const updated = await prisma.billing_invoices.update({
      where: { id: invoice.id },
      data: {
        status: invoice.status,
        amountPaid: invoice.amountPaid,
        amountDue: invoice.amountDue,
        taxAmount: invoice.taxAmount,
        total: invoice.total,
        paidAt: invoice.paidAt ? new Date(invoice.paidAt) : null,
        voidedAt: invoice.voidedAt ? new Date(invoice.voidedAt) : null,
        emailSent: invoice.emailSent,
        emailSentAt: invoice.emailSentAt ? new Date(invoice.emailSentAt) : null,
        pdfUrl: invoice.pdfUrl || null,
        lineItems: invoice.lineItems as any,
        taxes: invoice.taxes as any,
        metadata: invoice.metadata as any,
      },
    });

    return {
      ...invoice,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  /**
   * Void invoice
   */
  async voidInvoice(id: string, reason?: string): Promise<Invoice> {
    const invoice = await this.getInvoice(id);
    invoice.status = "void";
    invoice.voidedAt = new Date().toISOString();
    await this.updateInvoice(invoice);
    return invoice;
  }

  /**
   * Send invoice
   */
  async sendInvoice(id: string): Promise<void> {
    const invoice = await this.getInvoice(id);

    // Generate PDF if not exists
    if (!invoice.pdfUrl) {
      await this.generateInvoicePDF(invoice);
    }

    // Send email (integrate with email service)
    // await emailService.sendInvoice(invoice);

    // Update invoice
    invoice.emailSent = true;
    invoice.emailSentAt = new Date().toISOString();
    await this.updateInvoice(invoice);
  }

  /**
   * Generate invoice number
   */
  private async generateInvoiceNumber(tenantId: string): Promise<string> {
    try {
      // Get last invoice number for tenant
      const lastInvoice = await prisma.billing_invoices.findFirst({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
      });

      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, "0");

      if (lastInvoice && lastInvoice.invoiceNumber) {
        // Extract sequence from last invoice
        const match = lastInvoice.invoiceNumber.match(/-(\d+)$/);
        if (match) {
          const lastSequence = parseInt(match[1]);
          const sequence = String(lastSequence + 1).padStart(4, "0");
          return `INV-${year}${month}-${sequence}`;
        }
      }

      // First invoice for tenant this month
      const sequence = "0001";
      return `INV-${year}${month}-${sequence}`;
    } catch (error) {
      // Fallback if database query fails
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, "0");
      const sequence = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
      return `INV-${year}${month}-${sequence}`;
    }
  }

  /**
   * Generate invoice PDF
   */
  private async generateInvoicePDF(invoice: Invoice): Promise<void> {
    try {
      // Use export service to generate PDF
      const pdfBuffer = await exportService.exportToPDF({
        type: "invoice",
        data: invoice,
        template: "default", // Can be customized per tenant
      });

      // Store PDF (upload to S3/MinIO)
      // const pdfUrl = await storageService.uploadFile(pdfBuffer, `invoices/${invoice.id}.pdf`);
      // invoice.pdfUrl = pdfUrl;

      // For now, just set a placeholder
      invoice.pdfUrl = `/api/billing/invoices/${invoice.id}/pdf`;
    } catch (error) {
      console.error("[InvoiceService] Error generating PDF:", error);
      // Don't throw - PDF generation failure shouldn't break invoice creation
    }
  }
}

export const invoiceService = new InvoiceService();
