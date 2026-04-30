/**
 * Save MSDS to ERPNext API Route
 * Stores analyzed MSDS data as Items and Documents in ERPNext
 */

import { NextRequest, NextResponse } from "next/server";
import { erpNextAPI } from "@/lib/adapters/erpnext/api";

const ERP_URL = process.env.ERP_NEXT_URL || "https://erp.hazalyze.com";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      extracted,
      fileName,
      status,
      fileData,
      approvedBy,
      rejectionReason,
      linkedCustomer,
      linkedUser,
      customerEmail,
    } = body;

    console.log(
      "[save-msds] Saving to ERPNext:",
      extracted?.productName,
      "Status:",
      status,
    );

    // Create Item in ERPNext
    const itemData: any = {
      item_code: extracted?.casNumber || `CHEM-${Date.now()}`,
      item_name: extracted?.productName || "Chemical Product",
      item_group: "Chemical Products",
      stock_uom: "Kg",
      is_stock_item: 1,

      // Chemical data
      custom_cas_number: extracted?.casNumber,
      custom_chemical_formula: extracted?.formula,
      custom_hazard_class: extracted?.hazardClass,
      custom_hazard_level: extracted?.hazardLevel,
      custom_flash_point: extracted?.flashPoint,
      custom_boiling_point: extracted?.boilingPoint,
      custom_physical_state: extracted?.physicalState,
      custom_manufacturer: extracted?.manufacturer,
      custom_ghs_compliant: extracted?.ghsCompliant ? 1 : 0,
      custom_safety_score: extracted?.safetyScore || 0,
      custom_ai_confidence: extracted?.aiConfidence || 0,

      // Transport & packaging
      custom_un_number: extracted?.unNumber,
      custom_transport_class: extracted?.transportClass,
      custom_packing_group: extracted?.packingGroup,
      custom_packaging_type: extracted?.packagingType,

      // NFPA ratings
      custom_health_rating: extracted?.healthRating,
      custom_flammability_rating: extracted?.flammabilityRating,
      custom_reactivity_rating: extracted?.reactivityRating,

      // Fire safety
      custom_fire_suppression_required: extracted?.fireSuppressionRequired,
      custom_special_hazards: extracted?.specialHazards,

      // Approval status
      custom_approval_status:
        status === "approved"
          ? "Approved"
          : status === "rejected"
            ? "Rejected"
            : "Pending",
      custom_document_type: "MSDS",

      // Approval tracking
      custom_approved_by: approvedBy || "",
      custom_approval_date: new Date().toISOString(),
      custom_rejection_reason: rejectionReason || "",

      // Linked entities
      custom_linked_customer: linkedCustomer || "",
      custom_linked_user: linkedUser || "",
      custom_customer_email: customerEmail || "",
    };

    // Use ERPNext API adapter - create Item document
    const documentData = {
      doctype: "Item",
      ...itemData,
    };
    const result = await erpNextAPI.createDocument(documentData);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to save MSDS to ERPNext",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "MSDS saved to ERPNext",
      itemId: result.data?.name || itemData.item_code,
      itemName: itemData.item_name,
      erpNextUrl: `${ERP_URL}/app/item/${result.data?.name || itemData.item_code}`,
    });
  } catch (error) {
    console.error("[save-msds] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to save MSDS",
      },
      { status: 500 },
    );
  }
}
