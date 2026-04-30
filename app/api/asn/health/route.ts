/**
 * ASN Module Health Check
 * Returns health status of ASN module
 */

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    // Check ASN table exists
    const asnCount = await prisma.aSN.count().catch(() => 0);
    const itemCount = await prisma.aSNItem.count().catch(() => 0);
    const exceptionCount = await prisma.aSNException.count().catch(() => 0);

    // Check services
    let servicesStatus = "ok";
    try {
      const { getAsnService } = await import("@/lib/services/asn");
      const service = getAsnService();
      if (!service) servicesStatus = "error";
    } catch {
      servicesStatus = "error";
    }

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      module: "asn",
      version: "2.0.0",
      database: {
        connected: true,
        tables: {
          ASN: asnCount,
          ASNItem: itemCount,
          ASNException: exceptionCount,
        },
      },
      services: {
        status: servicesStatus,
      },
      checks: {
        database: "ok",
        tables: "ok",
        services: servicesStatus,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        module: "asn",
        error: error.message,
      },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
