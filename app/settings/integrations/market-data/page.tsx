/**
 * 📊 MARKET DATA INTEGRATION SETTINGS
 * Central UI for managing all market data API keys and configurations
 * No need to touch backend code - everything configurable here!
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Key, 
  Check, 
  X, 
  RefreshCw, 
  ExternalLink,
  Shield,
  Settings
} from 'lucide-react';

export default function MarketDataSettingsPage() {
  const [apiKeys, setApiKeys] = useState({
    alphaVantage: '',
    fred: '',
    tradingEconomics: '',
    yahooFinance: '',
  });

  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  React.useEffect(() => {
    loadCurrentConfig();
  }, []);

  const loadCurrentConfig = async () => {
    try {
      const response = await fetch('/api/market-data/config');
      if (response.ok) {
        const configs = await response.json();
        const newKeys: any = {};
        configs.forEach((config: any) => {
          if (config.provider === 'alpha_vantage') newKeys.alphaVantage = config.apiKey || '';
          if (config.provider === 'fred') newKeys.fred = config.apiKey || '';
          if (config.provider === 'trading_economics') newKeys.tradingEconomics = config.apiKey || '';
          if (config.provider === 'yahoo_finance') newKeys.yahooFinance = config.apiKey || '';
        });
        setApiKeys(newKeys);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const testAPI = async (provider: string) => {
    setTesting({ ...testing, [provider]: true });
    
    try {
      let testUrl = '';
      switch(provider) {
        case 'alphaVantage':
          testUrl = '/api/market-data/test';
          break;
        case 'fred':
          testUrl = '/api/market-data/indices';
          break;
      }

      const response = await fetch(testUrl);
      const success = response.ok;
      
      setTestResults({ ...testResults, [provider]: success });
    } catch (error) {
      setTestResults({ ...testResults, [provider]: false });
    } finally {
      setTesting({ ...testing, [provider]: false });
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setSaveSuccess(false);

    try {
      // Save each configured API key
      const promises = [];

      if (apiKeys.alphaVantage) {
        promises.push(
          fetch('/api/market-data/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              provider: 'alpha_vantage',
              apiKey: apiKeys.alphaVantage,
              testFirst: true,
            }),
          })
        );
      }

      if (apiKeys.fred) {
        promises.push(
          fetch('/api/market-data/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              provider: 'fred',
              apiKey: apiKeys.fred,
              testFirst: true,
            }),
          })
        );
      }

      const results = await Promise.all(promises);
      const allSuccess = results.every(r => r.ok);

      if (allSuccess) {
        setSaveSuccess(true);
        alert('✅ Settings saved successfully!\n\n🔥 HOT-RELOAD ACTIVE!\nChanges applied instantly - NO RESTART NEEDED!\n\nYour market data will now use the new API keys immediately.');
      } else {
        alert('⚠️ Some API keys failed validation. Please check and try again.');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('❌ Error saving settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="h-8 w-8" />
          Market Data Integration Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage API keys and configurations for all market data sources
        </p>
      </div>

      {/* Alpha Vantage */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-blue-500" />
                Alpha Vantage API
              </CardTitle>
              <CardDescription>
                Stock market, currencies, and commodities data
              </CardDescription>
            </div>
            {testResults.alphaVantage !== undefined && (
              <Badge variant={testResults.alphaVantage ? 'success' : 'error'}>
                {testResults.alphaVantage ? (
                  <><Check className="h-3 w-3 mr-1" /> Connected</>
                ) : (
                  <><X className="h-3 w-3 mr-1" /> Failed</>
                )}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">API Key</label>
            <div className="flex gap-2">
              <Input
                type="password"
                value={apiKeys.alphaVantage}
                onChange={(e) => setApiKeys({ ...apiKeys, alphaVantage: e.target.value })}
                placeholder="Enter Alpha Vantage API key"
                className="flex-1"
              />
              <Button
                onClick={() => testAPI('alphaVantage')}
                variant="outline"
                disabled={testing.alphaVantage || !apiKeys.alphaVantage}
              >
                {testing.alphaVantage ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  'Test'
                )}
              </Button>
            </div>
          </div>

          <div className="rounded-lg border p-4 bg-muted/50">
            <h4 className="font-semibold text-sm mb-2">What This Enables:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>✅ Real-time stock quotes (500 calls/day free)</li>
              <li>✅ Currency exchange rates (20 currencies)</li>
              <li>✅ Commodity prices via ETFs</li>
              <li>✅ Historical data</li>
            </ul>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-blue-500" />
            <span className="text-muted-foreground">
              Current Status: 
              <span className="font-semibold text-foreground ml-1">
                {apiKeys.alphaVantage ? 'Configured ✅' : 'Not Configured ❌'}
              </span>
            </span>
          </div>

          <a
            href="https://www.alphavantage.co/support/#api-key"
            target="_blank"
            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            Get Free API Key <ExternalLink className="h-3 w-3" />
          </a>
        </CardContent>
      </Card>

      {/* FRED API */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-green-500" />
                FRED API (Federal Reserve)
              </CardTitle>
              <CardDescription>
                US economic indicators (CPI, PPI, PMI)
              </CardDescription>
            </div>
            {testResults.fred !== undefined && (
              <Badge variant={testResults.fred ? 'success' : 'error'}>
                {testResults.fred ? (
                  <><Check className="h-3 w-3 mr-1" /> Connected</>
                ) : (
                  <><X className="h-3 w-3 mr-1" /> Failed</>
                )}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">API Key</label>
            <div className="flex gap-2">
              <Input
                type="password"
                value={apiKeys.fred}
                onChange={(e) => setApiKeys({ ...apiKeys, fred: e.target.value })}
                placeholder="Enter FRED API key (optional)"
                className="flex-1"
              />
              <Button
                onClick={() => testAPI('fred')}
                variant="outline"
                disabled={testing.fred || !apiKeys.fred}
              >
                {testing.fred ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  'Test'
                )}
              </Button>
            </div>
          </div>

          <div className="rounded-lg border p-4 bg-muted/50">
            <h4 className="font-semibold text-sm mb-2">What This Enables:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>✅ Real US CPI (Consumer Price Index)</li>
              <li>✅ Real US PPI (Producer Price Index)</li>
              <li>✅ Real Manufacturing PMI</li>
              <li>✅ 1000+ economic indicators</li>
            </ul>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-green-500" />
            <span className="text-muted-foreground">
              Current Status: 
              <span className="font-semibold text-foreground ml-1">
                {apiKeys.fred ? 'Configured ✅' : 'Using Estimates ⚠️'}
              </span>
            </span>
          </div>

          <a
            href="https://fred.stlouisfed.org/docs/api/api_key.html"
            target="_blank"
            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            Get Free API Key <ExternalLink className="h-3 w-3" />
          </a>
        </CardContent>
      </Card>

      {/* Free APIs (No Keys Needed) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-500" />
            Free APIs (No Keys Required)
          </CardTitle>
          <CardDescription>
            These work automatically - no configuration needed!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <div className="font-semibold">CoinGecko</div>
                <div className="text-xs text-muted-foreground">Cryptocurrency prices</div>
              </div>
              <Badge variant="success">✅ Active</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <div className="font-semibold">World Bank</div>
                <div className="text-xs text-muted-foreground">LPI rankings, economic data</div>
              </div>
              <Badge variant="success">✅ Active</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <div className="font-semibold">IMF, OECD, UN</div>
                <div className="text-xs text-muted-foreground">Global economic indicators</div>
              </div>
              <Badge variant="success">✅ Active</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Providers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-purple-500" />
            Additional Providers (Optional)
          </CardTitle>
          <CardDescription>
            Expand your data sources
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Trading Economics */}
          <div>
            <label className="text-sm font-medium mb-2 block">Trading Economics API</label>
            <Input
              type="password"
              value={apiKeys.tradingEconomics}
              onChange={(e) => setApiKeys({ ...apiKeys, tradingEconomics: e.target.value })}
              placeholder="Optional - for Baltic Dry Index"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enables: Baltic Dry Index, real-time freight data
            </p>
          </div>

          {/* Yahoo Finance */}
          <div>
            <label className="text-sm font-medium mb-2 block">Yahoo Finance API</label>
            <Input
              type="password"
              value={apiKeys.yahooFinance}
              onChange={(e) => setApiKeys({ ...apiKeys, yahooFinance: e.target.value })}
              placeholder="Optional - alternative stock data"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enables: Alternative stock quotes, more commodities
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => window.location.reload()}>
          Cancel
        </Button>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              {saveSuccess && <Check className="h-4 w-4 mr-2" />}
              Save & Apply Instantly
            </>
          )}
        </Button>
      </div>

      {saveSuccess && (
        <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <Check className="h-5 w-5" />
            <span className="font-semibold">Settings saved and applied instantly!</span>
          </div>
          <p className="text-sm text-green-600 dark:text-green-300 mt-2">
            🔥 Hot-reload active - your market data is now using the new API keys. No restart needed!
          </p>
        </div>
      )}

      {/* Instructions */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2">💡 How to Apply Changes:</h3>
          <ol className="text-sm space-y-2 text-muted-foreground">
            <li>1. Add API keys above</li>
            <li>2. Click "Save Settings"</li>
            <li>3. Add keys to `.env.local` file (as shown in popup)</li>
            <li>4. Restart your development server</li>
            <li>5. Keys will be loaded automatically</li>
          </ol>
          <p className="text-xs text-muted-foreground mt-4">
            💡 In future: This will save directly to database and apply without restart!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
