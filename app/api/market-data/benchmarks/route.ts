/**
 * API Route: Get Real Supply Chain Benchmarks
 * GET /api/market-data/benchmarks?tenantId=xxx
 * 
 * Pulls real performance data from WMS, TMS databases
 */

import { NextRequest, NextResponse } from 'next/server';
import { realBenchmarksService } from '@/lib/services/market-data/realBenchmarksService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get('tenantId') || undefined;

    const benchmarks = await realBenchmarksService.getRealBenchmarks(tenantId);

    return NextResponse.json(benchmarks);
  } catch (error) {
    console.error('Error in benchmarks API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch benchmarks', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;
