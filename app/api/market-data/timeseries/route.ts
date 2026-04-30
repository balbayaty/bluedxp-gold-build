/**
 * API Route: Get Time Series Data
 * GET /api/market-data/timeseries?symbol=FDX&interval=daily
 */

import { NextRequest, NextResponse } from 'next/server';
import { marketDataService } from '@/lib/services/market-data/marketDataService';
import type { GetTimeSeriesRequest } from '@/types/market-data';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');
    const interval = searchParams.get('interval') || 'daily';
    const outputSize = searchParams.get('outputSize') as 'compact' | 'full' | null;

    if (!symbol) {
      return NextResponse.json(
        { error: 'Missing required parameter: symbol' },
        { status: 400 }
      );
    }

    const validIntervals = ['1min', '5min', '15min', '30min', '60min', 'daily', 'weekly', 'monthly'];
    if (!validIntervals.includes(interval)) {
      return NextResponse.json(
        { error: `Invalid interval. Must be one of: ${validIntervals.join(', ')}` },
        { status: 400 }
      );
    }

    const timeSeriesRequest: GetTimeSeriesRequest = {
      symbol: symbol.toUpperCase(),
      interval: interval as any,
      outputSize: outputSize || undefined,
    };

    const response = await marketDataService.getTimeSeries(timeSeriesRequest);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in timeseries API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch time series data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;
