'use client';

/**
 * Map Settings Page
 * 
 * Configure map providers and API keys for different mapping services.
 * 
 * @module app/settings/maps
 */

import React, { useState, useEffect } from 'react';
import {
  Map,
  Key,
  ExternalLink,
  Check,
  X,
  Truck,
  Cloud,
  Car,
  Globe,
  Shield,
  Save,
  Trash2,
  Info,
  AlertCircle,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface MapApiConfig {
  id: string;
  name: string;
  envVar: string;
  description: string;
  apiKeyUrl: string;
  features: string[];
  category: 'maps' | 'traffic' | 'weather' | 'routing';
  freeQuota?: string;
  pricing?: string;
  truckingSupport?: boolean;
}

// ============================================================================
// API CONFIGURATIONS
// ============================================================================

const MAP_API_CONFIGS: MapApiConfig[] = [
  {
    id: 'google',
    name: 'Google Maps Platform',
    envVar: 'GOOGLE_MAPS_API_KEY',
    description: 'Google Maps, Directions, Places, Geocoding APIs',
    apiKeyUrl: 'https://console.cloud.google.com/google/maps-apis/credentials',
    features: ['Maps', 'Directions', 'Traffic', 'Street View', 'Places', 'Geocoding'],
    category: 'maps',
    freeQuota: '$200/month credit (~28,000 loads)',
    pricing: 'Pay-as-you-go after free tier',
    truckingSupport: true,
  },
  {
    id: 'here',
    name: 'HERE Maps',
    envVar: 'HERE_API_KEY',
    description: 'Specialized trucking maps with weight/height restrictions',
    apiKeyUrl: 'https://developer.here.com/sign-up',
    features: ['Truck Routing', 'Weight Limits', 'Height Clearances', 'Hazmat Routes', 'Real-time Traffic'],
    category: 'maps',
    freeQuota: '250,000 transactions/month',
    pricing: 'Pay-as-you-go after free tier',
    truckingSupport: true,
  },
  {
    id: 'mapbox',
    name: 'Mapbox',
    envVar: 'MAPBOX_ACCESS_TOKEN',
    description: 'Customizable maps with 3D terrain and navigation',
    apiKeyUrl: 'https://account.mapbox.com/access-tokens/',
    features: ['Custom Styles', '3D Buildings', 'Navigation SDK', 'Isochrones', 'Matrix API'],
    category: 'maps',
    freeQuota: '50,000 map loads/month',
    pricing: 'Pay-as-you-go after free tier',
    truckingSupport: true,
  },
  {
    id: 'tomtom',
    name: 'TomTom',
    envVar: 'TOMTOM_API_KEY',
    description: 'Real-time traffic and commercial vehicle routing',
    apiKeyUrl: 'https://developer.tomtom.com/user/register',
    features: ['Live Traffic', 'Truck Routing', 'ETA Calculations', 'Speed Cameras', 'Weather'],
    category: 'maps',
    freeQuota: '2,500 transactions/day',
    pricing: 'Contact for commercial',
    truckingSupport: true,
  },
  {
    id: 'stadia',
    name: 'Stadia Maps',
    envVar: 'STADIA_API_KEY',
    description: 'Modern styled maps with light/dark themes',
    apiKeyUrl: 'https://client.stadiamaps.com/signup/',
    features: ['Multiple Styles', 'Fast CDN', 'No Watermarks'],
    category: 'maps',
    freeQuota: '200,000 tiles/month',
    pricing: 'Pay-as-you-go after free tier',
  },
  {
    id: 'thunderforest',
    name: 'Thunderforest',
    envVar: 'THUNDERFOREST_API_KEY',
    description: 'Transport-focused maps showing railways, airports, roads',
    apiKeyUrl: 'https://www.thunderforest.com/pricing/',
    features: ['Transport Layer', 'Outdoors', 'Cycle', 'Landscape'],
    category: 'maps',
    freeQuota: '150,000 tiles/month',
    pricing: 'From $10/month',
    truckingSupport: true,
  },
  {
    id: 'openweather',
    name: 'OpenWeatherMap',
    envVar: 'OPENWEATHER_API_KEY',
    description: 'Weather overlays for maps (clouds, precipitation, wind)',
    apiKeyUrl: 'https://home.openweathermap.org/api_keys',
    features: ['Weather Tiles', 'Forecasts', 'Alerts', 'Historical Data'],
    category: 'weather',
    freeQuota: '1,000 calls/day',
    pricing: 'From $40/month',
  },
  {
    id: 'openrouteservice',
    name: 'OpenRouteService',
    envVar: 'OPENROUTESERVICE_API_KEY',
    description: 'Free routing with HGV (truck) profiles',
    apiKeyUrl: 'https://openrouteservice.org/dev/#/signup',
    features: ['Truck Routing', 'Isochrones', 'Matrix', 'Geocoding'],
    category: 'routing',
    freeQuota: '2,000 requests/day',
    pricing: 'Free tier generous',
    truckingSupport: true,
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function MapSettingsPage() {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [saved, setSaved] = useState<string | null>(null);

  // Load saved API keys from localStorage
  useEffect(() => {
    const loadedKeys: Record<string, string> = {};
    MAP_API_CONFIGS.forEach((config) => {
      const key = localStorage.getItem(`map_api_${config.envVar}`);
      if (key) {
        loadedKeys[config.envVar] = key;
      }
    });
    setApiKeys(loadedKeys);
  }, []);

  const handleSave = (envVar: string) => {
    if (tempValue.trim()) {
      localStorage.setItem(`map_api_${envVar}`, tempValue.trim());
      setApiKeys((prev) => ({ ...prev, [envVar]: tempValue.trim() }));
      setSaved(envVar);
      setTimeout(() => setSaved(null), 2000);
    }
    setEditingKey(null);
    setTempValue('');
  };

  const handleDelete = (envVar: string) => {
    localStorage.removeItem(`map_api_${envVar}`);
    setApiKeys((prev) => {
      const next = { ...prev };
      delete next[envVar];
      return next;
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'maps': return <Globe className="w-4 h-4" />;
      case 'traffic': return <Car className="w-4 h-4" />;
      case 'weather': return <Cloud className="w-4 h-4" />;
      case 'routing': return <Truck className="w-4 h-4" />;
      default: return <Map className="w-4 h-4" />;
    }
  };

  const groupedConfigs = MAP_API_CONFIGS.reduce((acc, config) => {
    if (!acc[config.category]) acc[config.category] = [];
    acc[config.category].push(config);
    return acc;
  }, {} as Record<string, MapApiConfig[]>);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Map className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Map Provider Settings
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Configure API keys for different mapping services
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Free providers info */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-green-800 dark:text-green-300">
                Free Maps Available
              </h3>
              <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                OpenStreetMap, Carto, and Saudi Government Maps work without any API key. 
                For advanced features like traffic, trucking routes, and weather overlays, 
                add the API keys below.
              </p>
            </div>
          </div>
        </div>

        {/* API Key configurations by category */}
        {Object.entries(groupedConfigs).map(([category, configs]) => (
          <div key={category} className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              {getCategoryIcon(category)}
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 capitalize">
                {category} APIs
              </h2>
            </div>

            <div className="space-y-4">
              {configs.map((config) => {
                const hasKey = !!apiKeys[config.envVar];
                const isEditing = editingKey === config.envVar;
                const isSaved = saved === config.envVar;

                return (
                  <div
                    key={config.id}
                    className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                            {config.name}
                          </h3>
                          {hasKey && (
                            <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                              <Check className="w-3 h-3" /> Configured
                            </span>
                          )}
                          {config.truckingSupport && (
                            <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                              <Truck className="w-3 h-3" /> Trucking
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-slate-500 mt-1">
                          {config.description}
                        </p>

                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {config.features.map((feature) => (
                            <span
                              key={feature}
                              className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>

                        {(config.freeQuota || config.pricing) && (
                          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                            {config.freeQuota && (
                              <span>🆓 Free: {config.freeQuota}</span>
                            )}
                            {config.pricing && (
                              <span>💳 {config.pricing}</span>
                            )}
                          </div>
                        )}
                      </div>

                      <a
                        href={config.apiKeyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      >
                        Get API Key <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    {/* API Key Input */}
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <input
                              type="password"
                              value={tempValue}
                              onChange={(e) => setTempValue(e.target.value)}
                              placeholder="Paste your API key here..."
                              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                              autoFocus
                            />
                          </div>
                          <button
                            onClick={() => handleSave(config.envVar)}
                            className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1"
                          >
                            <Save className="w-4 h-4" /> Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingKey(null);
                              setTempValue('');
                            }}
                            className="px-3 py-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm rounded-lg"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 flex items-center gap-2">
                            <Key className="w-4 h-4 text-slate-400" />
                            {hasKey ? (
                              <span className="text-sm text-slate-600 dark:text-slate-400 font-mono">
                                ••••••••••••••••{apiKeys[config.envVar].slice(-4)}
                              </span>
                            ) : (
                              <span className="text-sm text-slate-400 italic">
                                No API key configured
                              </span>
                            )}
                          </div>
                          
                          {isSaved && (
                            <span className="text-sm text-green-600 flex items-center gap-1">
                              <Check className="w-4 h-4" /> Saved!
                            </span>
                          )}
                          
                          <button
                            onClick={() => {
                              setEditingKey(config.envVar);
                              setTempValue(apiKeys[config.envVar] || '');
                            }}
                            className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                          >
                            {hasKey ? 'Update' : 'Add Key'}
                          </button>
                          
                          {hasKey && (
                            <button
                              onClick={() => handleDelete(config.envVar)}
                              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                              title="Remove API key"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Security note */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mt-8">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-800 dark:text-amber-300">
                Security Note
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                API keys are stored in your browser's local storage. For production use, 
                configure these in your server's environment variables (.env file) for 
                better security. Never commit API keys to version control.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
