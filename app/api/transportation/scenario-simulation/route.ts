/**
 * Scenario Simulation API
 *
 * What-if modeling for transportation planning
 */

import { NextRequest, NextResponse } from "next/server";
import {
  scenarioSimulationService,
  handleTransportationError,
} from "@/lib/services/transportation";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import type { ScenarioSimulationRequest } from "@/lib/services/transportation";

export const POST = withTransportationAPI(
  async (request: NextRequest) => {
    try {
      const body: ScenarioSimulationRequest = await request.json();

      if (!body.baseShipment || !body.scenarios || !body.createdBy) {
        return NextResponse.json(
          {
            error:
              "Missing required fields: baseShipment, scenarios, createdBy",
          },
          { status: 400 },
        );
      }

      const result = await scenarioSimulationService.simulateScenarios(body);

      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      console.error("Error simulating scenarios:", error);
      const errorResponse = handleTransportationError(error);
      return NextResponse.json(
        { error: errorResponse.message, details: errorResponse.details },
        { status: errorResponse.statusCode },
      );
    }
  },
  {
    featureId: "scenario-simulation",
    action: "create",
    requireAuth: true,
    rateLimit: true,
  },
);

export const GET = withTransportationAPI(
  async (request: NextRequest) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const scenarioId = searchParams.get("scenarioId");

      if (scenarioId) {
        const scenario = scenarioSimulationService.getScenario(scenarioId);
        const result = scenarioSimulationService.getScenarioResult(scenarioId);

        if (!scenario) {
          return NextResponse.json(
            { error: "Scenario not found" },
            { status: 404 },
          );
        }

        return NextResponse.json({ scenario, result });
      }

      // List all scenarios
      const scenarios = scenarioSimulationService.listScenarios();
      return NextResponse.json({ scenarios });
    } catch (error) {
      console.error("Error fetching scenarios:", error);
      const errorResponse = handleTransportationError(error);
      return NextResponse.json(
        { error: errorResponse.message, details: errorResponse.details },
        { status: errorResponse.statusCode },
      );
    }
  },
  {
    featureId: "scenario-simulation",
    action: "read_only",
    requireAuth: true,
    rateLimit: true,
  },
);
