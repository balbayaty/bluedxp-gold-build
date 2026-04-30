/**
 * API Route: Get Exchange Rate
 * GET /api/market-data/exchange-rate?from=USD&to=EUR
 */

import { NextRequest, NextResponse } from 'next/server';
import { marketDataService } from '@/lib/services/market-data/marketDataService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (!from || !to) {
      return NextResponse.json(
        { error: 'Missing required parameters: from, to' },
        { status: 400 }
      );
    }

    const response = await marketDataService.getExchangeRate(
      from.toUpperCase(),
      to.toUpperCase()
    );

    if (!response) {
      return NextResponse.json(
        { error: 'Exchange rate not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in exchange-rate API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exchange rate', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;
