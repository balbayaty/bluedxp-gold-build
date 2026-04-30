/**
 * API Route: Get Cross-Module Market Impact Analysis
 * GET /api/market-data/cross-module-impact
 */

import { NextRequest, NextResponse } from 'next/server';
import { crossModuleIntegration } from '@/lib/services/market-data/crossModuleIntegration';

export async function GET(request: NextRequest) {
  try {
    const dashboard = await crossModuleIntegration.getConsolidatedImpactDashboard();

    return NextResponse.json(dashboard);
  } catch (error) {
    console.error('Error in cross-module impact API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cross-module impact data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;
