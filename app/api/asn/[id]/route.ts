/**
 * ASN by ID API Routes
 */

import { NextRequest, NextResponse } from "next/server";
import { getAsnService } from "@/lib/services/asn";
import { authenticate } from "@/lib/auth";
import { validateTenant } from "@/lib/tenant";
import type { UpdateASNRequest } from "@/types/asn";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await authenticate(req);
    await validateTenant(user.tenantId);

    const { searchParams } = new URL(req.url);
    const includeItems = searchParams.get("includeItems") !== "false";
    const includeExceptions = searchParams.get("includeExceptions") !== "false";
    const includeDocuments = searchParams.get("includeDocuments") !== "false";

    const asnService = getAsnService();
    const asn = await asnService.getAsnById(
      params.id,
      user.tenantId,
      includeItems,
      includeExceptions,
      includeDocuments,
    );

    if (!asn) {
      return NextResponse.json({ error: "ASN not found" }, { status: 404 });
    }

    return NextResponse.json(asn);
  } catch (error: any) {
    console.error("ASN GET by ID error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch ASN" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await authenticate(req);
    await validateTenant(user.tenantId);

    const body: UpdateASNRequest = await req.json();

    const asnService = getAsnService();
    const asn = await asnService.updateAsn(
      params.id,
      body,
      user.id,
      user.tenantId,
    );

    return NextResponse.json(asn);
  } catch (error: any) {
    console.error("ASN PATCH error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update ASN" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await authenticate(req);
    await validateTenant(user.tenantId);

    const asnService = getAsnService();
    await asnService.deleteAsn(params.id, user.id, user.tenantId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("ASN DELETE error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete ASN" },
      { status: 500 },
    );
  }
}
