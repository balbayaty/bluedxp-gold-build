/**
 * Network Modeling API
 *
 * Logistics network design and optimization
 */

import { NextRequest, NextResponse } from "next/server";
import {
  networkModelingService,
  handleTransportationError,
} from "@/lib/services/transportation";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import { transportationDatabaseAdapterInstance } from "@/lib/services/transportation/database/transportationDatabaseAdapter";
import type {
  NetworkNode,
  NetworkLink,
  FacilityLocationOptimization,
} from "@/lib/services/transportation";

export const POST = withTransportationAPI(
  async (request: NextRequest, ctx: { tenantId?: string; userId?: string }) => {
    try {
      const tenantId = ctx.tenantId;
      const userId = ctx.userId || "api-user";
      if (!tenantId)
        return NextResponse.json(
          { error: "Tenant context required" },
          { status: 400 },
        );

      const body = await request.json();
      const { action } = body;

      if (action === "create-model") {
        const { name, description, nodes, links, createdBy } = body;

        if (!name || !nodes || !links || !createdBy) {
          return NextResponse.json(
            { error: "Missing required fields: name, nodes, links, createdBy" },
            { status: 400 },
          );
        }

        const modelId = await networkModelingService.createModel(
          name,
          description,
          nodes,
          links,
          createdBy,
        );

        const model = networkModelingService.getModel(modelId);
        if (model) {
          await transportationDatabaseAdapterInstance.storeNetworkModel(
            model as any,
            { tenantId, createdBy: userId },
          );
        }

        return NextResponse.json({ modelId }, { status: 201 });
      }

      if (action === "optimize") {
        const { modelId, objectives, constraints } = body;

        if (!modelId || !objectives) {
          return NextResponse.json(
            { error: "Missing required fields: modelId, objectives" },
            { status: 400 },
          );
        }

        const result = await networkModelingService.optimizeNetwork(
          modelId,
          objectives,
          constraints,
        );
        await transportationDatabaseAdapterInstance.storeNetworkOptimization(
          result as any,
          { tenantId, createdBy: userId },
        );
        return NextResponse.json(result, { status: 200 });
      }

      if (action === "optimize-facilities") {
        const request: FacilityLocationOptimization = body.request;

        if (
          !request.candidateLocations ||
          !request.demandPoints ||
          !request.createdBy
        ) {
          return NextResponse.json(
            {
              error:
                "Missing required fields: candidateLocations, demandPoints, createdBy",
            },
            { status: 400 },
          );
        }

        const result =
          await networkModelingService.optimizeFacilityLocations(request);
        return NextResponse.json(result, { status: 200 });
      }

      if (action === "create-scenario") {
        const {
          name,
          description,
          baseModelId,
          modifications,
          assumptions,
          createdBy,
        } = body;

        if (!name || !baseModelId || !createdBy) {
          return NextResponse.json(
            { error: "Missing required fields: name, baseModelId, createdBy" },
            { status: 400 },
          );
        }

        const scenarioId = await networkModelingService.createScenario(
          name,
          description,
          baseModelId,
          modifications || [],
          assumptions || [],
          createdBy,
        );

        return NextResponse.json({ scenarioId }, { status: 201 });
      }

      if (action === "analyze-scenario") {
        const { scenarioId } = body;

        if (!scenarioId) {
          return NextResponse.json(
            { error: "Missing scenarioId" },
            { status: 400 },
          );
        }

        const result = await networkModelingService.analyzeScenario(scenarioId);
        return NextResponse.json(result, { status: 200 });
      }

      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error) {
      console.error("Error in network modeling:", error);
      const errorResponse = handleTransportationError(error);
      return NextResponse.json(
        { error: errorResponse.message, details: errorResponse.details },
        { status: errorResponse.statusCode },
      );
    }
  },
  {
    featureId: "network-modeling",
    action: "create",
    requireAuth: true,
    rateLimit: true,
  },
);

export const GET = withTransportationAPI(
  async (request: NextRequest, ctx: { tenantId?: string }) => {
    try {
      const tenantId = ctx.tenantId;
      if (!tenantId)
        return NextResponse.json(
          { error: "Tenant context required" },
          { status: 400 },
        );

      const searchParams = request.nextUrl.searchParams;
      const modelId = searchParams.get("modelId");
      const scenarioId = searchParams.get("scenarioId");

      if (modelId) {
        const model =
          (await transportationDatabaseAdapterInstance
            .listNetworkModels({ tenantId, limit: 1, offset: 0 })
            .then((rows) =>
              rows.find((m) => String((m as any).id) === String(modelId)),
            )) || networkModelingService.getModel(modelId);
        if (!model) {
          return NextResponse.json(
            { error: "Model not found" },
            { status: 404 },
          );
        }
        return NextResponse.json({ model });
      }

      if (scenarioId) {
        const scenario = networkModelingService.getScenario(scenarioId);
        if (!scenario) {
          return NextResponse.json(
            { error: "Scenario not found" },
            { status: 404 },
          );
        }
        return NextResponse.json({ scenario });
      }

      // List all models + optimizations (durable, tenant-scoped)
      const models =
        await transportationDatabaseAdapterInstance.listNetworkModels({
          tenantId,
          limit: 500,
          offset: 0,
        });
      const optimizations =
        await transportationDatabaseAdapterInstance.listNetworkOptimizations({
          tenantId,
          limit: 500,
          offset: 0,
        });
      return NextResponse.json({ models, optimizations });
    } catch (error) {
      console.error("Error fetching network models:", error);
      const errorResponse = handleTransportationError(error);
      return NextResponse.json(
        { error: errorResponse.message, details: errorResponse.details },
        { status: errorResponse.statusCode },
      );
    }
  },
  {
    featureId: "network-modeling",
    action: "read_only",
    requireAuth: true,
    rateLimit: true,
  },
);
