/**
 * API Route: Get Cryptocurrency Prices
 * GET /api/market-data/crypto?coins=bitcoin,ethereum
 * 
 * Uses CoinGecko API - 100% FREE, NO API KEY REQUIRED!
 */

import { NextRequest, NextResponse } from 'next/server';
import { cryptoService } from '@/lib/services/market-data/cryptoService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const coinsParam = searchParams.get('coins');

    const coins = coinsParam 
      ? coinsParam.split(',').map(c => c.trim().toLowerCase())
      : ['bitcoin', 'ethereum', 'ripple', 'cardano', 'polkadot'];

    const prices = await cryptoService.getCryptoPrices(coins);

    return NextResponse.json(prices);
  } catch (error) {
    console.error('Error in crypto API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch crypto prices', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;
