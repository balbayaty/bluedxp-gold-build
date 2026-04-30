/**
 * API Route: Market Data Configuration Management
 * POST /api/market-data/config - Save API configuration (hot-reload!)
 * GET /api/market-data/config - Get all configurations
 * DELETE /api/market-data/config - Delete configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiConfigService } from '@/lib/services/market-data/apiConfigService';

export async function GET(request: NextRequest) {
  try {
    const configurations = await apiConfigService.getAllConfigurations();

    // Don't expose full API keys in response
    const safeConfigs = configurations.map(config => ({
      ...config,
      apiKey: config.apiKey ? `${config.apiKey.substring(0, 4)}...${config.apiKey.substring(config.apiKey.length - 4)}` : undefined,
    }));

    return NextResponse.json(safeConfigs);
  } catch (error) {
    console.error('Error getting configurations:', error);
    return NextResponse.json(
      { error: 'Failed to get configurations', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, apiKey, testFirst } = body;

    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: 'Missing required fields: provider, apiKey' },
        { status: 400 }
      );
    }

    // Test API first if requested
    if (testFirst) {
      const testResult = await apiConfigService.testConnection(provider, apiKey);
      if (!testResult) {
        return NextResponse.json(
          { error: 'API test failed', message: 'The provided API key does not work' },
          { status: 400 }
        );
      }
    }

    // Save configuration
    const config = await apiConfigService.saveConfiguration(provider, apiKey);

    return NextResponse.json({
      success: true,
      message: 'Configuration saved successfully! Changes applied instantly (no restart needed).',
      config: {
        ...config,
        apiKey: `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`,
      },
    });
  } catch (error) {
    console.error('Error saving configuration:', error);
    return NextResponse.json(
      { error: 'Failed to save configuration', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const provider = searchParams.get('provider');

    if (!provider) {
      return NextResponse.json(
        { error: 'Missing required parameter: provider' },
        { status: 400 }
      );
    }

    await apiConfigService.deleteConfiguration(provider);

    return NextResponse.json({
      success: true,
      message: 'Configuration deleted successfully!',
    });
  } catch (error) {
    console.error('Error deleting configuration:', error);
    return NextResponse.json(
      { error: 'Failed to delete configuration', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;
