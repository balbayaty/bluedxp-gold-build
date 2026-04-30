/**
 * Service Catalog API
 * Get services for proposal creation
 *
 * DATABASE: Now uses ServiceCatalogDatabaseAdapter for persistence
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceCatalogDatabaseAdapter } from "@/lib/services/proposals/database/serviceCatalogDatabaseAdapter";

const serviceCatalogAdapter = getServiceCatalogDatabaseAdapter();

// Get tenant from request headers or environment
function getTenantId(request: NextRequest): string {
  return (
    request.headers.get("x-tenant-id") ||
    process.env.BOOTSTRAP_TENANT_ID ||
    "default"
  );
}

// Legacy mock data (kept for reference, not used)
const LEGACY_serviceCategories = [
  {
    id: "WAREHOUSING",
    name: "Warehousing",
    icon: "ri-building-4-line",
    color: "bg-indigo-500",
    services: [
      {
        id: "wh-001",
        code: "WH-STD",
        name: "Standard Storage",
        category: "WAREHOUSING",
        description: "General cargo storage in ambient conditions",
        basePrice: 50,
        unit: "pallet/month",
        features: ["24/7 Security", "Inventory Management", "WMS Integration"],
        active: true,
      },
      {
        id: "wh-002",
        code: "WH-COLD",
        name: "Cold Storage",
        category: "WAREHOUSING",
        description: "Temperature-controlled storage for perishables",
        basePrice: 150,
        unit: "pallet/month",
        features: ["Temperature Monitoring", "HACCP Compliance", "Reefer Yard"],
        active: true,
      },
      {
        id: "wh-003",
        code: "WH-HAZ",
        name: "Hazmat Storage",
        category: "WAREHOUSING",
        description: "Specialized storage for dangerous goods",
        basePrice: 200,
        unit: "pallet/month",
        features: ["ADR Compliance", "Fire Suppression", "Spill Containment"],
        active: true,
      },
    ],
  },
  {
    id: "TRANSPORTATION",
    name: "Transportation",
    icon: "ri-truck-line",
    color: "bg-emerald-500",
    services: [
      {
        id: "tr-001",
        code: "TR-FTL",
        name: "Full Truck Load",
        category: "TRANSPORTATION",
        description: "Dedicated truck for full load shipments",
        basePrice: 2500,
        unit: "trip",
        features: ["GPS Tracking", "Direct Delivery", "Flexible Scheduling"],
        active: true,
      },
      {
        id: "tr-002",
        code: "TR-LTL",
        name: "Less Than Truck Load",
        category: "TRANSPORTATION",
        description: "Shared truck space for smaller shipments",
        basePrice: 500,
        unit: "pallet",
        features: [
          "Consolidated Shipping",
          "Cost Effective",
          "Hub Distribution",
        ],
        active: true,
      },
      {
        id: "tr-003",
        code: "TR-EXP",
        name: "Express Delivery",
        category: "TRANSPORTATION",
        description: "Time-critical express delivery service",
        basePrice: 3500,
        unit: "trip",
        features: ["Priority Handling", "SLA Guarantee", "24h Delivery"],
        active: true,
      },
    ],
  },
  {
    id: "CUSTOMS_CLEARANCE",
    name: "Customs Clearance",
    icon: "ri-shield-check-line",
    color: "bg-amber-500",
    services: [
      {
        id: "cc-001",
        code: "CC-IMP",
        name: "Import Clearance",
        category: "CUSTOMS_CLEARANCE",
        description: "Complete import customs clearance",
        basePrice: 500,
        unit: "shipment",
        features: [
          "Document Filing",
          "Duty Calculation",
          "Inspection Handling",
        ],
        active: true,
      },
      {
        id: "cc-002",
        code: "CC-EXP",
        name: "Export Clearance",
        category: "CUSTOMS_CLEARANCE",
        description: "Complete export customs clearance",
        basePrice: 400,
        unit: "shipment",
        features: ["Export Documentation", "CoO Processing", "EX1 Filing"],
        active: true,
      },
    ],
  },
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const tenantId = getTenantId(request);

    // Fetch from database adapter
    const serviceCategories =
      await serviceCatalogAdapter.getServicesByCategory(tenantId);

    if (category) {
      const cat = serviceCategories.find((c) => c.id === category);
      return NextResponse.json({
        success: true,
        data: cat ? cat.services : [],
        category: cat,
      });
    }

    return NextResponse.json({
      success: true,
      data: serviceCategories,
      categories: serviceCategories.map((c) => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        color: c.color,
        count: c.services.length,
      })),
    });
  } catch (error: any) {
    console.error("[Services API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch services",
      },
      { status: 500 },
    );
  }
}
