/**
 * Transportation API Middleware
 *
 * Wraps API handlers with authentication, authorization, rate limiting
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway, APIGatewayOptions } from "@/middleware/apiGateway";
import { ModuleId, Action } from "@/types/user";

/**
 * Wrap transportation API handler with gateway middleware
 */
export function withTransportationAPI(
  handler: (req: NextRequest, context: any) => Promise<NextResponse>,
  options: {
    featureId?: string;
    action: Action;
    requireAuth?: boolean;
    rateLimit?: boolean;
  },
) {
  const normalizedFeatureId = (() => {
    if (!options.featureId) return undefined;
    if (options.featureId.includes(".")) return options.featureId as any;

    const key = options.featureId.trim().toLowerCase();
    const alias: Record<string, string> = {
      shipments: "shipments",
      tracking: "tracking",
      routes: "routes",
      pod: "pod",
      freight: "freight",
      carriers: "carriers",
      documents: "documents",
      "enterprise-documents": "enterprise_documents",
      enterprise_documents: "enterprise_documents",
      "customs-authorities": "customs_authorities",
      customs_authorities: "customs_authorities",
      quotes: "quotes",
      payments: "payments",
      proposals: "proposals",
      incidents: "incidents",
      "control-tower": "control_tower",
      control_tower: "control_tower",
      "load-planning": "load_planning",
      "load-planning-advanced": "load_planning",
      "load-building": "load_planning",
      "load-matching": "load_planning",
      multimodal: "multimodal",
      sea: "sea",
      air: "air",
      rail: "rail",
      customs: "customs",
      "customs-declarations": "customs_declarations",
      "customs-brokers": "customs_brokers",
      ports: "ports",
      insurance: "insurance",
      analytics: "analytics",
      integration: "integration",

      // Map advanced capability endpoints to their closest RBAC feature bucket
      "intelligent-route-planning": "routes",
      "route-comparison": "routes",
      "pricing-intelligence": "freight",
      emissions: "analytics",
      "enhanced-transit-time": "routes",
      "touchpoint-analysis": "routes",
      "journey-analysis": "tracking",
      "scenario-simulation": "analytics",
      "digital-twins": "analytics",
      "edge-computing": "analytics",
      "multi-enterprise": "integration",
      "carrier-portal": "carriers",
      realtime: "tracking",
      exports: "analytics",
      collaboration: "integration",
      customization: "integration",
      benchmarking: "analytics",
    };

    const mapped = alias[key] || key.replace(/-/g, "_");
    return `tms.${mapped}` as any;
  })();

  return withAPIGateway(handler, {
    moduleId: "tms" as ModuleId,
    featureId: normalizedFeatureId as any,
    action: options.action,
    requireAuth: options.requireAuth !== false,
    rateLimit: options.rateLimit !== false,
  });
}
