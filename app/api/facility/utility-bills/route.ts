/**
 * Utility Bills API Routes
 *
 * GET /api/facility/utility-bills - List bills with filters
 * POST /api/facility/utility-bills - Create new bill
 */

import { NextRequest, NextResponse } from "next/server";
import { getUtilityBillService } from "@/lib/services/facility/utility-bills/utilityBillService";
import { getPDFParserService } from "@/lib/services/facility/utility-bills/pdfParserService";
import type { UtilityBill, UtilityBillQuery } from "@/types/utility-bills";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const query: UtilityBillQuery = {
      filters: {},
      sortBy: (searchParams.get("sortBy") as any) || "date",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
      page: parseInt(searchParams.get("page") || "1"),
      pageSize: parseInt(searchParams.get("pageSize") || "50"),
    };

    // Parse filters
    if (searchParams.get("utilityTypes")) {
      query.filters!.utilityTypes = searchParams
        .get("utilityTypes")!
        .split(",") as any[];
    }
    if (searchParams.get("facilityIds")) {
      query.filters!.facilityIds = searchParams.get("facilityIds")!.split(",");
    }
    if (searchParams.get("warehouseIds")) {
      query.filters!.warehouseIds = searchParams
        .get("warehouseIds")!
        .split(",");
    }
    if (searchParams.get("statuses")) {
      query.filters!.statuses = searchParams
        .get("statuses")!
        .split(",") as any[];
    }
    if (searchParams.get("paymentStatuses")) {
      query.filters!.paymentStatuses = searchParams
        .get("paymentStatuses")!
        .split(",") as any[];
    }
    if (searchParams.get("startDate") && searchParams.get("endDate")) {
      query.filters!.dateRange = {
        start: new Date(searchParams.get("startDate")!),
        end: new Date(searchParams.get("endDate")!),
      };
    }
    if (searchParams.get("minAmount") && searchParams.get("maxAmount")) {
      query.filters!.amountRange = {
        min: parseFloat(searchParams.get("minAmount")!),
        max: parseFloat(searchParams.get("maxAmount")!),
      };
    }
    if (searchParams.get("search")) {
      query.filters!.search = searchParams.get("search")!;
    }
    if (searchParams.get("tenantId")) {
      query.filters!.tenantId = searchParams.get("tenantId")!;
    }

    const billService = getUtilityBillService();
    const result = await billService.getBills(query);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error fetching utility bills", err, {
      module: "facility",
      service: "utility-bills",
    });
    errorTrackingService.captureException(err, {
      module: "facility",
      service: "utility-bills",
    });
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to fetch utility bills",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type");

    // Handle PDF upload
    if (contentType?.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File;
      const utilityType =
        (formData.get("utilityType") as string) || "electricity";
      const isMultiBill = formData.get("isMultiBill") === "true";

      if (!file) {
        return NextResponse.json(
          { success: false, error: "No file provided" },
          { status: 400 },
        );
      }

      const pdfParser = getPDFParserService();

      if (isMultiBill) {
        // Parse multi-bill PDF
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const parseResults = await pdfParser.parseMultiBillPDF(buffer);

        // Create bills from parsed results
        const billService = getUtilityBillService();
        const createdBills: UtilityBill[] = [];

        for (const result of parseResults) {
          if (result.success && result.bill) {
            const bill = await billService.createBill(result.bill);
            createdBills.push(bill);
          }
        }

        return NextResponse.json({
          success: true,
          data: {
            bills: createdBills,
            totalParsed: parseResults.length,
            successful: createdBills.length,
            failed: parseResults.length - createdBills.length,
          },
        });
      } else {
        // Parse single bill PDF
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const parseResult = await pdfParser.parsePDF(
          buffer,
          utilityType as any,
        );

        if (!parseResult.success || !parseResult.bill) {
          return NextResponse.json(
            {
              success: false,
              error: "Failed to parse PDF",
              details: parseResult.errors,
              confidence: parseResult.confidence,
            },
            { status: 400 },
          );
        }

        // Create bill
        const billService = getUtilityBillService();
        const bill = await billService.createBill(parseResult.bill);

        return NextResponse.json({
          success: true,
          data: bill,
          confidence: parseResult.confidence,
        });
      }
    } else {
      // Handle JSON bill data
      const billData = await request.json();

      // Remove id, createdAt, updatedAt, version if present (will be generated)
      const { id, createdAt, updatedAt, version, ...cleanBillData } = billData;

      const billService = getUtilityBillService();
      const bill = await billService.createBill(cleanBillData);

      return NextResponse.json(
        {
          success: true,
          data: bill,
        },
        { status: 201 },
      );
    }
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error creating utility bill", err, {
      module: "facility",
      service: "utility-bills",
    });
    errorTrackingService.captureException(err, {
      module: "facility",
      service: "utility-bills",
    });
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to create utility bill",
      },
      { status: 500 },
    );
  }
}
