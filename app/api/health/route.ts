/**
 * Health Check API
 * Provides system health status for monitoring
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/services/database/prismaClient";

export async function GET() {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    services: {
      database: "unknown",
      qhse: "unknown",
      isoIms: "unknown",
    },
    uptime: process.uptime(),
  };

  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    health.services.database = "healthy";
  } catch (error) {
    health.status = "degraded";
    health.services.database = "unhealthy";
  }

  // Check QHSE service
  try {
    const { qhseIncidentService } = await import("@/lib/services/qhse");
    health.services.qhse = "healthy";
  } catch (error) {
    health.services.qhse = "unhealthy";
  }

  // Check ISO-IMS service
  try {
    const { capaService } = await import("@/lib/services/iso-ims/capaService");
    health.services.isoIms = "healthy";
  } catch (error) {
    health.services.isoIms = "unhealthy";
  }

  const statusCode = health.status === "healthy" ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}
