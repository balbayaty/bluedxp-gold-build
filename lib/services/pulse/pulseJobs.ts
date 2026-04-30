/**
 * Pulse Background Jobs
 * Daily mission generation, score snapshots, benchmark aggregation
 */

import { PrismaClient } from "@prisma/client";
import { pulseMissionService } from "./pulseMissionService";
import { pulseScoreboardService } from "./pulseScoreboardService";
import { pulseBenchmarkService } from "./pulseBenchmarkService";
import type { ScopeType } from "@/types/pulse";

const prisma = new PrismaClient();

/**
 * Generate daily missions for all active users
 * Should run daily at midnight (timezone-aware)
 */
export async function generateDailyMissionsJob() {
  try {
    console.log("Pulse: Starting daily mission generation job");

    // Get all active users
    // Note: User model may not exist - use fallback
    let users: Array<{ id: string; tenantId: string; preferences?: any }> = [];
    try {
      users =
        (await (prisma as any).user?.findMany({
          where: {
            status: "ACTIVE",
          },
          select: {
            id: true,
            tenantId: true,
            preferences: true,
          },
        })) || [];
    } catch (error) {
      console.warn(
        "Pulse: User model not found, skipping daily mission generation",
      );
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        // Get user timezone from preferences or default
        const timezone = (user.preferences as any)?.timezone || "UTC";

        // Generate missions for user's local date
        await pulseMissionService.generateDailyMissions(
          user.id,
          user.tenantId,
          today,
        );
        successCount++;
      } catch (error) {
        console.error(
          `Pulse: Error generating missions for user ${user.id}:`,
          error,
        );
        errorCount++;
      }
    }

    console.log(
      `Pulse: Daily mission generation complete. Success: ${successCount}, Errors: ${errorCount}`,
    );
  } catch (error) {
    console.error("Pulse: Error in daily mission generation job:", error);
    throw error;
  }
}

/**
 * Evaluate weekly boss battles and distribute rewards
 * Should run weekly on Sunday
 */
export async function evaluateWeeklyBossBattlesJob() {
  try {
    console.log("Pulse: Starting weekly boss battle evaluation job");

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Get all active weekly missions
    const weeklyMissions = await prisma.pulseMission.findMany({
      where: {
        missionType: "WEEKLY",
        startAt: { lte: now },
        endAt: { gte: now },
      },
    });

    for (const mission of weeklyMissions) {
      try {
        // Evaluate mission based on scope
        const progress = await prisma.pulseMissionProgress.findMany({
          where: {
            missionId: mission.id,
            status: "COMPLETED",
          },
        });

        // Distribute rewards if mission requirements met
        // (Implementation depends on mission requirements)
        console.log(
          `Pulse: Evaluated mission ${mission.id}, ${progress.length} completions`,
        );
      } catch (error) {
        console.error(`Pulse: Error evaluating mission ${mission.id}:`, error);
      }
    }

    console.log("Pulse: Weekly boss battle evaluation complete");
  } catch (error) {
    console.error("Pulse: Error in weekly boss battle evaluation job:", error);
    throw error;
  }
}

/**
 * Calculate score snapshots for all scopes
 * Should run daily and weekly
 */
export async function calculateScoreSnapshotsJob(
  period: "daily" | "weekly" = "daily",
) {
  try {
    console.log(`Pulse: Starting ${period} score snapshot calculation job`);

    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    if (period === "daily") {
      periodStart = new Date(now);
      periodStart.setHours(0, 0, 0, 0);
      periodEnd = new Date(periodStart);
      periodEnd.setHours(23, 59, 59, 999);
    } else {
      // Weekly
      periodStart = new Date(now);
      periodStart.setDate(periodStart.getDate() - periodStart.getDay());
      periodStart.setHours(0, 0, 0, 0);
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodEnd.getDate() + 7);
    }

    // Get all tenants
    // Note: Tenant model may not exist - use fallback
    let tenants: Array<{ id: string }> = [];
    try {
      tenants =
        (await (prisma as any).tenant?.findMany({
          select: { id: true },
        })) || [];
    } catch (error) {
      console.warn("Pulse: Tenant model not found, using default tenant");
      tenants = [{ id: "default" }];
    }

    for (const tenant of tenants) {
      try {
        // Calculate company snapshot
        await pulseScoreboardService.calculateSnapshot(
          "COMPANY",
          tenant.id,
          tenant.id,
          { start: periodStart, end: periodEnd },
        );

        // Calculate site snapshots (if sites exist)
        // This would require integration with warehouse/site system
        // For now, we'll just calculate company-level

        console.log(`Pulse: Calculated snapshots for tenant ${tenant.id}`);
      } catch (error) {
        console.error(
          `Pulse: Error calculating snapshots for tenant ${tenant.id}:`,
          error,
        );
      }
    }

    console.log(`Pulse: ${period} score snapshot calculation complete`);
  } catch (error) {
    console.error(
      `Pulse: Error in ${period} score snapshot calculation job:`,
      error,
    );
    throw error;
  }
}

/**
 * Aggregate benchmark metrics and update index
 * Should run monthly
 */
export async function aggregateBenchmarkMetricsJob() {
  try {
    console.log("Pulse: Starting benchmark metric aggregation job");

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get all benchmark submissions for last month
    const submissions = await prisma.pulseTenantBenchmarkSubmission.findMany({
      where: {
        periodStart: { gte: monthStart, lte: monthEnd },
      },
      distinct: ["benchmarkGroup"],
    });

    const benchmarkGroups = Array.from(
      new Set(submissions.map((s: any) => s.benchmarkGroup)),
    );

    for (const group of benchmarkGroups) {
      try {
        // Update benchmark index for each metric
        const metrics = [
          "SAFE_PARTICIPATION",
          "EXECUTE_ONTIME",
          "TRAINING_FRESHNESS",
          "ENGAGEMENT_PARTICIPATION",
        ];

        for (const metric of metrics) {
          await pulseBenchmarkService.updateBenchmarkIndex(
            group,
            { start: monthStart, end: monthEnd },
            metric,
          );
        }

        console.log(`Pulse: Updated benchmark index for group ${group}`);
      } catch (error) {
        console.error(
          `Pulse: Error updating benchmark index for group ${group}:`,
          error,
        );
      }
    }

    console.log("Pulse: Benchmark metric aggregation complete");
  } catch (error) {
    console.error("Pulse: Error in benchmark metric aggregation job:", error);
    throw error;
  }
}

/**
 * Submit tenant metrics for benchmarking
 * Should run monthly for each tenant
 */
export async function submitTenantBenchmarkMetricsJob() {
  try {
    console.log("Pulse: Starting tenant benchmark submission job");

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get all tenants
    // Note: Tenant model may not exist - use fallback
    let tenants: Array<{ id: string }> = [];
    try {
      tenants =
        (await (prisma as any).tenant?.findMany({
          select: { id: true },
        })) || [];
    } catch (error) {
      console.warn("Pulse: Tenant model not found, using default tenant");
      tenants = [{ id: "default" }];
    }

    for (const tenant of tenants) {
      try {
        // Determine benchmark group (industry, region, size)
        // This would come from tenant configuration
        const benchmarkGroup = "industry=logistics,region=GCC,size=ENT"; // Default

        // Submit metrics
        await pulseBenchmarkService.submitMetrics(
          tenant.id,
          { start: monthStart, end: monthEnd },
          benchmarkGroup,
          false, // optInPublicLeague - should come from tenant settings
        );

        console.log(
          `Pulse: Submitted benchmark metrics for tenant ${tenant.id}`,
        );
      } catch (error) {
        console.error(
          `Pulse: Error submitting metrics for tenant ${tenant.id}:`,
          error,
        );
      }
    }

    console.log("Pulse: Tenant benchmark submission complete");
  } catch (error) {
    console.error("Pulse: Error in tenant benchmark submission job:", error);
    throw error;
  }
}

// Export job scheduler configuration
export const pulseJobs = {
  daily: {
    generateMissions: {
      schedule: "0 0 * * *", // Daily at midnight
      handler: generateDailyMissionsJob,
    },
    calculateSnapshots: {
      schedule: "0 1 * * *", // Daily at 1 AM
      handler: () => calculateScoreSnapshotsJob("daily"),
    },
  },
  weekly: {
    evaluateBossBattles: {
      schedule: "0 0 * * 0", // Weekly on Sunday at midnight
      handler: evaluateWeeklyBossBattlesJob,
    },
    calculateSnapshots: {
      schedule: "0 2 * * 0", // Weekly on Sunday at 2 AM
      handler: () => calculateScoreSnapshotsJob("weekly"),
    },
  },
  monthly: {
    aggregateBenchmarks: {
      schedule: "0 3 1 * *", // Monthly on 1st at 3 AM
      handler: aggregateBenchmarkMetricsJob,
    },
    submitTenantMetrics: {
      schedule: "0 4 1 * *", // Monthly on 1st at 4 AM
      handler: submitTenantBenchmarkMetricsJob,
    },
  },
};
