/**
 * API Route: Get Saudi Arabia Comprehensive Data
 * GET /api/market-data/saudi-arabia
 * 
 * Returns: Economic indicators, Tadawul stocks, Vision 2030 metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { saudiArabiaDataService } from '@/lib/services/market-data/saudiArabiaDataService';

export async function GET(request: NextRequest) {
  try {
    const [indicators, stocks, vision2030, trade] = await Promise.all([
      saudiArabiaDataService.getSaudiEconomicIndicators(),
      saudiArabiaDataService.getTadawulStocks(),
      saudiArabiaDataService.getVision2030Metrics(),
      saudiArabiaDataService.getSaudiTradeData(),
    ]);

    return NextResponse.json({
      indicators,
      stocks,
      vision2030,
      trade,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in Saudi Arabia API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Saudi Arabia data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;
