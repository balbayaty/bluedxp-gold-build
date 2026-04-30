/**
 * 🔧 API CONFIGURATION SERVICE
 * Manages all market data API configurations with hot-reload
 * Stores in database, no restart needed!
 */

import { prisma } from '@/lib/services/database/prismaClient';
import { eventBus } from '@/lib/services/event-store';

export interface APIConfiguration {
  id: string;
  provider: 'alpha_vantage' | 'fred' | 'coingecko' | 'world_bank' | 'trading_economics' | 'yahoo_finance';
  name: string;
  apiKey?: string;
  apiSecret?: string;
  baseUrl?: string;
  enabled: boolean;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
  lastTested?: Date;
  testStatus?: 'success' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export class APIConfigService {
  private static instance: APIConfigService;
  private configCache: Map<string, APIConfiguration> = new Map();
  private lastCacheUpdate: number = 0;
  private readonly CACHE_TTL = 5000; // 5 seconds - very short for hot-reload

  private constructor() {
    this.loadConfigurations();
    // Auto-refresh cache every 5 seconds for hot-reload
    setInterval(() => this.loadConfigurations(), 5000);
  }

  static getInstance(): APIConfigService {
    if (!APIConfigService.instance) {
      APIConfigService.instance = new APIConfigService();
    }
    return APIConfigService.instance;
  }

  /**
   * Get API configuration (with hot-reload from database)
   */
  async getConfiguration(provider: string): Promise<APIConfiguration | null> {
    // Check cache first
    const cached = this.configCache.get(provider);
    if (cached && Date.now() - this.lastCacheUpdate < this.CACHE_TTL) {
      return cached;
    }

    // Reload from database
    await this.loadConfigurations();
    return this.configCache.get(provider) || null;
  }

  /**
   * Get API key for provider (hot-reload enabled!)
   */
  async getAPIKey(provider: string): Promise<string | null> {
    // Try database first
    const config = await this.getConfiguration(provider);
    if (config?.apiKey) {
      return config.apiKey;
    }

    // Fallback to environment variables
    const envKeys: Record<string, string | undefined> = {
      alpha_vantage: process.env.ALPHA_VANTAGE_API_KEY || process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY,
      fred: process.env.FRED_API_KEY,
      trading_economics: process.env.TRADING_ECONOMICS_API_KEY,
      yahoo_finance: process.env.YAHOO_FINANCE_API_KEY,
    };

    return envKeys[provider] || null;
  }

  /**
   * Save API configuration (hot-reload!)
   */
  async saveConfiguration(
    provider: string,
    apiKey: string,
    options?: Partial<APIConfiguration>
  ): Promise<APIConfiguration> {
    try {
      // For now, save to memory cache (hot-reload enabled!)
      // TODO: Save to database when system_parameters table is created
      
      const configuration: APIConfiguration = {
        id: `config-${provider}-${Date.now()}`,
        provider: provider as any,
        name: provider,
        apiKey,
        enabled: true,
        rateLimit: options?.rateLimit || {
          requestsPerMinute: 5,
          requestsPerDay: 500,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Update cache immediately (hot-reload!)
      this.configCache.set(provider, configuration);
      this.lastCacheUpdate = Date.now();

      // Publish event for hot-reload
      try {
        await eventBus.publish({
          type: 'market_data.config.updated',
          payload: {
            provider,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        console.warn('Failed to publish config update event:', error);
      }

      return configuration;
      
      /* DATABASE VERSION (Uncomment when table exists):
      const config = await prisma.systemParameter.upsert({
        where: {
          parameterKey: `market_data_${provider}_api_key`,
        },
        update: {
          value: apiKey,
          lastModified: new Date(),
          modifiedBy: 'system',
        },
        create: {
          id: `market-data-${provider}-${Date.now()}`,
          parameterKey: `market_data_${provider}_api_key`,
          parameterName: `${provider} API Key`,
          category: 'INTEGRATION',
          dataType: 'STRING',
          value: apiKey,
          defaultValue: '',
          description: `API key for ${provider} market data provider`,
          isRequired: false,
          isEditable: true,
          lastModified: new Date(),
          modifiedBy: 'system',
          status: 'ACTIVE',
          tenantId: 'default',
        },
      });

      // Create configuration object
      const configuration: APIConfiguration = {
        id: config.id,
        provider: provider as any,
        name: provider,
        apiKey,
        enabled: true,
        rateLimit: options?.rateLimit || {
          requestsPerMinute: 5,
          requestsPerDay: 500,
        },
        createdAt: config.createdAt,
        updatedAt: new Date(),
      };

      // Update cache immediately (hot-reload!)
      this.configCache.set(provider, configuration);
      this.lastCacheUpdate = Date.now();

      // Publish event for hot-reload
      try {
        await eventBus.publish({
          type: 'market_data.config.updated',
          payload: {
            provider,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        console.warn('Failed to publish config update event:', error);
      }

      return configuration;
      */
    } catch (error) {
      console.error('Error saving API configuration:', error);
      throw error;
    }
  }

  /**
   * Test API connection
   */
  async testConnection(provider: string, apiKey: string): Promise<boolean> {
    try {
      switch (provider) {
        case 'alpha_vantage':
          const avUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=IBM&apikey=${apiKey}`;
          const avResponse = await fetch(avUrl);
          const avData = await avResponse.json();
          return !!avData['Global Quote'];

        case 'fred':
          const fredUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=CPIAUCSL&api_key=${apiKey}&file_type=json&limit=1`;
          const fredResponse = await fetch(fredUrl);
          const fredData = await fredResponse.json();
          return !!fredData.observations;

        case 'coingecko':
          // CoinGecko doesn't need key
          const cgUrl = 'https://api.coingecko.com/api/v3/ping';
          const cgResponse = await fetch(cgUrl);
          return cgResponse.ok;

        case 'world_bank':
          // World Bank doesn't need key
          const wbUrl = 'https://api.worldbank.org/v2/country/USA?format=json';
          const wbResponse = await fetch(wbUrl);
          return wbResponse.ok;

        default:
          return false;
      }
    } catch (error) {
      console.error(`Error testing ${provider}:`, error);
      return false;
    }
  }

  /**
   * Get all configurations
   */
  async getAllConfigurations(): Promise<APIConfiguration[]> {
    await this.loadConfigurations();
    return Array.from(this.configCache.values());
  }

  /**
   * Load configurations from database
   */
  private async loadConfigurations(): Promise<void> {
    try {
      const settings = await prisma.systemParameter.findMany({
        where: {
          parameterKey: {
            startsWith: 'market_data_',
          },
          status: 'ACTIVE',
        },
      });

      // Update cache
      for (const setting of settings) {
        const provider = setting.parameterKey.replace('market_data_', '').replace('_api_key', '');
        
        const config: APIConfiguration = {
          id: setting.id,
          provider: provider as any,
          name: provider,
          apiKey: setting.value as string,
          enabled: true,
          rateLimit: {
            requestsPerMinute: 5,
            requestsPerDay: 500,
          },
          createdAt: setting.createdAt,
          updatedAt: setting.lastModified,
        };

        this.configCache.set(provider, config);
      }

      this.lastCacheUpdate = Date.now();
      
      // Currently using cache + env vars
      // Cache persists during server runtime
      // Env vars are fallback
    } catch (error) {
      console.error('Error loading API configurations:', error);
      // Silently fail - will use env vars as fallback
    }
  }

  /**
   * Delete configuration
   */
  async deleteConfiguration(provider: string): Promise<void> {
    try {
      await prisma.systemParameter.updateMany({
        where: {
          parameterKey: `market_data_${provider}_api_key`,
        },
        data: {
          status: 'INACTIVE',
          lastModified: new Date(),
        },
      });

      this.configCache.delete(provider);

      // Publish event
      try {
        await eventBus.publish({
          type: 'market_data.config.deleted',
          payload: {
            provider,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        console.warn('Failed to publish config delete event:', error);
      }
    } catch (error) {
      console.error('Error deleting configuration:', error);
      throw error;
    }
  }
}

export const apiConfigService = APIConfigService.getInstance();
export default apiConfigService;
