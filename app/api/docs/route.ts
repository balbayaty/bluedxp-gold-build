/**
 * OpenAPI Documentation Endpoint
 * Serves OpenAPI 3.0 specification
 */

import { NextResponse } from "next/server";
import openapiSpec from "./openapi.json";

export async function GET() {
  return NextResponse.json(openapiSpec, {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
