/**
 * Monte Carlo Simulation API Route
 *
 * API endpoint for running Monte Carlo simulations
 */

import { NextRequest, NextResponse } from "next/server";
import { monteCarloSimulationService } from "@/lib/services/analytics";
import type { MonteCarloConfig } from "@/types/analytics";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { touchpoints, phases, config } = body;

    if (!touchpoints || !Array.isArray(touchpoints)) {
      return NextResponse.json(
        { error: "Touchpoints array required" },
        { status: 400 },
      );
    }

    const results = await monteCarloSimulationService.runSimulation(
      touchpoints,
      phases,
      config as Partial<MonteCarloConfig>,
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Monte Carlo simulation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Simulation failed" },
      { status: 500 },
    );
  }
}
