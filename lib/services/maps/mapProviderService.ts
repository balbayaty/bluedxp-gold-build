/**
 * Multi-Provider Map Service
 * 
 * Supports multiple map tile providers with easy switching:
 * - OpenStreetMap (free, default)
 * - Google Maps (requires API key)
 * - Saudi Government Maps (Esri-based)
 * - HERE Maps (commercial, trucking features)
 * - Mapbox (commercial, customizable)
 * - OpenRouteService (free, trucking routing)
 * - TomTom (commercial, trucking)
 * 
 * @module lib/services/maps/mapProviderService
 */

// ============================================================================
// TYPES
// ============================================================================

export type MapProvider = 
  | 'openstreetmap'
  | 'google_roadmap'
  | 'google_satellite'
  | 'google_hybrid'
  | 'google_terrain'
  | 'saudi_esri'
  | 'saudi_imagery'
  | 'here_normal'
  | 'here_satellite'
  | 'here_truck'
  | 'mapbox_streets'
  | 'mapbox_satellite'
  | 'tomtom'
  | 'carto_light'
  | 'carto_dark'
  | 'stadia_smooth'
  | 'stadia_dark'
  | 'thunderforest_transport';

export interface MapProviderConfig {
  id: MapProvider;
  name: string;
  category: 'free' | 'freemium' | 'commercial';
  requiresApiKey: boolean;
  apiKeyEnvVar?: string;
  description: string;
  features: string[];
  attribution: string;
  getTileUrl: (apiKey?: string) => string;
  maxZoom: number;
  subdomains?: string;
  /** For trucking-specific providers */
  truckingSupport?: boolean;
  /** Link to get API key */
  apiKeyUrl?: string;
}

export interface MapLayer {
  id: string;
  name: string;
  description: string;
  type: 'overlay' | 'base';
  category: 'trucking' | 'traffic' | 'weather' | 'satellite' | 'government' | 'custom';
  enabled: boolean;
  getTileUrl: (apiKey?: string) => string;
  opacity?: number;
  requiresApiKey?: boolean;
  apiKeyEnvVar?: string;
  apiKeyUrl?: string;
}

// ============================================================================
// MAP PROVIDERS CONFIGURATION
// ============================================================================

export const MAP_PROVIDERS: Record<MapProvider, MapProviderConfig> = {
  // =========== FREE PROVIDERS ===========
  openstreetmap: {
    id: 'openstreetmap',
    name: 'OpenStreetMap',
    category: 'free',
    requiresApiKey: false,
    description: 'Free, open-source map tiles. Best general-purpose option.',
    features: ['Free', 'No API key', 'Community updated', 'Good global coverage'],
    attribution: '© OpenStreetMap contributors',
    getTileUrl: () => 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    maxZoom: 19,
    subdomains: 'abc',
  },
  
  carto_light: {
    id: 'carto_light',
    name: 'Carto Positron (Light)',
    category: 'free',
    requiresApiKey: false,
    description: 'Clean, minimal light theme. Great for business dashboards.',
    features: ['Free', 'Light theme', 'Clean design', 'Good for overlays'],
    attribution: '© CARTO © OpenStreetMap contributors',
    getTileUrl: () => 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    maxZoom: 20,
    subdomains: 'abcd',
  },
  
  carto_dark: {
    id: 'carto_dark',
    name: 'Carto Dark Matter',
    category: 'free',
    requiresApiKey: false,
    description: 'Dark theme for night mode or modern UI.',
    features: ['Free', 'Dark theme', 'Good contrast', 'Night mode'],
    attribution: '© CARTO © OpenStreetMap contributors',
    getTileUrl: () => 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    maxZoom: 20,
    subdomains: 'abcd',
  },

  // =========== GOOGLE MAPS ===========
  google_roadmap: {
    id: 'google_roadmap',
    name: 'Google Maps (Road)',
    category: 'freemium',
    requiresApiKey: true,
    apiKeyEnvVar: 'GOOGLE_MAPS_API_KEY',
    apiKeyUrl: 'https://console.cloud.google.com/google/maps-apis/credentials',
    description: 'Google Maps standard road view. Best address recognition.',
    features: ['Accurate addresses', 'Real-time traffic', 'Street View', 'POI data'],
    attribution: '© Google',
    getTileUrl: (apiKey) => `https://maps.googleapis.com/maps/vt?pb=!1m5!1m4!1i{z}!2i{x}!3i{y}!4i256!2m3!1e0!2sm!3i{apiKey ? apiKey : ''}!3m17!2sen!3sUS!5e18!12m4!1e68!2m2!1sset!2sRoadmap!12m3!1e37!2m1!1ssmartmaps!12m4!1e26!2m2!1sstyles!2ss.e%3Al.i%7Cp.v%3Aoff`,
    maxZoom: 21,
    truckingSupport: true,
  },
  
  google_satellite: {
    id: 'google_satellite',
    name: 'Google Satellite',
    category: 'freemium',
    requiresApiKey: true,
    apiKeyEnvVar: 'GOOGLE_MAPS_API_KEY',
    apiKeyUrl: 'https://console.cloud.google.com/google/maps-apis/credentials',
    description: 'Google satellite imagery. Best for site verification.',
    features: ['High-res imagery', 'Global coverage', 'Recent updates'],
    attribution: '© Google',
    getTileUrl: (apiKey) => `https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}`,
    maxZoom: 21,
  },
  
  google_hybrid: {
    id: 'google_hybrid',
    name: 'Google Hybrid',
    category: 'freemium',
    requiresApiKey: true,
    apiKeyEnvVar: 'GOOGLE_MAPS_API_KEY',
    apiKeyUrl: 'https://console.cloud.google.com/google/maps-apis/credentials',
    description: 'Satellite with road labels overlay.',
    features: ['Satellite + Labels', 'Best of both', 'Road visibility'],
    attribution: '© Google',
    getTileUrl: (apiKey) => `https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}`,
    maxZoom: 21,
    truckingSupport: true,
  },
  
  google_terrain: {
    id: 'google_terrain',
    name: 'Google Terrain',
    category: 'freemium',
    requiresApiKey: true,
    apiKeyEnvVar: 'GOOGLE_MAPS_API_KEY',
    apiKeyUrl: 'https://console.cloud.google.com/google/maps-apis/credentials',
    description: 'Topographic map with elevation.',
    features: ['Elevation data', 'Terrain visualization', 'Good for logistics'],
    attribution: '© Google',
    getTileUrl: (apiKey) => `https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}`,
    maxZoom: 21,
  },

  // =========== SAUDI GOVERNMENT MAPS ===========
  saudi_esri: {
    id: 'saudi_esri',
    name: 'Saudi Government Map',
    category: 'free',
    requiresApiKey: false,
    description: 'Official Saudi Arabia government basemap via Esri.',
    features: ['Official data', 'Arabic labels', 'Local POIs', 'Government accurate'],
    attribution: '© Saudi Geospatial Authority',
    getTileUrl: () => 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 18,
  },
  
  saudi_imagery: {
    id: 'saudi_imagery',
    name: 'Saudi Imagery',
    category: 'free',
    requiresApiKey: false,
    description: 'Satellite imagery optimized for Saudi Arabia.',
    features: ['Local imagery', 'Desert terrain', 'Infrastructure'],
    attribution: '© Saudi Geospatial Authority © Esri',
    getTileUrl: () => 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 18,
  },

  // =========== HERE MAPS (Trucking Specialist) ===========
  here_normal: {
    id: 'here_normal',
    name: 'HERE Maps',
    category: 'freemium',
    requiresApiKey: true,
    apiKeyEnvVar: 'HERE_API_KEY',
    apiKeyUrl: 'https://developer.here.com/sign-up',
    description: 'HERE Maps standard view. Excellent for trucking.',
    features: ['Truck routing', 'Weight restrictions', 'Height clearances', 'Hazmat routes'],
    attribution: '© HERE',
    getTileUrl: (apiKey) => `https://1.base.maps.ls.hereapi.com/maptile/2.1/maptile/newest/normal.day/{z}/{x}/{y}/256/png8?apiKey=${apiKey || 'DEMO'}`,
    maxZoom: 20,
    truckingSupport: true,
  },
  
  here_satellite: {
    id: 'here_satellite',
    name: 'HERE Satellite',
    category: 'freemium',
    requiresApiKey: true,
    apiKeyEnvVar: 'HERE_API_KEY',
    apiKeyUrl: 'https://developer.here.com/sign-up',
    description: 'HERE satellite imagery.',
    features: ['High resolution', 'Global coverage'],
    attribution: '© HERE',
    getTileUrl: (apiKey) => `https://1.aerial.maps.ls.hereapi.com/maptile/2.1/maptile/newest/satellite.day/{z}/{x}/{y}/256/png8?apiKey=${apiKey || 'DEMO'}`,
    maxZoom: 20,
  },
  
  here_truck: {
    id: 'here_truck',
    name: 'HERE Truck Map',
    category: 'commercial',
    requiresApiKey: true,
    apiKeyEnvVar: 'HERE_API_KEY',
    apiKeyUrl: 'https://developer.here.com/sign-up',
    description: 'Specialized truck routing map with restrictions.',
    features: ['Truck restrictions', 'Low bridges', 'Weight limits', 'Tunnel restrictions'],
    attribution: '© HERE',
    getTileUrl: (apiKey) => `https://1.base.maps.ls.hereapi.com/maptile/2.1/trucktile/newest/normal.day/{z}/{x}/{y}/256/png8?apiKey=${apiKey || 'DEMO'}`,
    maxZoom: 20,
    truckingSupport: true,
  },

  // =========== MAPBOX ===========
  mapbox_streets: {
    id: 'mapbox_streets',
    name: 'Mapbox Streets',
    category: 'freemium',
    requiresApiKey: true,
    apiKeyEnvVar: 'MAPBOX_ACCESS_TOKEN',
    apiKeyUrl: 'https://account.mapbox.com/access-tokens/',
    description: 'Mapbox customizable street map. 50K free views/month.',
    features: ['Customizable styles', '3D buildings', 'Fast rendering', 'Mobile optimized'],
    attribution: '© Mapbox © OpenStreetMap',
    getTileUrl: (apiKey) => `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${apiKey || 'DEMO'}`,
    maxZoom: 22,
    truckingSupport: true,
  },
  
  mapbox_satellite: {
    id: 'mapbox_satellite',
    name: 'Mapbox Satellite',
    category: 'freemium',
    requiresApiKey: true,
    apiKeyEnvVar: 'MAPBOX_ACCESS_TOKEN',
    apiKeyUrl: 'https://account.mapbox.com/access-tokens/',
    description: 'Mapbox satellite with labels.',
    features: ['Satellite imagery', 'Labels overlay', 'High resolution'],
    attribution: '© Mapbox © OpenStreetMap',
    getTileUrl: (apiKey) => `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/{z}/{x}/{y}?access_token=${apiKey || 'DEMO'}`,
    maxZoom: 22,
  },

  // =========== TOMTOM ===========
  tomtom: {
    id: 'tomtom',
    name: 'TomTom',
    category: 'freemium',
    requiresApiKey: true,
    apiKeyEnvVar: 'TOMTOM_API_KEY',
    apiKeyUrl: 'https://developer.tomtom.com/user/register',
    description: 'TomTom maps with real-time traffic. 2,500 free requests/day.',
    features: ['Real-time traffic', 'Truck routing', 'ETA calculations', 'Speed cameras'],
    attribution: '© TomTom',
    getTileUrl: (apiKey) => `https://api.tomtom.com/map/1/tile/basic/main/{z}/{x}/{y}.png?key=${apiKey || 'DEMO'}`,
    maxZoom: 22,
    truckingSupport: true,
  },

  // =========== STADIA MAPS ===========
  stadia_smooth: {
    id: 'stadia_smooth',
    name: 'Stadia Alidade Smooth',
    category: 'freemium',
    requiresApiKey: true,
    apiKeyEnvVar: 'STADIA_API_KEY',
    apiKeyUrl: 'https://client.stadiamaps.com/signup/',
    description: 'Modern, smooth styled map. 200K free tiles/month.',
    features: ['Modern design', 'Good performance', 'Clean aesthetics'],
    attribution: '© Stadia Maps © OpenStreetMap',
    getTileUrl: (apiKey) => `https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png${apiKey ? `?api_key=${apiKey}` : ''}`,
    maxZoom: 20,
  },
  
  stadia_dark: {
    id: 'stadia_dark',
    name: 'Stadia Alidade Dark',
    category: 'freemium',
    requiresApiKey: true,
    apiKeyEnvVar: 'STADIA_API_KEY',
    apiKeyUrl: 'https://client.stadiamaps.com/signup/',
    description: 'Dark themed map for night mode.',
    features: ['Dark theme', 'Eye-friendly', 'Night driving'],
    attribution: '© Stadia Maps © OpenStreetMap',
    getTileUrl: (apiKey) => `https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png${apiKey ? `?api_key=${apiKey}` : ''}`,
    maxZoom: 20,
  },

  // =========== THUNDERFOREST (Transport) ===========
  thunderforest_transport: {
    id: 'thunderforest_transport',
    name: 'Thunderforest Transport',
    category: 'freemium',
    requiresApiKey: true,
    apiKeyEnvVar: 'THUNDERFOREST_API_KEY',
    apiKeyUrl: 'https://www.thunderforest.com/pricing/',
    description: 'Transport-focused map. Shows railways, roads, airports.',
    features: ['Transport focus', 'Railways', 'Airports', 'Major roads'],
    attribution: '© Thunderforest © OpenStreetMap',
    getTileUrl: (apiKey) => `https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=${apiKey || 'DEMO'}`,
    maxZoom: 22,
    subdomains: 'abc',
    truckingSupport: true,
  },
};

// ============================================================================
// OVERLAY LAYERS
// ============================================================================

export const MAP_LAYERS: MapLayer[] = [
  // Traffic Layers
  {
    id: 'google_traffic',
    name: 'Google Traffic',
    description: 'Real-time traffic conditions',
    type: 'overlay',
    category: 'traffic',
    enabled: false,
    requiresApiKey: true,
    apiKeyEnvVar: 'GOOGLE_MAPS_API_KEY',
    apiKeyUrl: 'https://console.cloud.google.com/google/maps-apis/credentials',
    getTileUrl: (apiKey) => `https://mt1.google.com/vt?lyrs=h,traffic&x={x}&y={y}&z={z}`,
    opacity: 0.7,
  },
  {
    id: 'tomtom_traffic',
    name: 'TomTom Traffic Flow',
    description: 'TomTom real-time traffic',
    type: 'overlay',
    category: 'traffic',
    enabled: false,
    requiresApiKey: true,
    apiKeyEnvVar: 'TOMTOM_API_KEY',
    apiKeyUrl: 'https://developer.tomtom.com/user/register',
    getTileUrl: (apiKey) => `https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=${apiKey || 'DEMO'}`,
    opacity: 0.6,
  },
  
  // Trucking Layers
  {
    id: 'osm_truck_restrictions',
    name: 'Truck Restrictions (OSM)',
    description: 'Weight/height limits from OpenStreetMap',
    type: 'overlay',
    category: 'trucking',
    enabled: false,
    getTileUrl: () => 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', // Would use overpass for restrictions
    opacity: 0.5,
  },
  {
    id: 'rest_areas',
    name: 'Rest Areas & Truck Stops',
    description: 'Truck stops, rest areas, fuel stations',
    type: 'overlay',
    category: 'trucking',
    enabled: false,
    getTileUrl: () => '', // Custom markers overlay
    opacity: 1,
  },
  
  // Weather Layers
  {
    id: 'openweather_clouds',
    name: 'Cloud Cover',
    description: 'OpenWeatherMap cloud layer',
    type: 'overlay',
    category: 'weather',
    enabled: false,
    requiresApiKey: true,
    apiKeyEnvVar: 'OPENWEATHER_API_KEY',
    apiKeyUrl: 'https://home.openweathermap.org/api_keys',
    getTileUrl: (apiKey) => `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${apiKey || 'DEMO'}`,
    opacity: 0.5,
  },
  {
    id: 'openweather_precipitation',
    name: 'Precipitation',
    description: 'Rain/snow overlay',
    type: 'overlay',
    category: 'weather',
    enabled: false,
    requiresApiKey: true,
    apiKeyEnvVar: 'OPENWEATHER_API_KEY',
    apiKeyUrl: 'https://home.openweathermap.org/api_keys',
    getTileUrl: (apiKey) => `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${apiKey || 'DEMO'}`,
    opacity: 0.6,
  },
  {
    id: 'openweather_wind',
    name: 'Wind Speed',
    description: 'Wind conditions',
    type: 'overlay',
    category: 'weather',
    enabled: false,
    requiresApiKey: true,
    apiKeyEnvVar: 'OPENWEATHER_API_KEY',
    apiKeyUrl: 'https://home.openweathermap.org/api_keys',
    getTileUrl: (apiKey) => `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${apiKey || 'DEMO'}`,
    opacity: 0.5,
  },
];

// ============================================================================
// SERVICE CLASS
// ============================================================================

class MapProviderService {
  private currentProvider: MapProvider = 'openstreetmap';
  private enabledLayers: Set<string> = new Set();
  private apiKeys: Map<string, string> = new Map();

  constructor() {
    // Load API keys from environment
    this.loadApiKeys();
  }

  private loadApiKeys(): void {
    if (typeof process !== 'undefined' && process.env) {
      const envVars = [
        'GOOGLE_MAPS_API_KEY',
        'HERE_API_KEY',
        'MAPBOX_ACCESS_TOKEN',
        'TOMTOM_API_KEY',
        'STADIA_API_KEY',
        'THUNDERFOREST_API_KEY',
        'OPENWEATHER_API_KEY',
      ];

      envVars.forEach((key) => {
        const value = process.env[key];
        if (value) {
          this.apiKeys.set(key, value);
        }
      });
    }
  }

  /**
   * Get current map provider configuration
   */
  getCurrentProvider(): MapProviderConfig {
    return MAP_PROVIDERS[this.currentProvider];
  }

  /**
   * Set the active map provider
   */
  setProvider(provider: MapProvider): void {
    if (!MAP_PROVIDERS[provider]) {
      throw new Error(`Unknown map provider: ${provider}`);
    }
    this.currentProvider = provider;
  }

  /**
   * Get tile URL for current provider
   */
  getTileUrl(): string {
    const provider = this.getCurrentProvider();
    const apiKey = provider.apiKeyEnvVar 
      ? this.apiKeys.get(provider.apiKeyEnvVar) 
      : undefined;
    return provider.getTileUrl(apiKey);
  }

  /**
   * Get all available providers
   */
  getAllProviders(): MapProviderConfig[] {
    return Object.values(MAP_PROVIDERS);
  }

  /**
   * Get providers by category
   */
  getProvidersByCategory(category: 'free' | 'freemium' | 'commercial'): MapProviderConfig[] {
    return Object.values(MAP_PROVIDERS).filter((p) => p.category === category);
  }

  /**
   * Get trucking-optimized providers
   */
  getTruckingProviders(): MapProviderConfig[] {
    return Object.values(MAP_PROVIDERS).filter((p) => p.truckingSupport);
  }

  /**
   * Check if provider has valid API key
   */
  hasApiKey(provider: MapProvider): boolean {
    const config = MAP_PROVIDERS[provider];
    if (!config.requiresApiKey) return true;
    if (!config.apiKeyEnvVar) return true;
    return this.apiKeys.has(config.apiKeyEnvVar);
  }

  /**
   * Set API key for a provider
   */
  setApiKey(envVar: string, key: string): void {
    this.apiKeys.set(envVar, key);
  }

  /**
   * Get all overlay layers
   */
  getAllLayers(): MapLayer[] {
    return MAP_LAYERS;
  }

  /**
   * Get layers by category
   */
  getLayersByCategory(category: MapLayer['category']): MapLayer[] {
    return MAP_LAYERS.filter((l) => l.category === category);
  }

  /**
   * Toggle a layer
   */
  toggleLayer(layerId: string, enabled: boolean): void {
    if (enabled) {
      this.enabledLayers.add(layerId);
    } else {
      this.enabledLayers.delete(layerId);
    }
  }

  /**
   * Get enabled layers
   */
  getEnabledLayers(): MapLayer[] {
    return MAP_LAYERS.filter((l) => this.enabledLayers.has(l.id));
  }

  /**
   * Get recommended provider for Saudi Arabia trucking
   */
  getRecommendedForSaudiTrucking(): MapProvider {
    // Check what API keys are available
    if (this.hasApiKey('here_truck')) return 'here_truck';
    if (this.hasApiKey('google_hybrid')) return 'google_hybrid';
    if (this.hasApiKey('tomtom')) return 'tomtom';
    return 'saudi_esri'; // Free Saudi government map
  }
}

export const mapProviderService = new MapProviderService();
export default mapProviderService;
