/**
 * MaaS Dashboard API Route
 * GET /api/maas - Get MaaS dashboard data
 *
 * Returns comprehensive dashboard data including:
 * - Overview metrics (tenants, revenue, utilization)
 * - 12 pillars status and metrics
 * - Revenue breakdown by pillar
 * - Utilization trends
 * - Recent activity
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway, APIGatewayOptions } from "@/middleware/apiGateway";
import { maasService, MAAS_PILLARS } from "@/lib/services/maas";
import type { MAASPillar } from "@/lib/services/maas/types";

async function handler(req: NextRequest, context: any): Promise<NextResponse> {
  const tenantId = context.tenantId || "default-tenant";

  try {
    if (req.method === "GET") {
      // Get all pillars
      const pillars = maasService.getAllPillars();

      // Generate sample data for demonstration
      // In production, this would come from the database
      const sampleUtilization = [
        45, 52, 48, 58, 55, 62, 59, 65, 68, 72, 70, 75,
      ];
      const sampleRevenue = [
        125000, 98000, 145000, 112000, 89000, 156000, 134000, 178000, 167000,
        198000, 189000, 210000,
      ];

      // Calculate pillar metrics
      const pillarMetrics = pillars.map((pillar, index) => {
        const utilization =
          sampleUtilization[index] || Math.floor(Math.random() * 40 + 30);
        const revenue =
          sampleRevenue[index] || Math.floor(Math.random() * 150000 + 50000);

        return {
          id: pillar.type,
          name: pillar.name,
          utilization: utilization,
          revenue: revenue,
          status:
            utilization > 50
              ? "active"
              : utilization > 30
                ? "pending"
                : ("inactive" as "active" | "inactive" | "pending"),
        };
      });

      // Calculate totals
      const totalRevenue = pillarMetrics.reduce((sum, p) => sum + p.revenue, 0);
      const averageUtilization =
        pillarMetrics.reduce((sum, p) => sum + p.utilization, 0) /
        pillarMetrics.length;

      // Revenue breakdown by pillar
      const revenueByPillar = pillarMetrics.map((p) => ({
        pillar: p.id,
        revenue: p.revenue,
        percentage: totalRevenue > 0 ? (p.revenue / totalRevenue) * 100 : 0,
      }));

      // Utilization trend (last 4 weeks)
      const utilizationTrend = [
        { date: "Week 1", utilization: 45 },
        { date: "Week 2", utilization: 52 },
        { date: "Week 3", utilization: 48 },
        { date: "Week 4", utilization: 58 },
      ];

      // Recent activity (sample)
      const recentActivity = [
        {
          id: "activity-1",
          type: "tenant_registered",
          message: "New tenant registered: Manufacturing Co. Ltd.",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "activity-2",
          type: "resource_allocated",
          message: "Resources allocated to Smart Factory Infrastructure pillar",
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "activity-3",
          type: "revenue_generated",
          message: "Revenue milestone: 2M SAR reached this month",
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "activity-4",
          type: "pillar_activated",
          message: "Digital Twin Platform pillar activated",
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        },
      ];

      const dashboard = {
        totalTenants: 8, // Sample data
        activePillars: pillars.length,
        totalRevenue: totalRevenue,
        utilizationRate: Math.round(averageUtilization * 10) / 10,
        recentActivity: recentActivity,
        pillars: pillarMetrics,
        revenueByPillar: revenueByPillar,
        utilizationTrend: utilizationTrend,
      };

      return NextResponse.json({ dashboard });
    }

    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  } catch (error: any) {
    console.error("MaaS Dashboard API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process request" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(handler, {
  requireAuth: true,
  rateLimit: { requests: 100, window: "1m" },
} as APIGatewayOptions);
