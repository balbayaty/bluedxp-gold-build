/**
 * API Route: Get Commodity Prices
 * GET /api/market-data/commodities?symbols=CL=F,GC=F
 */

import { NextRequest, NextResponse } from 'next/server';
import { marketDataService } from '@/lib/services/market-data/marketDataService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbolsParam = searchParams.get('symbols');

    if (!symbolsParam) {
      // Default to common commodities
      const defaultCommodities = ['CL=F', 'BZ=F', 'NG=F', 'GC=F', 'SI=F'];
      const response = await marketDataService.getCommodityPrices(defaultCommodities);
      return NextResponse.json(response);
    }

    const commodities = symbolsParam.split(',').map(s => s.trim().toUpperCase());
    const response = await marketDataService.getCommodityPrices(commodities);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in commodities API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch commodity prices', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;
