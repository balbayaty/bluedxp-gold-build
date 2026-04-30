/**
 * Multi-Enterprise Network API
 *
 * Trading partner management and collaborative planning
 */

import { NextRequest, NextResponse } from "next/server";
import {
  multiEnterpriseNetworkService,
  handleTransportationError,
} from "@/lib/services/transportation";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import type {
  TradingPartner,
  CollaborativePlan,
} from "@/lib/services/transportation";

export const POST = withTransportationAPI(
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const { action } = body;

      if (action === "register-partner") {
        const partner: Omit<TradingPartner, "id" | "createdAt" | "updatedAt"> =
          body.partner;

        if (!partner.name || !partner.type || !partner.contact) {
          return NextResponse.json(
            { error: "Missing required fields: name, type, contact" },
            { status: 400 },
          );
        }

        const partnerId =
          await multiEnterpriseNetworkService.registerPartner(partner);
        return NextResponse.json({ partnerId }, { status: 201 });
      }

      if (action === "create-plan") {
        const plan: Omit<CollaborativePlan, "id" | "createdAt" | "updatedAt"> =
          body.plan;

        if (!plan.name || !plan.participants || !plan.createdBy) {
          return NextResponse.json(
            { error: "Missing required fields: name, participants, createdBy" },
            { status: 400 },
          );
        }

        const planId =
          await multiEnterpriseNetworkService.createCollaborativePlan(plan);
        return NextResponse.json({ planId }, { status: 201 });
      }

      if (action === "initiate-collaboration") {
        const { type, participants, data, permissions, initiatedBy } = body;

        if (!type || !participants || !initiatedBy) {
          return NextResponse.json(
            {
              error: "Missing required fields: type, participants, initiatedBy",
            },
            { status: 400 },
          );
        }

        const collaborationId =
          await multiEnterpriseNetworkService.initiateCollaboration(
            type,
            participants,
            data || {},
            permissions || {
              view: participants,
              edit: [initiatedBy],
              approve: participants,
            },
            initiatedBy,
          );

        return NextResponse.json({ collaborationId }, { status: 201 });
      }

      if (action === "accept-collaboration") {
        const { collaborationId, partnerId } = body;

        if (!collaborationId || !partnerId) {
          return NextResponse.json(
            { error: "Missing required fields: collaborationId, partnerId" },
            { status: 400 },
          );
        }

        await multiEnterpriseNetworkService.acceptCollaboration(
          collaborationId,
          partnerId,
        );
        return NextResponse.json({ success: true }, { status: 200 });
      }

      if (action === "share-capacity") {
        const { fromPartnerId, toPartnerId, capacity } = body;

        if (!fromPartnerId || !toPartnerId || !capacity) {
          return NextResponse.json(
            {
              error:
                "Missing required fields: fromPartnerId, toPartnerId, capacity",
            },
            { status: 400 },
          );
        }

        const collaborationId =
          await multiEnterpriseNetworkService.shareCapacity(
            fromPartnerId,
            toPartnerId,
            capacity,
          );

        return NextResponse.json({ collaborationId }, { status: 201 });
      }

      if (action === "optimize-collaboratively") {
        const { planId, objectives } = body;

        if (!planId || !objectives) {
          return NextResponse.json(
            { error: "Missing required fields: planId, objectives" },
            { status: 400 },
          );
        }

        const result =
          await multiEnterpriseNetworkService.optimizeCollaboratively(
            planId,
            objectives,
          );
        return NextResponse.json(result, { status: 200 });
      }

      if (action === "send-message") {
        const message = body.message;

        if (
          !message.fromPartnerId ||
          !message.toPartnerId ||
          !message.subject
        ) {
          return NextResponse.json(
            {
              error:
                "Missing required fields: fromPartnerId, toPartnerId, subject",
            },
            { status: 400 },
          );
        }

        const messageId =
          await multiEnterpriseNetworkService.sendMessage(message);
        return NextResponse.json({ messageId }, { status: 201 });
      }

      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error) {
      console.error("Error in multi-enterprise network:", error);
      const errorResponse = handleTransportationError(error);
      return NextResponse.json(
        { error: errorResponse.message, details: errorResponse.details },
        { status: errorResponse.statusCode },
      );
    }
  },
  {
    featureId: "multi-enterprise",
    action: "create",
    requireAuth: true,
    rateLimit: true,
  },
);

export const GET = withTransportationAPI(
  async (request: NextRequest) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const partnerId = searchParams.get("partnerId");
      const planId = searchParams.get("planId");
      const collaborationId = searchParams.get("collaborationId");
      const action = searchParams.get("action");

      if (partnerId) {
        if (action === "analytics") {
          const dateFrom = searchParams.get("dateFrom");
          const dateTo = searchParams.get("dateTo");

          if (!dateFrom || !dateTo) {
            return NextResponse.json(
              { error: "Missing dateFrom or dateTo" },
              { status: 400 },
            );
          }

          const analytics =
            await multiEnterpriseNetworkService.getNetworkAnalytics(partnerId, {
              from: new Date(dateFrom),
              to: new Date(dateTo),
            });

          return NextResponse.json({ analytics });
        }

        if (action === "messages") {
          const unreadOnly = searchParams.get("unreadOnly") === "true";
          const messages = multiEnterpriseNetworkService.getMessages(
            partnerId,
            unreadOnly,
          );
          return NextResponse.json({ messages });
        }

        const partner = multiEnterpriseNetworkService.getPartner(partnerId);
        if (!partner) {
          return NextResponse.json(
            { error: "Partner not found" },
            { status: 404 },
          );
        }
        return NextResponse.json({ partner });
      }

      if (planId) {
        const plan = multiEnterpriseNetworkService.getPlan(planId);
        if (!plan) {
          return NextResponse.json(
            { error: "Plan not found" },
            { status: 404 },
          );
        }
        return NextResponse.json({ plan });
      }

      if (collaborationId) {
        const collaboration =
          multiEnterpriseNetworkService.getCollaboration(collaborationId);
        if (!collaboration) {
          return NextResponse.json(
            { error: "Collaboration not found" },
            { status: 404 },
          );
        }
        return NextResponse.json({ collaboration });
      }

      // List all partners
      const type = searchParams.get("type");
      const partners = multiEnterpriseNetworkService.listPartners(type as any);
      return NextResponse.json({ partners });
    } catch (error) {
      console.error("Error fetching multi-enterprise network data:", error);
      const errorResponse = handleTransportationError(error);
      return NextResponse.json(
        { error: errorResponse.message, details: errorResponse.details },
        { status: errorResponse.statusCode },
      );
    }
  },
  {
    featureId: "multi-enterprise",
    action: "read_only",
    requireAuth: true,
    rateLimit: true,
  },
);
