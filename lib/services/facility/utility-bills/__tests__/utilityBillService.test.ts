/**
 * Utility Bill Service Tests
 */

import { getUtilityBillService } from "../utilityBillService";
import type { UtilityBill } from "@/types/utility-bills";

describe("UtilityBillService", () => {
  let billService: ReturnType<typeof getUtilityBillService>;

  beforeEach(() => {
    billService = getUtilityBillService();
  });

  describe("createBill", () => {
    it("should create a new utility bill", async () => {
      const billData: Omit<
        UtilityBill,
        "id" | "createdAt" | "updatedAt" | "version"
      > = {
        billNumber: "BILL-001",
        accountNumber: "30095665866",
        utilityType: "electricity",
        provider: {
          name: "Saudi Electricity Company",
          type: "electricity",
        },
        billingPeriod: {
          start: new Date("2025-11-01"),
          end: new Date("2025-11-30"),
        },
        issueDate: new Date("2025-12-01"),
        dueDate: new Date("2025-12-28"),
        currency: "SAR",
        subtotal: 1224.06,
        taxes: [
          {
            type: "VAT",
            rate: 15,
            amount: 183.61,
          },
        ],
        fees: [],
        discounts: [],
        totalAmount: 1407.67,
        currentBalance: 1407.67,
        consumption: {
          quantity: 5000,
          unit: "kWh",
        },
        status: "pending",
        paymentStatus: "unpaid",
        warehouseName: "Block 12 WH 04",
        metadata: {
          source: "manual",
        },
        traceability: {},
      };

      const bill = await billService.createBill(billData);

      expect(bill).toBeDefined();
      expect(bill.id).toBeDefined();
      expect(bill.billNumber).toBe("BILL-001");
      expect(bill.accountNumber).toBe("30095665866");
      expect(bill.totalAmount).toBe(1407.67);
      expect(bill.status).toBe("pending");
      expect(bill.version).toBe(1);
    });

    it("should auto-approve bills below threshold", async () => {
      const billData: Omit<
        UtilityBill,
        "id" | "createdAt" | "updatedAt" | "version"
      > = {
        billNumber: "BILL-002",
        accountNumber: "30095665731",
        utilityType: "electricity",
        provider: {
          name: "Saudi Electricity Company",
          type: "electricity",
        },
        billingPeriod: {
          start: new Date("2025-11-01"),
          end: new Date("2025-11-30"),
        },
        issueDate: new Date("2025-12-01"),
        dueDate: new Date("2025-12-28"),
        currency: "SAR",
        subtotal: 1000,
        taxes: [],
        fees: [],
        discounts: [],
        totalAmount: 1000,
        currentBalance: 1000,
        status: "pending",
        paymentStatus: "unpaid",
        metadata: {
          source: "manual",
        },
        traceability: {},
      };

      const bill = await billService.createBill(billData);

      expect(bill.approvalStatus).toBe("approved");
      expect(bill.status).toBe("approved");
    });

    it("should throw error for invalid bill data", async () => {
      const invalidBillData = {
        billNumber: "",
        accountNumber: "30095665866",
      } as any;

      await expect(billService.createBill(invalidBillData)).rejects.toThrow();
    });
  });

  describe("getBills", () => {
    beforeEach(async () => {
      // Create test bills
      const bills = [
        {
          billNumber: "BILL-001",
          accountNumber: "30095665866",
          utilityType: "electricity" as const,
          provider: {
            name: "Saudi Electricity Company",
            type: "electricity" as const,
          },
          billingPeriod: {
            start: new Date("2025-11-01"),
            end: new Date("2025-11-30"),
          },
          issueDate: new Date("2025-12-01"),
          dueDate: new Date("2025-12-28"),
          currency: "SAR" as const,
          subtotal: 1224.06,
          taxes: [{ type: "VAT", rate: 15, amount: 183.61 }],
          fees: [],
          discounts: [],
          totalAmount: 1407.67,
          currentBalance: 1407.67,
          warehouseName: "Block 12 WH 04",
          status: "pending" as const,
          paymentStatus: "unpaid" as const,
          metadata: { source: "manual" as const },
          traceability: {},
        },
        {
          billNumber: "BILL-002",
          accountNumber: "30095665731",
          utilityType: "electricity" as const,
          provider: {
            name: "Saudi Electricity Company",
            type: "electricity" as const,
          },
          billingPeriod: {
            start: new Date("2025-11-01"),
            end: new Date("2025-11-30"),
          },
          issueDate: new Date("2025-12-01"),
          dueDate: new Date("2025-12-28"),
          currency: "SAR" as const,
          subtotal: 1151.87,
          taxes: [{ type: "VAT", rate: 15, amount: 172.78 }],
          fees: [],
          discounts: [],
          totalAmount: 1324.65,
          currentBalance: 1324.65,
          warehouseName: "Block 12 WH 03",
          status: "pending" as const,
          paymentStatus: "unpaid" as const,
          metadata: { source: "manual" as const },
          traceability: {},
        },
      ];

      for (const billData of bills) {
        await billService.createBill(billData);
      }
    });

    it("should get all bills", async () => {
      const result = await billService.getBills();

      expect(result.bills.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
    });

    it("should filter bills by warehouse", async () => {
      const result = await billService.getBills({
        filters: {
          warehouseIds: ["Block 12 WH 04"],
        },
      });

      expect(result.bills.length).toBeGreaterThan(0);
      expect(result.bills[0].warehouseName).toBe("Block 12 WH 04");
    });

    it("should filter bills by amount range", async () => {
      const result = await billService.getBills({
        filters: {
          amountRange: {
            min: 1300,
            max: 1500,
          },
        },
      });

      expect(result.bills.length).toBeGreaterThan(0);
      result.bills.forEach((bill) => {
        expect(bill.totalAmount).toBeGreaterThanOrEqual(1300);
        expect(bill.totalAmount).toBeLessThanOrEqual(1500);
      });
    });
  });

  describe("updateBill", () => {
    it("should update bill", async () => {
      const billData: Omit<
        UtilityBill,
        "id" | "createdAt" | "updatedAt" | "version"
      > = {
        billNumber: "BILL-003",
        accountNumber: "30095665740",
        utilityType: "electricity",
        provider: { name: "Saudi Electricity Company", type: "electricity" },
        billingPeriod: {
          start: new Date("2025-11-01"),
          end: new Date("2025-11-30"),
        },
        issueDate: new Date("2025-12-01"),
        dueDate: new Date("2025-12-28"),
        currency: "SAR",
        subtotal: 1353.14,
        taxes: [{ type: "VAT", rate: 15, amount: 202.97 }],
        fees: [],
        discounts: [],
        totalAmount: 1556.11,
        currentBalance: 1556.11,
        status: "pending",
        paymentStatus: "unpaid",
        metadata: { source: "manual" },
        traceability: {},
      };

      const bill = await billService.createBill(billData);
      const updated = await billService.updateBill(bill.id, {
        status: "approved",
      });

      expect(updated.status).toBe("approved");
      expect(updated.version).toBe(bill.version + 1);
    });
  });

  describe("recordPayment", () => {
    it("should record payment and update status", async () => {
      const billData: Omit<
        UtilityBill,
        "id" | "createdAt" | "updatedAt" | "version"
      > = {
        billNumber: "BILL-004",
        accountNumber: "30095665759",
        utilityType: "electricity",
        provider: { name: "Saudi Electricity Company", type: "electricity" },
        billingPeriod: {
          start: new Date("2025-11-01"),
          end: new Date("2025-11-30"),
        },
        issueDate: new Date("2025-12-01"),
        dueDate: new Date("2025-12-28"),
        currency: "SAR",
        subtotal: 884.39,
        taxes: [{ type: "VAT", rate: 15, amount: 131.66 }],
        fees: [],
        discounts: [],
        totalAmount: 1016.05,
        currentBalance: 1016.05,
        status: "approved",
        paymentStatus: "unpaid",
        metadata: { source: "manual" },
        traceability: {},
      };

      const bill = await billService.createBill(billData);
      const paid = await billService.recordPayment(bill.id, 1016.05);

      expect(paid.paymentStatus).toBe("paid");
      expect(paid.status).toBe("paid");
      expect(paid.currentBalance).toBe(0);
      expect(paid.paidDate).toBeDefined();
    });
  });
});
