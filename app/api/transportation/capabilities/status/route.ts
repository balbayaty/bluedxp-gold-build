import { NextRequest, NextResponse } from "next/server";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import {
  getCapabilityStatusForPath,
  transportationCapabilities,
} from "@/lib/services/capabilities/registry";
import { resolveCapabilityStatus } from "@/lib/services/capabilities/resolver";

async function getHandler(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path");

  if (path) {
    const base = getCapabilityStatusForPath(path);
    if (!base) return NextResponse.json({ path, status: null });
    return NextResponse.json({ path, status: resolveCapabilityStatus(base) });
  }

  // Bulk mode: return resolved statuses for the explicit catalog entries.
  const rows = transportationCapabilities.map((c) => ({
    path: c.path,
    status: resolveCapabilityStatus(c.status),
  }));

  return NextResponse.json({ rows });
}

export const GET = withTransportationAPI(getHandler, {
  featureId: "analytics",
  action: "read_only",
  requireAuth: true,
  rateLimit: true,
});
