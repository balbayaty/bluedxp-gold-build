/**
 * Trade Compliance Records API
 * GET: List all records
 * POST: Create new record
 */

import { NextRequest, NextResponse } from "next/server";
import { tradeComplianceService } from "@/lib/services/trade-compliance/tradeComplianceService";
import type {
  TradeProduct,
  HSClassification,
  CountryCode,
  ProductCategory,
} from "@/types/trade-compliance";
import { apiAuthMiddleware } from "@/middleware/apiAuth";

export async function GET(request: NextRequest) {
  try {
    const auth = await apiAuthMiddleware(request);
    if (!auth.authorized || !auth.context) {
      return (
        auth.response ||
        NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 },
        )
      );
    }
    const tenantId = auth.context.tenantId;

    const records = tradeComplianceService.getRecordsByTenant(tenantId);

    return NextResponse.json({
      success: true,
      records,
      count: records.length,
    });
  } catch (error) {
    console.error("Error fetching trade compliance records:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch records" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await apiAuthMiddleware(request);
    if (!auth.authorized || !auth.context) {
      return (
        auth.response ||
        NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 },
        )
      );
    }
    const body = await request.json();
    const tenantId = auth.context.tenantId;

    // Build products array from form data
    const products: TradeProduct[] = [
      {
        id: `prod-${Date.now()}`,
        name: body.productDescription || "Product",
        description: body.productDescription || "",
        category: (body.productCategory || "OTHER") as ProductCategory,
        hsCode: body.hsCode || "",
        quantity: parseFloat(body.quantity) || 0,
        unit: "PCS",
        unitValue: parseFloat(body.unitValue) || 0,
        totalValue: parseFloat(body.totalValue) || 0,
        weight: 0,
        volume: 0,
        originCountry: (body.originCountry || "CN") as CountryCode,
        requiresSpecialHandling: false,
      },
    ];

    // Build HS classifications
    const hsClassifications: HSClassification[] = body.hsCode
      ? [
          {
            hsCode: body.hsCode,
            description: body.productDescription || "",
            category: (body.productCategory || "OTHER") as ProductCategory,
            requiresLicense: true,
            licenseType: [],
          },
        ]
      : [];

    const record = await tradeComplianceService.createTradeComplianceRecord({
      tenantId,
      customerId: body.customerId,
      tradeDirection: body.tradeDirection as any,
      tradeType: body.tradeType as any,
      shipmentMode: body.shipmentMode as any,
      originCountry: (body.originCountry || "CN") as CountryCode,
      destinationCountry: (body.destinationCountry || "SA") as CountryCode,
      originPort: body.originPort,
      destinationPort: body.destinationPort,
      products,
      totalValue: parseFloat(body.totalValue) || 0,
      currency: body.currency || "SAR",
      hsClassifications,
      requiredLicenses: [],
      obtainedLicenses: [],
      pendingLicenses: [],
      documents: [],
      notes: body.notes,
    });

    return NextResponse.json(
      {
        success: true,
        record,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating trade compliance record:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create record",
      },
      { status: 500 },
    );
  }
}
