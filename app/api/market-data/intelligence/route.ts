/**
 * API Route: Intelligent Market Analytics
 * GET /api/market-data/intelligence
 * 
 * Returns AI-powered insights learned from YOUR data
 */

import { NextRequest, NextResponse } from 'next/server';
import { intelligentMarketAnalytics } from '@/lib/services/market-data/intelligentMarketAnalytics';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get('tenantId') || undefined;

    const [correlations, alerts, timing] = await Promise.all([
      intelligentMarketAnalytics.discoverHiddenCorrelations(tenantId),
      intelligentMarketAnalytics.generatePredictiveAlerts(tenantId),
      intelligentMarketAnalytics.getOptimalActionTiming(),
    ]);

    return NextResponse.json({
      correlations,
      alerts,
      timing,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in intelligence API:', error);
    return NextResponse.json(
      { error: 'Failed to generate intelligence', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;
