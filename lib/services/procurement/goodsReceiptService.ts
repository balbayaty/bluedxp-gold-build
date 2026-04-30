/**
 * Goods Receipt Service
 * Comprehensive goods receipt and inspection management
 * Integrates with WMS, Purchase Orders, and Finance (AP creation)
 */

import { eventBus } from "@/lib/services/event-store";
import { purchaseOrderService } from "./purchaseOrderService";
import { financeIntegrationService } from "./integration/financeIntegration";
import type { DomainEvent } from "@/types/cqrs";
import type { GoodsReceiptStatus, MatchingType } from "@/types/procurement";

export interface GoodsReceipt {
  id: string;
  tenantId: string;
  grnNumber: string;
  purchaseOrderId: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  receiptDate: Date | string;
  status: GoodsReceiptStatus;
  items: GoodsReceiptItem[];
  totalQuantity: number;
  totalAmount: number;
  currency: string;
  warehouseId?: string;
  warehouseName?: string;
  location?: string;
  receivedBy: string;
  inspectedBy?: string;
  inspectionDate?: Date | string;
  inspectionStatus?: "PENDING" | "PASSED" | "FAILED" | "PARTIAL";
  qualityCheck?: QualityCheck;
  notes?: string;
  attachments?: Attachment[];
  createdAt: Date | string;
  createdBy: string;
}

export interface GoodsReceiptItem {
  id: string;
  goodsReceiptId: string;
  purchaseOrderItemId: string;
  lineNumber: number;
  itemCode?: string;
  itemName: string;
  orderedQuantity: number;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  currency: string;
  batchNumber?: string;
  serialNumbers?: string[];
  expiryDate?: Date | string;
  location?: string;
  qualityStatus?: "PENDING" | "ACCEPTED" | "REJECTED" | "PARTIAL";
  rejectionReason?: string;
}

export interface QualityCheck {
  id: string;
  goodsReceiptId: string;
  checkedBy: string;
  checkedAt: Date | string;
  items: Array<{
    itemId: string;
    itemName: string;
    qualityStatus: "PASSED" | "FAILED" | "PARTIAL";
    defects?: Array<{
      type: string;
      description: string;
      severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    }>;
    testResults?: Array<{
      testName: string;
      result: string;
      passed: boolean;
    }>;
    certificates?: Array<{
      type: string;
      certificateNumber: string;
      issuedBy: string;
      expiryDate?: Date | string;
      fileUrl?: string;
    }>;
  }>;
  overallStatus: "PASSED" | "FAILED" | "PARTIAL";
  notes?: string;
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
const goodsReceipts = new Map<string, GoodsReceipt>();

// GRN number generator
let grnCounter = 1;

function generateGRNNumber(): string {
  const year = new Date().getFullYear();
  const number = String(grnCounter++).padStart(6, "0");
  return `GRN-${year}-${number}`;
}

export class GoodsReceiptService {
  /**
   * Create Goods Receipt Note (GRN)
   * Called when goods are received from vendor
   */
  async createGoodsReceipt(
    tenantId: string,
    purchaseOrderId: string,
    items: Array<{
      purchaseOrderItemId: string;
      receivedQuantity: number;
      batchNumber?: string;
      serialNumbers?: string[];
      expiryDate?: Date | string;
      location?: string;
    }>,
    warehouseId?: string,
    warehouseName?: string,
    location?: string,
    receivedBy: string,
  ): Promise<GoodsReceipt> {
    // Get Purchase Order
    const po = await purchaseOrderService.getPurchaseOrder(
      purchaseOrderId,
      tenantId,
    );
    if (!po) {
      throw new Error("Purchase order not found");
    }

    if (po.status === "CANCELLED" || po.status === "COMPLETED") {
      throw new Error("Cannot create GRN for cancelled or completed PO");
    }

    // Generate GRN number
    const grnNumber = generateGRNNumber();
    const grnId = `grn-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    // Create GRN items
    const grnItems: GoodsReceiptItem[] = [];
    let totalQuantity = 0;
    let totalAmount = 0;

    items.forEach((itemInput) => {
      const poItem = po.items.find(
        (i) => i.id === itemInput.purchaseOrderItemId,
      );
      if (!poItem) {
        throw new Error(`PO item not found: ${itemInput.purchaseOrderItemId}`);
      }

      const receivedQty = itemInput.receivedQuantity;
      const acceptedQty = receivedQty; // Initially accept all, can be adjusted after inspection
      const rejectedQty = 0;

      const itemTotal = poItem.unitPrice * acceptedQty;

      grnItems.push({
        id: `item-${grnId}-${grnItems.length + 1}`,
        goodsReceiptId: grnId,
        purchaseOrderItemId: poItem.id,
        lineNumber: poItem.lineNumber,
        itemCode: poItem.itemCode,
        itemName: poItem.itemName,
        orderedQuantity: poItem.quantity,
        receivedQuantity: receivedQty,
        acceptedQuantity: acceptedQty,
        rejectedQuantity: rejectedQty,
        unit: poItem.unit,
        unitPrice: poItem.unitPrice,
        totalPrice: itemTotal,
        currency: po.currency,
        batchNumber: itemInput.batchNumber,
        serialNumbers: itemInput.serialNumbers,
        expiryDate: itemInput.expiryDate,
        location: itemInput.location || location,
        qualityStatus: "PENDING",
      });

      totalQuantity += receivedQty;
      totalAmount += itemTotal;
    });

    // Create GRN
    const grn: GoodsReceipt = {
      id: grnId,
      tenantId,
      grnNumber,
      purchaseOrderId,
      poNumber: po.poNumber,
      vendorId: po.vendorId,
      vendorName: po.vendorName,
      receiptDate: new Date().toISOString(),
      status: "PENDING",
      items: grnItems,
      totalQuantity,
      totalAmount,
      currency: po.currency,
      warehouseId,
      warehouseName,
      location,
      receivedBy,
      inspectionStatus: "PENDING",
      createdAt: new Date().toISOString(),
      createdBy: receivedBy,
    };

    goodsReceipts.set(grnId, grn);

    // Update PO goods receipt status
    await purchaseOrderService.updateGoodsReceiptStatus(
      purchaseOrderId,
      tenantId,
      items.map((item) => ({
        itemId: item.purchaseOrderItemId,
        quantity: item.receivedQuantity,
      })),
    );

    // Publish event
    await eventBus.publish({
      type: "procurement.goods-receipt.created",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        goodsReceiptId: grnId,
        grnNumber,
        tenantId,
        purchaseOrderId,
        poNumber: po.poNumber,
        totalQuantity,
        totalAmount,
        currency: po.currency,
      },
    } as DomainEvent);

    return grn;
  }

  /**
   * Perform quality inspection
   */
  async performQualityInspection(
    goodsReceiptId: string,
    tenantId: string,
    inspectedBy: string,
    inspectionResults: Array<{
      itemId: string;
      qualityStatus: "ACCEPTED" | "REJECTED" | "PARTIAL";
      acceptedQuantity?: number;
      rejectedQuantity?: number;
      rejectionReason?: string;
      defects?: Array<{
        type: string;
        description: string;
        severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      }>;
      testResults?: Array<{
        testName: string;
        result: string;
        passed: boolean;
      }>;
      certificates?: Array<{
        type: string;
        certificateNumber: string;
        issuedBy: string;
        expiryDate?: Date | string;
        fileUrl?: string;
      }>;
    }>,
    notes?: string,
  ): Promise<GoodsReceipt> {
    const grn = goodsReceipts.get(goodsReceiptId);
    if (!grn || grn.tenantId !== tenantId) {
      throw new Error("Goods receipt not found");
    }

    // Update items with inspection results
    let allPassed = true;
    let allFailed = true;
    let hasPartial = false;

    inspectionResults.forEach((result) => {
      const item = grn.items.find((i) => i.id === result.itemId);
      if (item) {
        item.qualityStatus = result.qualityStatus;
        if (result.acceptedQuantity !== undefined) {
          item.acceptedQuantity = result.acceptedQuantity;
        }
        if (result.rejectedQuantity !== undefined) {
          item.rejectedQuantity = result.rejectedQuantity;
          item.receivedQuantity = item.acceptedQuantity + item.rejectedQuantity;
        }
        if (result.rejectionReason) {
          item.rejectionReason = result.rejectionReason;
        }

        if (result.qualityStatus === "PARTIAL") {
          hasPartial = true;
          allPassed = false;
          allFailed = false;
        } else if (result.qualityStatus === "REJECTED") {
          allPassed = false;
        } else if (result.qualityStatus === "ACCEPTED") {
          allFailed = false;
        }
      }
    });

    // Determine overall inspection status
    let overallStatus: "PASSED" | "FAILED" | "PARTIAL" = "PASSED";
    if (hasPartial) {
      overallStatus = "PARTIAL";
    } else if (allFailed) {
      overallStatus = "FAILED";
    } else if (!allPassed) {
      overallStatus = "PARTIAL";
    }

    // Create quality check record
    const qualityCheck: QualityCheck = {
      id: `qc-${Date.now()}`,
      goodsReceiptId,
      checkedBy: inspectedBy,
      checkedAt: new Date().toISOString(),
      items: inspectionResults.map((result) => ({
        itemId: result.itemId,
        itemName: grn.items.find((i) => i.id === result.itemId)?.itemName || "",
        qualityStatus: result.qualityStatus,
        defects: result.defects,
        testResults: result.testResults,
        certificates: result.certificates,
      })),
      overallStatus,
      notes,
    };

    grn.qualityCheck = qualityCheck;
    grn.inspectedBy = inspectedBy;
    grn.inspectionDate = new Date().toISOString();
    grn.inspectionStatus = overallStatus;

    // Update GRN status
    if (overallStatus === "FAILED") {
      grn.status = "REJECTED";
    } else if (overallStatus === "PARTIAL") {
      grn.status = "PARTIAL";
    } else {
      grn.status = "COMPLETE";
    }

    // Recalculate totals based on accepted quantities
    grn.totalQuantity = grn.items.reduce(
      (sum, item) => sum + item.acceptedQuantity,
      0,
    );
    grn.totalAmount = grn.items.reduce(
      (sum, item) => sum + item.unitPrice * item.acceptedQuantity,
      0,
    );

    goodsReceipts.set(goodsReceiptId, grn);

    // If inspection passed, post goods receipt
    if (overallStatus === "PASSED" || overallStatus === "PARTIAL") {
      await this.postGoodsReceipt(goodsReceiptId, tenantId, inspectedBy);
    }

    // Publish event
    await eventBus.publish({
      type: "procurement.goods-receipt.inspected",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        goodsReceiptId,
        grnNumber: grn.grnNumber,
        tenantId,
        inspectionStatus: overallStatus,
        inspectedBy,
      },
    } as DomainEvent);

    return grn;
  }

  /**
   * Post goods receipt
   * Updates inventory, creates AP entry, posts to GL
   */
  async postGoodsReceipt(
    goodsReceiptId: string,
    tenantId: string,
    postedBy: string,
  ): Promise<GoodsReceipt> {
    const grn = goodsReceipts.get(goodsReceiptId);
    if (!grn || grn.tenantId !== tenantId) {
      throw new Error("Goods receipt not found");
    }

    if (grn.status === "COMPLETE" || grn.status === "REJECTED") {
      throw new Error("Goods receipt already posted or rejected");
    }

    // Get PO
    const po = await purchaseOrderService.getPurchaseOrder(
      grn.purchaseOrderId,
      tenantId,
    );
    if (!po) {
      throw new Error("Purchase order not found");
    }

    // TODO: Update WMS inventory
    // await wmsService.updateInventory({
    //   warehouseId: grn.warehouseId,
    //   items: grn.items.map(item => ({
    //     itemCode: item.itemCode,
    //     quantity: item.acceptedQuantity,
    //     location: item.location,
    //   })),
    // })

    // Create AP entry in Finance module
    const apRecordId = await financeIntegrationService.createAccountsPayable(
      tenantId,
      grn.purchaseOrderId,
      grn.vendorId,
      `INV-${grn.grnNumber}`,
      grn.receiptDate,
      grn.totalAmount,
      grn.currency,
      grn.items.map((item) => ({
        itemId: item.id,
        description: item.itemName,
        quantity: item.acceptedQuantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
    );

    // Post to GL (debit inventory, credit accounts payable)
    await financeIntegrationService.postToGeneralLedger(
      tenantId,
      "GOODS_RECEIPT",
      goodsReceiptId,
      [
        {
          accountCode: "INVENTORY",
          debit: grn.totalAmount,
          credit: 0,
          description: `GRN ${grn.grnNumber} - Goods Receipt`,
          projectId: po.projectId,
        },
        {
          accountCode: "ACCOUNTS_PAYABLE",
          debit: 0,
          credit: grn.totalAmount,
          description: `GRN ${grn.grnNumber} - Accounts Payable`,
          projectId: po.projectId,
        },
      ],
      grn.currency,
    );

    // Update GRN status
    grn.status = "COMPLETE";
    goodsReceipts.set(goodsReceiptId, grn);

    // Update PO invoice status
    po.invoiceStatus = "PARTIAL"; // Will be updated to COMPLETE when invoice is matched
    po.isMatched = false; // Will be matched when invoice is received

    // Publish event
    await eventBus.publish({
      type: "procurement.goods-receipt.posted",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        goodsReceiptId,
        grnNumber: grn.grnNumber,
        tenantId,
        purchaseOrderId: grn.purchaseOrderId,
        poNumber: grn.poNumber,
        totalAmount: grn.totalAmount,
        currency: grn.currency,
        apRecordId,
        postedBy,
      },
    } as DomainEvent);

    return grn;
  }

  /**
   * Get Goods Receipt by ID
   */
  async getGoodsReceipt(
    goodsReceiptId: string,
    tenantId: string,
  ): Promise<GoodsReceipt | null> {
    const grn = goodsReceipts.get(goodsReceiptId);
    if (!grn || grn.tenantId !== tenantId) {
      return null;
    }
    return grn;
  }

  /**
   * List Goods Receipts
   */
  async listGoodsReceipts(
    tenantId: string,
    filters?: {
      purchaseOrderId?: string;
      vendorId?: string;
      status?: GoodsReceiptStatus[];
      dateFrom?: Date | string;
      dateTo?: Date | string;
    },
  ): Promise<GoodsReceipt[]> {
    let results = Array.from(goodsReceipts.values()).filter(
      (grn) => grn.tenantId === tenantId,
    );

    if (filters) {
      if (filters.purchaseOrderId) {
        results = results.filter(
          (grn) => grn.purchaseOrderId === filters.purchaseOrderId,
        );
      }
      if (filters.vendorId) {
        results = results.filter((grn) => grn.vendorId === filters.vendorId);
      }
      if (filters.status && filters.status.length > 0) {
        results = results.filter((grn) => filters.status!.includes(grn.status));
      }
      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        results = results.filter(
          (grn) => new Date(grn.receiptDate) >= fromDate,
        );
      }
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        results = results.filter((grn) => new Date(grn.receiptDate) <= toDate);
      }
    }

    // Sort by receipt date (newest first)
    results.sort((a, b) => {
      return (
        new Date(b.receiptDate).getTime() - new Date(a.receiptDate).getTime()
      );
    });

    return results;
  }
}

// Singleton instance
export const goodsReceiptService = new GoodsReceiptService();
