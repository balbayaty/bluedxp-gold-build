/**
 * API Route: Get Stock Quotes
 * GET /api/market-data/quotes?symbols=FDX,UPS,CHRW&includeProfile=true
 */

import { NextRequest, NextResponse } from 'next/server';
import { marketDataService } from '@/lib/services/market-data/marketDataService';
import type { GetQuoteRequest } from '@/types/market-data';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbolsParam = searchParams.get('symbols');
    const includeProfile = searchParams.get('includeProfile') === 'true';

    if (!symbolsParam) {
      return NextResponse.json(
        { error: 'Missing required parameter: symbols' },
        { status: 400 }
      );
    }

    const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase());

    const quoteRequest: GetQuoteRequest = {
      symbols,
      includeProfile,
    };

    const response = await marketDataService.getQuotes(quoteRequest);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in quotes API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotes', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;
