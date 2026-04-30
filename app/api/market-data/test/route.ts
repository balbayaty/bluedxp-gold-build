/**
 * API Route: Test Market Data API
 * GET /api/market-data/test
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY || process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;
  
  return NextResponse.json({
    status: 'OK',
    message: 'Market Data API is working!',
    apiKeyConfigured: !!apiKey,
    apiKeyPreview: apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : 'Not configured',
    timestamp: new Date().toISOString(),
  });
}

export const dynamic = 'force-dynamic';
