/**
 * Insurance Management API
 *
 * Manage cargo insurance policies and claims
 */

import { NextRequest, NextResponse } from "next/server";
import { insuranceService } from "@/lib/services/transportation/insuranceService";
import type {
  CreatePolicyRequest,
  CreateClaimRequest,
} from "@/lib/services/transportation/insuranceService";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import { transportationDatabaseAdapterInstance } from "@/lib/services/transportation/database/transportationDatabaseAdapter";
import { evidenceService } from "@/lib/services/evidence";
import { eventBus } from "@/lib/services/event-store";
import { createEvent } from "@/lib/services/event-store/utils";

async function postHandler(
  request: NextRequest,
  context: { tenantId?: string; userId?: string },
) {
  try {
    const tenantId = context.tenantId;
    const userId = context.userId || "api-user";
    if (!tenantId)
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );

    const body = await request.json();
    const action = body.action || "create_policy";

    if (action === "create_policy") {
      const policyRequest: CreatePolicyRequest = {
        shipmentId: body.shipmentId,
        shipmentNumber: body.shipmentNumber,
        provider: body.provider,
        providerId: body.providerId,
        coverageAmount: body.coverageAmount,
        premium: body.premium,
        currency: body.currency || "SAR",
        effectiveDate: body.effectiveDate || new Date().toISOString(),
        expiryDate: body.expiryDate,
        coverageType: body.coverageType || "ALL_RISK",
        deductible: body.deductible,
        metadata: body.metadata,
        createdBy: userId,
        tenantId,
      };

      if (
        !policyRequest.shipmentId ||
        !policyRequest.provider ||
        !policyRequest.coverageAmount ||
        !policyRequest.expiryDate
      ) {
        return NextResponse.json(
          {
            error:
              "Missing required fields: shipmentId, provider, coverageAmount, expiryDate",
          },
          { status: 400 },
        );
      }

      const policy = await insuranceService.createPolicy(policyRequest);

      // Persist to database
      await transportationDatabaseAdapterInstance.storeInsurancePolicy(
        policy as any,
        { tenantId, createdBy: userId },
      );

      const evidence = await evidenceService.create({
        tenantId,
        type: "event",
        category: "insurance",
        title: `Insurance policy created: ${policy.policyNumber}`,
        description: "Insurance policy created",
        content: JSON.stringify(policy, null, 2),
        createdBy: userId,
        metadata: {
          source: "transportation-api",
          capturedAt: new Date().toISOString(),
        },
        relatedEntities: [
          {
            entityId: policy.id,
            entityType: "insurance_policy",
            relationship: "subject",
          },
        ],
        tags: ["tms", "transportation", "insurance"],
      } as any);

      return NextResponse.json(policy, { status: 201 });
    }

    if (action === "create_claim") {
      const claimRequest: CreateClaimRequest = {
        policyId: body.policyId,
        amount: body.amount,
        currency: body.currency,
        description: body.description,
        incidentDate: body.incidentDate || new Date().toISOString(),
        documents: body.documents,
        notes: body.notes,
        createdBy: userId,
        tenantId,
      };

      if (
        !claimRequest.policyId ||
        !claimRequest.amount ||
        !claimRequest.description
      ) {
        return NextResponse.json(
          { error: "Missing required fields: policyId, amount, description" },
          { status: 400 },
        );
      }

      const claim = await insuranceService.createClaim(claimRequest);

      // Persist to database
      await transportationDatabaseAdapterInstance.storeInsuranceClaim(
        claim as any,
        { tenantId, createdBy: userId },
      );

      return NextResponse.json(claim, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in insurance API:", error);
    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

async function getHandler(
  request: NextRequest,
  context: { tenantId?: string },
) {
  try {
    const tenantId = context.tenantId;
    if (!tenantId)
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action") || "list";
    const policyId = searchParams.get("policyId");
    const shipmentId = searchParams.get("shipmentId");
    const claimId = searchParams.get("claimId");
    const status = searchParams.get("status");
    const provider = searchParams.get("provider");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (action === "statistics") {
      const stats = await insuranceService.getStatistics(tenantId, {
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
      });
      return NextResponse.json(stats);
    }

    if (policyId) {
      const policy = await insuranceService.getPolicy(policyId, tenantId);
      if (!policy) {
        return NextResponse.json(
          { error: "Policy not found" },
          { status: 404 },
        );
      }
      return NextResponse.json(policy);
    }

    if (claimId) {
      const claim = await insuranceService.getClaim(claimId, tenantId);
      if (!claim) {
        return NextResponse.json({ error: "Claim not found" }, { status: 404 });
      }
      return NextResponse.json(claim);
    }

    if (shipmentId) {
      const policies = await insuranceService.getPoliciesByShipment(
        shipmentId,
        tenantId,
      );
      return NextResponse.json({ policies });
    }

    // List all policies
    const policies = await insuranceService.getPolicies(tenantId, {
      status: status || undefined,
      provider: provider || undefined,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });

    return NextResponse.json({ policies });
  } catch (error) {
    console.error("Error getting insurance data:", error);
    return NextResponse.json(
      {
        error: "Failed to get insurance data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

async function putHandler(
  request: NextRequest,
  context: { tenantId?: string; userId?: string },
) {
  try {
    const tenantId = context.tenantId;
    const userId = context.userId || "api-user";
    if (!tenantId)
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );

    const body = await request.json();
    const { id, action, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    if (action === "update_claim_status") {
      const { status, notes } = updates;
      if (!status) {
        return NextResponse.json({ error: "Missing status" }, { status: 400 });
      }

      const claim = await insuranceService.updateClaimStatus(
        id,
        status,
        userId,
        notes,
        tenantId,
      );
      if (!claim) {
        return NextResponse.json({ error: "Claim not found" }, { status: 404 });
      }

      return NextResponse.json(claim);
    }

    // Update policy
    const policy = await insuranceService.updatePolicy(id, updates, tenantId);
    if (!policy) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    return NextResponse.json(policy);
  } catch (error) {
    console.error("Error updating insurance:", error);
    return NextResponse.json(
      {
        error: "Failed to update",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export const POST = withTransportationAPI(postHandler, {
  featureId: "insurance",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});

export const GET = withTransportationAPI(getHandler, {
  featureId: "insurance",
  action: "read_only",
  requireAuth: true,
  rateLimit: true,
});

export const PUT = withTransportationAPI(putHandler, {
  featureId: "insurance",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
