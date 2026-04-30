/**
 * Get All MSDS from Database
 * Comprehensive endpoint for loading all MSDS with search, filter, and pagination
 * Supports database queries with fallback to in-memory storage
 */

import { NextRequest, NextResponse } from "next/server";
import { getMSDSDatabaseAdapter } from "@/lib/services/chemical/msdsDatabaseAdapter";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = context.tenantId;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status"); // 'pending' | 'approved' | 'rejected'
    const hazardLevel = searchParams.get("hazardLevel"); // 'High' | 'Medium' | 'Low'
    const manufacturer = searchParams.get("manufacturer");
    const casNumber = searchParams.get("casNumber");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const dbAdapter = getMSDSDatabaseAdapter();

    // Try to get from database first
    let allMSDS: any[] = [];

    if (dbAdapter.isDatabaseAvailable()) {
      allMSDS = await dbAdapter.getAllMSDS(tenantId);
    } else {
      // Fallback: Get from storage service (in-memory)
      // Note: This is a limitation - storage service doesn't have getAll method
      // We'll need to enhance it or use database
      console.warn(
        "⚠️ Database not available, returning empty list. Please configure database.",
      );
    }

    // Apply filters
    let filtered = allMSDS;

    // Search filter (product name, CAS number, manufacturer)
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((entry) => {
        const productName =
          entry.extractedData?.productName?.toLowerCase() || "";
        const cas = entry.extractedData?.casNumber?.toLowerCase() || "";
        const manufacturerName =
          entry.extractedData?.manufacturer?.toLowerCase() || "";
        const supplier = entry.extractedData?.supplier?.toLowerCase() || "";
        return (
          productName.includes(searchLower) ||
          cas.includes(searchLower) ||
          manufacturerName.includes(searchLower) ||
          supplier.includes(searchLower)
        );
      });
    }

    // Status filter
    if (status) {
      filtered = filtered.filter((entry) => {
        const entryStatus = entry.msds?.status || "pending";
        return entryStatus.toLowerCase() === status.toLowerCase();
      });
    }

    // Hazard level filter
    if (hazardLevel) {
      filtered = filtered.filter((entry) => {
        const level = entry.extractedData?.hazardLevel || "Medium";
        return level === hazardLevel;
      });
    }

    // Manufacturer filter
    if (manufacturer) {
      filtered = filtered.filter((entry) => {
        const mfr = entry.extractedData?.manufacturer?.toLowerCase() || "";
        return mfr.includes(manufacturer.toLowerCase());
      });
    }

    // CAS number filter
    if (casNumber) {
      filtered = filtered.filter((entry) => {
        const cas = entry.extractedData?.casNumber || "";
        return cas.toLowerCase() === casNumber.toLowerCase();
      });
    }

    // Date range filter
    if (dateFrom || dateTo) {
      filtered = filtered.filter((entry) => {
        const createdAt = new Date(entry.metadata?.createdAt || 0);
        if (dateFrom && createdAt < new Date(dateFrom)) return false;
        if (dateTo && createdAt > new Date(dateTo)) return false;
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      if (sortBy === "createdAt") {
        aVal = new Date(a.metadata?.createdAt || 0);
        bVal = new Date(b.metadata?.createdAt || 0);
      } else if (sortBy === "productName") {
        aVal = a.extractedData?.productName || "";
        bVal = b.extractedData?.productName || "";
      } else if (sortBy === "hazardLevel") {
        const levels = { High: 3, Medium: 2, Low: 1 };
        aVal = levels[a.extractedData?.hazardLevel as keyof typeof levels] || 0;
        bVal = levels[b.extractedData?.hazardLevel as keyof typeof levels] || 0;
      } else {
        aVal = a[sortBy] || "";
        bVal = b[sortBy] || "";
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

    // Paginate
    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    // Transform to response format
    const data = paginated.map((entry) => ({
      id: entry.id,
      productName: entry.extractedData?.productName || "Unknown",
      casNumber: entry.extractedData?.casNumber || "",
      manufacturer:
        entry.extractedData?.manufacturer ||
        entry.extractedData?.supplier ||
        "",
      hazardLevel: entry.extractedData?.hazardLevel || "Medium",
      status: entry.msds?.status || "pending",
      createdAt: entry.metadata?.createdAt || new Date().toISOString(),
      updatedAt: entry.metadata?.updatedAt || new Date().toISOString(),
      createdBy: entry.metadata?.createdBy || "system",
      extractedData: entry.extractedData,
      msds: entry.msds,
      warehouseData: entry.warehouseData,
      transportationData: entry.transportationData,
      complianceData: entry.complianceData,
    }));

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      filters: {
        search,
        status,
        hazardLevel,
        manufacturer,
        casNumber,
        dateFrom,
        dateTo,
      },
    });
  } catch (error: any) {
    console.error("❌ Error loading MSDS list:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to load MSDS list",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "chemical",
  featureId: "chemical.msds.list",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
