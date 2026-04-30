/**
 * ASN API Routes
 * Handle ASN CRUD operations
 */

import { NextRequest, NextResponse } from "next/server";
import { getAsnService } from "@/lib/services/asn";
import { authenticate } from "@/lib/auth";
import { validateTenant } from "@/lib/tenant";
import type {
  CreateASNRequest,
  UpdateASNRequest,
  ASNQueryParams,
} from "@/types/asn";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req);
    await validateTenant(user.tenantId);

    const { searchParams } = new URL(req.url);

    const params: ASNQueryParams = {
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1,
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : 20,
      status: searchParams.get("status")?.split(",") as any,
      supplierId: searchParams.get("supplierId") || undefined,
      warehouseId: searchParams.get("warehouseId") || undefined,
      dateFrom: searchParams.get("dateFrom")
        ? new Date(searchParams.get("dateFrom")!)
        : undefined,
      dateTo: searchParams.get("dateTo")
        ? new Date(searchParams.get("dateTo")!)
        : undefined,
      search: searchParams.get("search") || undefined,
      sortBy: searchParams.get("sortBy") || "createdAt",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
      includeItems: searchParams.get("includeItems") === "true",
      includeExceptions: searchParams.get("includeExceptions") === "true",
      includeDocuments: searchParams.get("includeDocuments") === "true",
    };

    const asnService = getAsnService();
    const result = await asnService.listAsns(params, user.tenantId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("ASN GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch ASNs" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticate(req);
    await validateTenant(user.tenantId);

    const body: CreateASNRequest = await req.json();

    const asnService = getAsnService();
    const asn = await asnService.createAsn(body, user.id, user.tenantId);

    return NextResponse.json(asn, { status: 201 });
  } catch (error: any) {
    console.error("ASN POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create ASN" },
      { status: 500 },
    );
  }
}
