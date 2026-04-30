/**
 * GCC Compliance Dashboard API Route
 *
 * Provides aggregated dashboard data for the GCC Compliance module
 */

import { NextRequest, NextResponse } from 'next/server';
import { TRUCK_BAN_SCHEDULES } from '@/lib/services/gcc-compliance';

interface ValidationMetric {
  total: number;
  passed: number;
  failed: number;
  warnings: number;
  lastUpdated: string;
}

interface BillingMetric {
  currentMonth: {
    totalCalls: number;
    successfulCalls: number;
    estimatedCost: number;
    dataPoints: number;
  };
  trend: 'up' | 'down' | 'stable';
  percentChange: number;
}

interface DashboardData {
  validations: ValidationMetric;
  billing: BillingMetric;
  truckBans: Array<{
    city: string;
    isRestricted: boolean;
    nextWindow: string | null;
    duration: string;
  }>;
  activeShipments: number;
  complianceScore: number;
}

// In-memory storage for demo - in production use Redis/Database
const dashboardMetrics: DashboardData = {
  validations: {
    total: 1247,
    passed: 1156,
    failed: 24,
    warnings: 67,
    lastUpdated: new Date().toISOString(),
  },
  billing: {
    currentMonth: {
      totalCalls: 12847,
      successfulCalls: 12798,
      estimatedCost: 256.94,
      dataPoints: 38541,
    },
    trend: 'up',
    percentChange: 12.5,
  },
  truckBans: [],
  activeShipments: 47,
  complianceScore: 94.7,
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const section = searchParams.get('section');

    // Calculate current truck ban status
    const now = new Date();
    const currentHour = now.getHours();
    
    const truckBanStatuses = TRUCK_BAN_SCHEDULES.slice(0, 5).map((schedule) => {
      const startHour = parseInt(schedule.startTime?.split(':')[0] || '6');
      const endHour = parseInt(schedule.endTime?.split(':')[0] || '22');
      const isRestricted = currentHour >= startHour && currentHour < endHour;
      
      let nextWindow = null;
      if (isRestricted) {
        const nextDate = new Date(now);
        nextDate.setHours(endHour, 0, 0, 0);
        nextWindow = nextDate.toISOString();
      } else if (currentHour < startHour) {
        const nextDate = new Date(now);
        nextDate.setHours(startHour, 0, 0, 0);
        nextWindow = nextDate.toISOString();
      }
      
      return {
        city: schedule.city,
        isRestricted,
        nextWindow,
        duration: `${schedule.startTime || '06:00'} - ${schedule.endTime || '22:00'}`,
      };
    });

    dashboardMetrics.truckBans = truckBanStatuses;
    dashboardMetrics.validations.lastUpdated = new Date().toISOString();

    // Return specific section or full dashboard
    if (section) {
      switch (section) {
        case 'validations':
          return NextResponse.json({ success: true, data: dashboardMetrics.validations });
        case 'billing':
          return NextResponse.json({ success: true, data: dashboardMetrics.billing });
        case 'truckBans':
          return NextResponse.json({ success: true, data: truckBanStatuses });
        case 'score':
          return NextResponse.json({ success: true, data: { score: dashboardMetrics.complianceScore } });
        default:
          return NextResponse.json({ success: false, error: 'Invalid section' }, { status: 400 });
      }
    }

    return NextResponse.json({
      success: true,
      data: dashboardMetrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Dashboard API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'updateValidation':
        if (data.result === 'passed') {
          dashboardMetrics.validations.passed++;
        } else if (data.result === 'failed') {
          dashboardMetrics.validations.failed++;
        } else if (data.result === 'warning') {
          dashboardMetrics.validations.warnings++;
        }
        dashboardMetrics.validations.total++;
        dashboardMetrics.validations.lastUpdated = new Date().toISOString();
        
        // Recalculate compliance score
        dashboardMetrics.complianceScore = 
          (dashboardMetrics.validations.passed / dashboardMetrics.validations.total) * 100;
        break;

      case 'updateBilling':
        dashboardMetrics.billing.currentMonth.totalCalls += data.calls || 1;
        if (data.success !== false) {
          dashboardMetrics.billing.currentMonth.successfulCalls += data.calls || 1;
        }
        dashboardMetrics.billing.currentMonth.dataPoints += data.dataPoints || 0;
        break;

      case 'reset':
        // Reset for testing
        dashboardMetrics.validations = {
          total: 0,
          passed: 0,
          failed: 0,
          warnings: 0,
          lastUpdated: new Date().toISOString(),
        };
        dashboardMetrics.billing.currentMonth = {
          totalCalls: 0,
          successfulCalls: 0,
          estimatedCost: 0,
          dataPoints: 0,
        };
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: dashboardMetrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Dashboard API] POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to update dashboard', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
