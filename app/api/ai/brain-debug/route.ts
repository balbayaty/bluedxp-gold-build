import { NextRequest, NextResponse } from "next/server";
import { MirsadAIBrain } from "@/lib/services/ai/mirsadAIBrain";

/**
 * BRAIN DEBUGGER API
 * Exposes the Deep Consensus Engine for testing and visualization
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, input, tenantId = "debug-tenant" } = body;

    if (!type || !input) {
      return NextResponse.json(
        { error: "Missing required fields: type, input" },
        { status: 400 },
      );
    }

    console.log(`🧠 DEBUG: API invoking Mirsad Brain for ${type}...`);

    // Get the singleton brain instance
    const brain = MirsadAIBrain.getInstance();

    // Call the newly upgraded "Deep Consensus" predict method
    const result = await brain.predict(tenantId, type, input, {
      includeAlternatives: true, // We want to see the thinking process
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Brain Debugger Error:", error);
    return NextResponse.json(
      {
        error: "Brain Execution Failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
