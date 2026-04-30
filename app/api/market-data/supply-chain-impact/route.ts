/**
 * API Route: Analyze Supply Chain Impact
 * GET /api/market-data/supply-chain-impact?symbol=FDX
 */

import { NextRequest, NextResponse } from 'next/server';
import { marketDataService } from '@/lib/services/market-data/marketDataService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json(
        { error: 'Missing required parameter: symbol' },
        { status: 400 }
      );
    }

    const response = await marketDataService.analyzeSupplyChainImpact(symbol.toUpperCase());

    if (!response) {
      return NextResponse.json(
        { error: 'Unable to analyze supply chain impact' },
        { status: 404 }
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in supply-chain-impact API:', error);
    return NextResponse.json(
      { error: 'Failed to analyze supply chain impact', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;
