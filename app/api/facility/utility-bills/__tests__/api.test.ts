/**
 * API Endpoint Tests for Utility Bills
 */

import { NextRequest } from "next/server";
import { GET, POST } from "../route";
import { GET as GET_DETAIL, PUT, DELETE } from "../[id]/route";
import { POST as POST_APPROVE } from "../[id]/approve/route";
import { POST as POST_PAYMENT } from "../[id]/payment/route";
import { GET as GET_ANALYTICS, POST as POST_COMPARE } from "../analytics/route";
import { GET as GET_TRACEABILITY } from "../[id]/traceability/route";

// Mock the services
jest.mock("@/lib/services/facility/utility-bills/utilityBillService", () => ({
  getUtilityBillService: () => ({
    createBill: jest.fn(),
    getBill: jest.fn(),
    getBills: jest.fn(),
    updateBill: jest.fn(),
    deleteBill: jest.fn(),
    approveBill: jest.fn(),
    recordPayment: jest.fn(),
    getBillTraceability: jest.fn(),
  }),
}));

jest.mock(
  "@/lib/services/facility/utility-bills/utilityBillAnalyticsService",
  () => ({
    getUtilityBillAnalyticsService: () => ({
      generateAnalytics: jest.fn(),
      compareBills: jest.fn(),
    }),
  }),
);

describe("Utility Bills API", () => {
  describe("GET /api/facility/utility-bills", () => {
    it("should return list of bills", async () => {
      const request = new NextRequest(
        "http://localhost/api/facility/utility-bills",
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty("bills");
    });

    it("should filter bills by warehouse", async () => {
      const request = new NextRequest(
        "http://localhost/api/facility/utility-bills?warehouseIds=warehouse-1",
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe("POST /api/facility/utility-bills", () => {
    it("should create a new bill from JSON", async () => {
      const billData = {
        billNumber: "BILL-001",
        accountNumber: "30095665866",
        utilityType: "electricity",
        provider: {
          name: "Saudi Electricity Company",
          type: "electricity",
        },
        billingPeriod: {
          start: "2025-11-01",
          end: "2025-11-30",
        },
        issueDate: "2025-12-01",
        dueDate: "2025-12-28",
        currency: "SAR",
        subtotal: 1224.06,
        taxes: [{ type: "VAT", rate: 15, amount: 183.61 }],
        fees: [],
        discounts: [],
        totalAmount: 1407.67,
        currentBalance: 1407.67,
        status: "pending",
        paymentStatus: "unpaid",
        metadata: { source: "manual" },
        traceability: {},
      };

      const request = new NextRequest(
        "http://localhost/api/facility/utility-bills",
        {
          method: "POST",
          body: JSON.stringify(billData),
          headers: { "Content-Type": "application/json" },
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty("id");
    });
  });

  describe("GET /api/facility/utility-bills/[id]", () => {
    it("should return bill details", async () => {
      const request = new NextRequest(
        "http://localhost/api/facility/utility-bills/bill-123",
      );
      const response = await GET_DETAIL(request, {
        params: { id: "bill-123" },
      });
      const data = await response.json();

      expect(data).toHaveProperty("success");
    });
  });

  describe("POST /api/facility/utility-bills/[id]/approve", () => {
    it("should approve a bill", async () => {
      const request = new NextRequest(
        "http://localhost/api/facility/utility-bills/bill-123/approve",
        {
          method: "POST",
          body: JSON.stringify({ approvedBy: "user-123" }),
          headers: { "Content-Type": "application/json" },
        },
      );

      const response = await POST_APPROVE(request, {
        params: { id: "bill-123" },
      });
      const data = await response.json();

      expect(data).toHaveProperty("success");
    });
  });

  describe("POST /api/facility/utility-bills/[id]/payment", () => {
    it("should record payment", async () => {
      const request = new NextRequest(
        "http://localhost/api/facility/utility-bills/bill-123/payment",
        {
          method: "POST",
          body: JSON.stringify({
            paymentAmount: 1407.67,
            paymentMethod: "Bank Transfer",
          }),
          headers: { "Content-Type": "application/json" },
        },
      );

      const response = await POST_PAYMENT(request, {
        params: { id: "bill-123" },
      });
      const data = await response.json();

      expect(data).toHaveProperty("success");
    });
  });

  describe("GET /api/facility/utility-bills/analytics", () => {
    it("should return analytics", async () => {
      const request = new NextRequest(
        "http://localhost/api/facility/utility-bills/analytics",
      );
      const response = await GET_ANALYTICS(request);
      const data = await response.json();

      expect(data).toHaveProperty("success");
      expect(data.data).toHaveProperty("summary");
    });
  });
});
