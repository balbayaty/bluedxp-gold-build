/**
 * Trade Compliance Licenses API
 * GET: List all licenses
 */

import { NextRequest, NextResponse } from "next/server";
import { tradeComplianceService } from "@/lib/services/trade-compliance/tradeComplianceService";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId") || "default";
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    // Get all records for tenant
    const records = tradeComplianceService.getRecordsByTenant(tenantId);

    // Extract licenses from records
    let licenses: any[] = [];

    for (const record of records) {
      // Check requiredLicenses
      if (record.requiredLicenses && record.requiredLicenses.length > 0) {
        for (const licenseReq of record.requiredLicenses) {
          const license = {
            id: licenseReq.id,
            licenseNumber: `LIC-${licenseReq.id}`,
            licenseType: licenseReq.licenseType,
            status: "PENDING",
            productCategory: record.products[0]?.category || "OTHER",
            recordId: record.id,
            appliedDate: record.createdAt,
            expiryDate: undefined,
            authority: licenseReq.authority,
          };

          // Apply filters
          if (type && license.licenseType !== type) continue;
          if (status && license.status !== status) continue;

          licenses.push(license);
        }
      }

      // Check obtainedLicenses
      if (record.obtainedLicenses && record.obtainedLicenses.length > 0) {
        for (const obtainedLicense of record.obtainedLicenses) {
          const license = {
            id: obtainedLicense.id,
            licenseNumber: obtainedLicense.licenseNumber,
            licenseType: obtainedLicense.licenseType,
            status:
              obtainedLicense.status === "VALID"
                ? "APPROVED"
                : obtainedLicense.status,
            productCategory: record.products[0]?.category || "OTHER",
            recordId: record.id,
            appliedDate: obtainedLicense.issueDate,
            expiryDate: obtainedLicense.expiryDate,
            authority: obtainedLicense.authority,
          };

          // Apply filters
          if (type && license.licenseType !== type) continue;
          if (status && license.status !== status) continue;

          licenses.push(license);
        }
      }

      // Check pendingLicenses
      if (record.pendingLicenses && record.pendingLicenses.length > 0) {
        for (const pendingLicense of record.pendingLicenses) {
          const license = {
            id: pendingLicense.id,
            licenseNumber:
              pendingLicense.applicationNumber || `LIC-${pendingLicense.id}`,
            licenseType: pendingLicense.licenseType,
            status: pendingLicense.status,
            productCategory: record.products[0]?.category || "OTHER",
            recordId: record.id,
            appliedDate: pendingLicense.applicationDate,
            expiryDate: pendingLicense.expectedIssueDate,
            authority: pendingLicense.authority,
          };

          // Apply filters
          if (type && license.licenseType !== type) continue;
          if (status && license.status !== status) continue;

          licenses.push(license);
        }
      }
    }

    return NextResponse.json({
      success: true,
      licenses,
      count: licenses.length,
    });
  } catch (error) {
    console.error("Error fetching licenses:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch licenses" },
      { status: 500 },
    );
  }
}
