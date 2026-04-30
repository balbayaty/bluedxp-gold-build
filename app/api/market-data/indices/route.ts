/**
 * API Route: Get Real-Time Market Indices
 * GET /api/market-data/indices
 * 
 * Returns: Baltic Dry Index, CPI, PPI, PMI, and freight indices
 * Sources: FRED API (free), World Bank (free), realistic estimates
 */

import { NextRequest, NextResponse } from 'next/server';
import { realTimeIndicesService } from '@/lib/services/market-data/realTimeIndicesService';

export async function GET(request: NextRequest) {
  try {
    const indices = await realTimeIndicesService.getAllIndices();

    return NextResponse.json(indices);
  } catch (error) {
    console.error('Error in indices API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch indices', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;
