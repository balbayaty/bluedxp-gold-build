/**
 * Quantum Computation API
 */

import { NextRequest, NextResponse } from "next/server";
import { isoIMSQuantumService } from "@/lib/services/iso-ims/quantum/isoIMSQuantumService";
import { z } from "zod";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

const computationSchema = z.object({
  type: z.enum(["OPTIMIZATION", "SIMULATION", "ML_INFERENCE", "SEARCH"]),
  input: z.record(z.any()),
  backend: z
    .enum([
      "IBM_QISKIT",
      "GOOGLE_CIRQ",
      "AMAZON_BRAKET",
      "MICROSOFT_QDK",
      "SIMULATOR",
    ])
    .optional(),
});

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const validated = computationSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validated.error.errors },
        { status: 400 },
      );
    }

    const computation = await isoIMSQuantumService.submitQuantumComputation(
      validated.data.type,
      validated.data.input,
      validated.data.backend,
    );

    return NextResponse.json(computation);
  } catch (error) {
    console.error("Error submitting quantum computation:", error);
    return NextResponse.json(
      { error: "Failed to submit quantum computation" },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "iso-ims",
  featureId: "iso-ims.quantum",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
