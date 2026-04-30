/**
 * API Route: Get Logistics Companies Stock Data
 * GET /api/market-data/logistics
 * 
 * Returns stock data for major logistics companies (FedEx, UPS, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { marketDataService } from '@/lib/services/market-data/marketDataService';

export async function GET(request: NextRequest) {
  try {
    const response = await marketDataService.getLogisticsCompaniesData();

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in logistics API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logistics data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;
