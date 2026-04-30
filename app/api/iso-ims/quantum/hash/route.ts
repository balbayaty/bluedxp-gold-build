/**
 * Quantum-Safe Hash API
 */

import { NextRequest, NextResponse } from "next/server";
import { isoIMSQuantumService } from "@/lib/services/iso-ims/quantum/isoIMSQuantumService";
import { z } from "zod";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

const hashSchema = z.object({
  data: z.string(),
  algorithm: z
    .enum(["SHA3-256", "SHA3-512", "BLAKE3", "XOF-SHAKE256"])
    .optional(),
});

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const validated = hashSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validated.error.errors },
        { status: 400 },
      );
    }

    const hash = isoIMSQuantumService.generateQuantumSafeHash(
      validated.data.data,
      validated.data.algorithm,
    );

    return NextResponse.json(hash);
  } catch (error) {
    console.error("Error generating quantum-safe hash:", error);
    return NextResponse.json(
      { error: "Failed to generate hash" },
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
