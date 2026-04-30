/**
 * API Route: Get Logistics Performance Index (LPI) Data
 * GET /api/market-data/lpi?countries=SAU,ARE,KWT,QAT
 */

import { NextRequest, NextResponse } from 'next/server';
import { worldBankIntegration } from '@/lib/services/market-data/worldBankIntegration';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const countriesParam = searchParams.get('countries');

    const countries = countriesParam 
      ? countriesParam.split(',').map(c => c.trim().toUpperCase())
      : ['USA', 'SAU', 'ARE', 'KWT', 'QAT', 'BHR'];

    const lpiData = await worldBankIntegration.getLPIData(countries);

    return NextResponse.json(lpiData);
  } catch (error) {
    console.error('Error in LPI API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch LPI data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;
