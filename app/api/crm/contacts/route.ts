/**
 * CRM Contacts API
 * GET /api/crm/contacts - Get contacts
 * POST /api/crm/contacts - Create contact
 */

import { NextRequest, NextResponse } from "next/server";
import { contactService } from "@/lib/services/crm/contactService";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId") || "default";
    const accountId = searchParams.get("accountId") || undefined;
    const isPrimary =
      searchParams.get("isPrimary") === "true" ? true : undefined;

    const contacts = await contactService.getContacts({
      tenantId,
      accountId,
      isPrimary,
    });

    return NextResponse.json({
      success: true,
      data: contacts,
    });
  } catch (error: unknown) {
    logger.error("Error fetching contacts", {
      error: error instanceof Error ? error.message : String(error),
      tenantId,
    });
    errorTrackingService.captureException(
      error instanceof Error ? error : new Error(String(error)),
      { context: "crm-contacts", action: "fetch", tenantId },
    );
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch contacts",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const contact = await contactService.createContact(body);

    return NextResponse.json({
      success: true,
      data: contact,
    });
  } catch (error: unknown) {
    logger.error("Error creating contact", {
      error: error instanceof Error ? error.message : String(error),
    });
    errorTrackingService.captureException(
      error instanceof Error ? error : new Error(String(error)),
      { context: "crm-contacts", action: "create" },
    );
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create contact",
      },
      { status: 500 },
    );
  }
}
