/**
 * QHSE Cross-Module Connections API Route
 * Get related items from other modules connected to QHSE data
 */

import { NextRequest, NextResponse } from "next/server";
import { qhseIncidentService } from "@/lib/services/qhse/incidentService";
import { qhseEcosystemIntegrationService } from "@/lib/services/qhse/integration/qhseEcosystemIntegrationService";
import { eventBus } from "@/lib/services/event-store";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId");
    const customerId = searchParams.get("customerId");
    const warehouseId = searchParams.get("warehouseId");

    // Get recent incidents to find connections
    const incidents = await qhseIncidentService.getIncidents({
      tenantId,
      customerId,
      warehouseId,
      limit: 10,
    });

    const connections: Array<{
      module: string;
      type: string;
      count: number;
      items: Array<{
        id: string;
        title: string;
        link: string;
      }>;
    }> = [];

    // Find WMS connections (warehouse operations related to incidents)
    const wmsConnections = incidents
      .filter((i) => i.warehouseId)
      .map((i) => ({
        id: i.id,
        title: `Warehouse Operation - ${i.incidentNumber || i.id}`,
        link: `/warehouses/${i.warehouseId}`,
      }));

    if (wmsConnections.length > 0) {
      connections.push({
        module: "WMS",
        type: "warehouse_operations",
        count: wmsConnections.length,
        items: wmsConnections.slice(0, 5),
      });
    }

    // Find Chemical connections (chemical incidents)
    const chemicalConnections = incidents
      .filter(
        (i) => i.category === "ENVIRONMENTAL" || i.type === "CHEMICAL_SPILL",
      )
      .map((i) => ({
        id: i.id,
        title: `Chemical Incident - ${i.incidentNumber || i.id}`,
        link: `/chemical-incidents/${i.id}`,
      }));

    if (chemicalConnections.length > 0) {
      connections.push({
        module: "Chemical",
        type: "chemical_incidents",
        count: chemicalConnections.length,
        items: chemicalConnections.slice(0, 5),
      });
    }

    // Find ISO-IMS connections (NCRs and CAPAs)
    const isoImsConnections: Array<{
      id: string;
      title: string;
      link: string;
    }> = [];

    for (const incident of incidents.slice(0, 5)) {
      try {
        const ncrs = await qhseEcosystemIntegrationService.getRelatedNCRs(
          incident.id,
        );
        const capas = await qhseEcosystemIntegrationService.getRelatedCAPAs(
          incident.id,
        );

        ncrs.forEach((ncr) => {
          isoImsConnections.push({
            id: ncr.id,
            title: `NCR ${ncr.ncrNumber} - Related to Incident ${incident.incidentNumber}`,
            link: ncr.link,
          });
        });

        capas.forEach((capa) => {
          isoImsConnections.push({
            id: capa.id,
            title: `CAPA ${capa.capaNumber} - Related to Incident ${incident.incidentNumber}`,
            link: capa.link,
          });
        });
      } catch (error) {
        console.error(
          `Error fetching connections for incident ${incident.id}:`,
          error,
        );
      }
    }

    if (isoImsConnections.length > 0) {
      connections.push({
        module: "ISO-IMS",
        type: "ncrs_and_capas",
        count: isoImsConnections.length,
        items: isoImsConnections.slice(0, 5),
      });
    }

    // Find Compliance connections (regulatory issues)
    const complianceConnections = incidents
      .filter((i) => i.severity === "CRITICAL" || i.severity === "HIGH")
      .map((i) => ({
        id: i.id,
        title: `Compliance Issue - ${i.incidentNumber || i.id}`,
        link: `/compliance/issues/${i.id}`,
      }));

    if (complianceConnections.length > 0) {
      connections.push({
        module: "Compliance",
        type: "compliance_issues",
        count: complianceConnections.length,
        items: complianceConnections.slice(0, 5),
      });
    }

    // Find Facility connections (facility-related incidents)
    const facilityConnections = incidents
      .filter((i) => i.location?.facilityId)
      .map((i) => ({
        id: i.id,
        title: `Facility Incident - ${i.incidentNumber || i.id}`,
        link: `/facility/incidents/${i.id}`,
      }));

    if (facilityConnections.length > 0) {
      connections.push({
        module: "Facility",
        type: "facility_incidents",
        count: facilityConnections.length,
        items: facilityConnections.slice(0, 5),
      });
    }

    return NextResponse.json({
      success: true,
      data: connections,
    });
  } catch (error) {
    console.error("Error fetching cross-module connections:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch connections",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "qhse",
  featureId: "qhse.cross-module-connections",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
