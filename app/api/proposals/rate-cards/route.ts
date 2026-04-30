/**
 * Rate Cards API
 * Get rate cards for proposal creation
 *
 * DATABASE: Now uses RateCardDatabaseAdapter for persistence
 */

import { NextRequest, NextResponse } from "next/server";
import { getRateCardDatabaseAdapter } from "@/lib/services/proposals/database/rateCardDatabaseAdapter";

const rateCardAdapter = getRateCardDatabaseAdapter();

// Legacy mock data (kept for reference, not used)
const LEGACY_mockRateCards = [
  {
    id: "rc-001",
    name: "Standard Warehousing 2025",
    code: "WH-STD-2025",
    category: "WAREHOUSING",
    effectiveDate: "2025-01-01",
    expiryDate: "2025-12-31",
    currency: "SAR",
    status: "ACTIVE",
    rates: [
      {
        id: "r1",
        service: "Pallet Storage",
        description: "Standard pallet storage (ambient)",
        unit: "Pallet/Month",
        baseRate: 50,
        minCharge: 500,
      },
      {
        id: "r2",
        service: "Pick & Pack",
        description: "Order picking and packing",
        unit: "Order",
        baseRate: 5,
        minCharge: 50,
      },
      {
        id: "r3",
        service: "Inbound Handling",
        description: "Receiving and putaway",
        unit: "Pallet",
        baseRate: 15,
      },
      {
        id: "r4",
        service: "Outbound Handling",
        description: "Order preparation and loading",
        unit: "Pallet",
        baseRate: 12,
      },
    ],
    volumeDiscounts: [
      { minVolume: 500, maxVolume: 999, discountPercent: 5, unit: "Pallets" },
      {
        minVolume: 1000,
        maxVolume: 2499,
        discountPercent: 10,
        unit: "Pallets",
      },
      { minVolume: 2500, discountPercent: 15, unit: "Pallets" },
    ],
    validFor: ["All Customers"],
  },
  {
    id: "rc-002",
    name: "Transportation FTL/LTL 2025",
    code: "TR-STD-2025",
    category: "TRANSPORTATION",
    effectiveDate: "2025-01-01",
    expiryDate: "2025-12-31",
    currency: "SAR",
    status: "ACTIVE",
    rates: [
      {
        id: "r1",
        service: "FTL - Local",
        description: "Full truck within city",
        unit: "Trip",
        baseRate: 800,
        minCharge: 800,
      },
      {
        id: "r2",
        service: "FTL - Regional",
        description: "Full truck intercity (up to 500km)",
        unit: "Trip",
        baseRate: 2500,
        minCharge: 2500,
      },
      {
        id: "r3",
        service: "LTL - Per Pallet",
        description: "Less than truckload",
        unit: "Pallet",
        baseRate: 150,
      },
    ],
    volumeDiscounts: [
      { minVolume: 20, maxVolume: 49, discountPercent: 5, unit: "Trips/Month" },
      {
        minVolume: 50,
        maxVolume: 99,
        discountPercent: 10,
        unit: "Trips/Month",
      },
    ],
    validFor: ["All Customers"],
  },
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const status = searchParams.get("status") || "ACTIVE";
    const tenantId = "default"; // TODO: Get from auth context

    // Fetch from database
    const rateCards = await rateCardAdapter.getRateCards(tenantId, {
      category: category && category !== "ALL" ? category : undefined,
      status: status || undefined,
    });

    return NextResponse.json({
      success: true,
      data: rateCards,
      count: rateCards.length,
    });
  } catch (error: any) {
    console.error("[Rate Cards API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch rate cards",
      },
      { status: 500 },
    );
  }
}
