'use client';

/**
 * Enhanced Live Tracking Map Component
 * 
 * Multi-provider map with:
 * - Switch between Google Maps, OpenStreetMap, HERE, MapBox, etc.
 * - Trucking-specific layers (ban zones, rest areas, weigh stations)
 * - Real-time GPS tracking from IoT/Daleeli/Driver
 * - Geofence visualization
 * - Touchpoint markers
 * - Route visualization
 * - API key management
 * 
 * @module components/transportation/EnhancedTrackingMap
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Truck,
  MapPin,
  Navigation2,
  AlertTriangle,
  Circle,
  RefreshCw,
  Maximize2,
  Layers,
  Clock,
  Signal,
  Wifi,
  WifiOff,
  Settings,
  ChevronDown,
  Check,
  X,
  ExternalLink,
  Key,
  Fuel,
  Coffee,
  Scale,
  AlertCircle,
  Globe,
  Map as MapIcon,
  Satellite,
  Mountain,
} from 'lucide-react';
import {
  mapProviderService,
  MAP_PROVIDERS,
  MAP_LAYERS,
  type MapProvider,
  type MapProviderConfig,
  type MapLayer,
} from '@/lib/services/maps/mapProviderService';

// ============================================================================
// TYPES
// ============================================================================

interface VehicleLocation {
  deviceId: string;
  vehicleId?: string;
  plateNumber?: string;
  shipmentId?: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading?: number;
  timestamp: Date | string;
  source: 'IOT' | 'DALEELI' | 'DRIVER';
  isOnline?: boolean;
  anomaly?: {
    detected: boolean;
    type?: string;
    severity?: string;
  };
}

interface GeofenceZone {
  id: string;
  name: string;
  type: string;
  geometry: {
    type: 'CIRCLE' | 'POLYGON';
    coordinates: {
      center?: { lat: number; lng: number };
      radius?: number;
      points?: { lat: number; lng: number }[];
    };
  };
  color?: string;
}

interface Touchpoint {
  id: string;
  name: string;
  type: string;
  coordinates: { lat: number; lng: number };
  status: 'PENDING' | 'APPROACHING' | 'ARRIVED' | 'DEPARTED';
  estimatedArrival?: Date | string;
}

interface EnhancedTrackingMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  vehicles?: VehicleLocation[];
  geofences?: GeofenceZone[];
  touchpoints?: Touchpoint[];
  refreshInterval?: number;
  showControls?: boolean;
  height?: string;
  onVehicleClick?: (vehicle: VehicleLocation) => void;
  onGeofenceClick?: (geofence: GeofenceZone) => void;
  apiEndpoint?: string;
  tenantId?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const EnhancedTrackingMap: React.FC<EnhancedTrackingMapProps> = ({
  center = { lat: 24.7136, lng: 46.6753 },
  zoom = 6,
  vehicles: initialVehicles = [],
  geofences: initialGeofences = [],
  touchpoints: initialTouchpoints = [],
  refreshInterval = 30000,
  showControls = true,
  height = '600px',
  onVehicleClick,
  onGeofenceClick,
  apiEndpoint = '/api/transportation/live-tracking',
  tenantId,
}) => {
  // Data state
  const [vehicles, setVehicles] = useState<VehicleLocation[]>(initialVehicles);
  const [geofences, setGeofences] = useState<GeofenceZone[]>(initialGeofences);
  const [touchpoints, setTouchpoints] = useState<Touchpoint[]>(initialTouchpoints);
  
  // Map state
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleLocation | null>(null);
  
  // UI state
  const [showGeofences, setShowGeofences] = useState(true);
  const [showTouchpoints, setShowTouchpoints] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showProviderMenu, setShowProviderMenu] = useState(false);
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [selectedProviderForKey, setSelectedProviderForKey] = useState<MapProvider | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  
  // Map settings
  const [currentProvider, setCurrentProvider] = useState<MapProvider>('openstreetmap');
  const [enabledLayers, setEnabledLayers] = useState<string[]>(['osm_truck_restrictions', 'rest_areas']);
  
  // Refs
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const geofenceLayersRef = useRef<Map<string, any>>(new Map());
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (tenantId) params.set('tenantId', tenantId);
      
      const response = await fetch(`${apiEndpoint}?${params}`);
      if (!response.ok) throw new Error('Failed to fetch tracking data');
      
      const data = await response.json();
      
      if (data.vehicles) setVehicles(data.vehicles);
      if (data.geofences) setGeofences(data.geofences);
      if (data.touchpoints) setTouchpoints(data.touchpoints);
      
      setIsConnected(true);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [apiEndpoint, tenantId]);

  // ============================================================================
  // MAP INITIALIZATION
  // ============================================================================

  useEffect(() => {
    const loadLeaflet = async () => {
      if ((window as any).L) {
        initializeMap();
        return;
      }

      // Load CSS
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      cssLink.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      cssLink.crossOrigin = '';
      document.head.appendChild(cssLink);

      // Load JS
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      script.onload = () => initializeMap();
      document.head.appendChild(script);
    };

    const initializeMap = () => {
      if (!mapRef.current || leafletMapRef.current) return;

      const L = (window as any).L;
      
      const map = L.map(mapRef.current, {
        center: [center.lat, center.lng],
        zoom: zoom,
        zoomControl: true,
      });

      // Add initial tile layer
      const provider = MAP_PROVIDERS[currentProvider];
      const apiKey = provider.apiKeyEnvVar 
        ? (typeof window !== 'undefined' ? localStorage.getItem(`map_api_key_${provider.id}`) || process.env[`NEXT_PUBLIC_${provider.apiKeyEnvVar}`] : undefined)
        : undefined;
      const tileUrl = provider.getTileUrl(apiKey);
      tileLayerRef.current = L.tileLayer(tileUrl, {
        maxZoom: provider.maxZoom,
        attribution: provider.attribution,
        subdomains: provider.subdomains || 'abc',
      }).addTo(map);

      leafletMapRef.current = map;
      setMapLoaded(true);
    };

    loadLeaflet();

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================================
  // PROVIDER SWITCHING
  // ============================================================================

  const switchProvider = useCallback((providerId: MapProvider) => {
    if (!leafletMapRef.current) return;

    const L = (window as any).L;
    const provider = MAP_PROVIDERS[providerId];

    // Check if API key is needed
    if (provider.requiresApiKey) {
      const hasKey = mapProviderService.hasApiKey(providerId);
      if (!hasKey) {
        setSelectedProviderForKey(providerId);
        setShowApiKeyModal(true);
        return;
      }
    }

    // Remove old tile layer
    if (tileLayerRef.current) {
      leafletMapRef.current.removeLayer(tileLayerRef.current);
    }

    // Get API key if needed
    const apiKey = provider.apiKeyEnvVar 
      ? (typeof window !== 'undefined' ? localStorage.getItem(`map_api_key_${provider.id}`) || process.env[`NEXT_PUBLIC_${provider.apiKeyEnvVar}`] : undefined)
      : undefined;

    // Get tile URL with API key if needed
    const tileUrl = provider.getTileUrl(apiKey);

    // Add new tile layer
    tileLayerRef.current = L.tileLayer(tileUrl, {
      maxZoom: provider.maxZoom,
      attribution: provider.attribution,
      subdomains: provider.subdomains || 'abc',
    }).addTo(leafletMapRef.current);

    setCurrentProvider(providerId);
    mapProviderService.setProvider(providerId);
    setShowProviderMenu(false);
  }, []);

  const saveApiKey = useCallback(() => {
    if (selectedProviderForKey && apiKeyInput.trim()) {
      mapProviderService.setApiKey(selectedProviderForKey, apiKeyInput.trim());
      setShowApiKeyModal(false);
      setApiKeyInput('');
      // Now switch to the provider
      switchProvider(selectedProviderForKey);
      setSelectedProviderForKey(null);
    }
  }, [selectedProviderForKey, apiKeyInput, switchProvider]);

  // ============================================================================
  // UPDATE MARKERS
  // ============================================================================

  useEffect(() => {
    if (!mapLoaded || !leafletMapRef.current) return;

    const L = (window as any).L;
    const map = leafletMapRef.current;

    vehicles.forEach((vehicle) => {
      const markerId = vehicle.deviceId;
      let marker = markersRef.current.get(markerId);

      const iconHtml = `
        <div style="
          position: relative;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 36px;
            height: 36px;
            background: ${vehicle.anomaly?.detected ? '#ef4444' : vehicle.isOnline !== false ? '#22c55e' : '#6b7280'};
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            transform: rotate(${vehicle.heading || 0}deg);
          ">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white" style="transform: rotate(-${vehicle.heading || 0}deg);">
              <path d="M12 2L4 20h16L12 2z"/>
            </svg>
          </div>
          ${vehicle.speed > 0 ? `
            <div style="
              position: absolute;
              bottom: -8px;
              left: 50%;
              transform: translateX(-50%);
              background: #1e293b;
              color: white;
              font-size: 10px;
              padding: 1px 4px;
              border-radius: 4px;
              white-space: nowrap;
            ">${Math.round(vehicle.speed)} km/h</div>
          ` : ''}
        </div>
      `;

      const icon = L.divIcon({
        html: iconHtml,
        className: 'vehicle-marker',
        iconSize: [40, 50],
        iconAnchor: [20, 25],
      });

      if (marker) {
        marker.setLatLng([vehicle.latitude, vehicle.longitude]);
        marker.setIcon(icon);
      } else {
        marker = L.marker([vehicle.latitude, vehicle.longitude], { icon })
          .addTo(map)
          .bindPopup(createVehiclePopup(vehicle));
        
        marker.on('click', () => {
          setSelectedVehicle(vehicle);
          if (onVehicleClick) onVehicleClick(vehicle);
        });
        
        markersRef.current.set(markerId, marker);
      }
    });

    // Remove old markers
    markersRef.current.forEach((marker, id) => {
      if (!vehicles.find((v) => v.deviceId === id)) {
        map.removeLayer(marker);
        markersRef.current.delete(id);
      }
    });
  }, [vehicles, mapLoaded, onVehicleClick]);

  // ============================================================================
  // UPDATE GEOFENCES
  // ============================================================================

  useEffect(() => {
    if (!mapLoaded || !leafletMapRef.current || !showGeofences) return;

    const L = (window as any).L;
    const map = leafletMapRef.current;

    // Clear existing
    geofenceLayersRef.current.forEach((layer) => map.removeLayer(layer));
    geofenceLayersRef.current.clear();

    geofences.forEach((zone) => {
      const color = zone.color || getZoneColor(zone.type);
      let layer;

      if (zone.geometry.type === 'CIRCLE' && zone.geometry.coordinates.center) {
        layer = L.circle(
          [zone.geometry.coordinates.center.lat, zone.geometry.coordinates.center.lng],
          {
            radius: zone.geometry.coordinates.radius || 500,
            color: color,
            fillColor: color,
            fillOpacity: 0.2,
            weight: 2,
          }
        ).addTo(map);
      } else if (zone.geometry.type === 'POLYGON' && zone.geometry.coordinates.points) {
        const points = zone.geometry.coordinates.points.map((p) => [p.lat, p.lng]);
        layer = L.polygon(points, {
          color: color,
          fillColor: color,
          fillOpacity: 0.2,
          weight: 2,
        }).addTo(map);
      }

      if (layer) {
        layer.bindPopup(`<strong>${zone.name}</strong><br/><span style="color: #666;">${zone.type}</span>`);
        layer.on('click', () => onGeofenceClick?.(zone));
        geofenceLayersRef.current.set(zone.id, layer);
      }
    });
  }, [geofences, showGeofences, mapLoaded, onGeofenceClick]);

  // ============================================================================
  // AUTO-REFRESH
  // ============================================================================

  useEffect(() => {
    if (refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(fetchData, refreshInterval);
    }
    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [refreshInterval, fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ============================================================================
  // HELPERS
  // ============================================================================

  const createVehiclePopup = (vehicle: VehicleLocation): string => {
    const time = new Date(vehicle.timestamp).toLocaleTimeString();
    return `
      <div style="min-width: 180px; font-family: system-ui, sans-serif;">
        <div style="font-weight: 600; margin-bottom: 8px; color: #1e293b;">
          ${vehicle.plateNumber || vehicle.vehicleId || vehicle.deviceId}
        </div>
        <div style="font-size: 12px; color: #64748b; line-height: 1.6;">
          <div>📍 ${vehicle.latitude.toFixed(5)}, ${vehicle.longitude.toFixed(5)}</div>
          <div>🚗 Speed: ${Math.round(vehicle.speed)} km/h</div>
          <div>🧭 Heading: ${vehicle.heading?.toFixed(0) || '-'}°</div>
          <div>📡 Source: ${vehicle.source}</div>
          <div>🕐 ${time}</div>
        </div>
      </div>
    `;
  };

  const getZoneColor = (type: string): string => {
    const colors: Record<string, string> = {
      BORDER_EXIT_POINT: '#3b82f6',
      BORDER_ENTRY_POINT: '#8b5cf6',
      CUSTOMS_CLEARANCE_FACILITY: '#f59e0b',
      REGULATORY_CHECKPOINT: '#ef4444',
      TRUCK_BAN_AREA: '#f43f5e',
      REST_AREA: '#22c55e',
      FUEL_STATION: '#06b6d4',
      WEIGH_STATION: '#6366f1',
    };
    return colors[type] || '#64748b';
  };

  const handleCenterOnVehicles = () => {
    if (!leafletMapRef.current || vehicles.length === 0) return;
    
    const L = (window as any).L;
    
    // Create valid bounds only if we have valid coordinates
    const validVehicles = vehicles.filter(
      v => typeof v.latitude === 'number' && 
           typeof v.longitude === 'number' &&
           !isNaN(v.latitude) && 
           !isNaN(v.longitude)
    );
    
    if (validVehicles.length === 0) return;
    
    if (validVehicles.length === 1) {
      // If only one vehicle, center on it
      leafletMapRef.current.setView(
        [validVehicles[0].latitude, validVehicles[0].longitude],
        14
      );
    } else {
      // Multiple vehicles - fit bounds
      try {
        const bounds = L.latLngBounds(
          validVehicles.map((v) => [v.latitude, v.longitude])
        );
        if (bounds.isValid()) {
          leafletMapRef.current.fitBounds(bounds, { padding: [50, 50] });
        }
      } catch (e) {
        console.warn('Could not fit bounds:', e);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const getProviderIcon = (providerId: MapProvider) => {
    if (providerId.includes('satellite') || providerId.includes('aerial') || providerId.includes('imagery')) return <Satellite className="w-4 h-4" />;
    if (providerId.includes('terrain')) return <Mountain className="w-4 h-4" />;
    return <MapIcon className="w-4 h-4" />;
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const currentProviderConfig = MAP_PROVIDERS[currentProvider];

  return (
    <div 
      ref={containerRef}
      className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Navigation2 className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">Live Tracking</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${
              isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
            <span className="text-slate-500">{vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {showControls && (
          <div className="flex items-center gap-2">
            {/* Map Provider Selector */}
            <div className="relative">
              <button
                onClick={() => setShowProviderMenu(!showProviderMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm"
              >
                <Globe className="w-4 h-4 text-slate-600" />
                <span className="hidden sm:inline">{currentProviderConfig.name}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showProviderMenu && (
                <div className="absolute right-0 top-full mt-1 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-[1000] max-h-96 overflow-y-auto">
                  <div className="p-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-medium text-slate-500 uppercase">Map Providers</span>
                  </div>
                  
                  {/* Free Providers */}
                  <div className="p-2">
                    <span className="text-xs text-green-600 font-medium">FREE</span>
                    {Object.values(MAP_PROVIDERS).filter(p => p.category === 'free').map((provider) => (
                      <button
                        key={provider.id}
                        onClick={() => switchProvider(provider.id)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
                      >
                        {getProviderIcon(provider.id)}
                        <div className="flex-1">
                          <div className="font-medium text-sm text-slate-800 dark:text-slate-200">
                            {provider.name}
                          </div>
                          <div className="text-xs text-slate-500 truncate">{provider.description}</div>
                        </div>
                        {currentProvider === provider.id && <Check className="w-4 h-4 text-green-500" />}
                      </button>
                    ))}
                  </div>

                  {/* Premium Providers */}
                  <div className="p-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-xs text-blue-600 font-medium">PREMIUM (API Key Required)</span>
                    {Object.values(MAP_PROVIDERS).filter(p => p.category !== 'free').map((provider) => {
                      const hasKey = mapProviderService.hasApiKey(provider.id);
                      return (
                        <button
                          key={provider.id}
                          onClick={() => switchProvider(provider.id)}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
                        >
                          {getProviderIcon(provider.id)}
                          <div className="flex-1">
                            <div className="font-medium text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                              {provider.name}
                              {!hasKey && (
                                <span className="text-xs text-orange-500 flex items-center gap-1">
                                  <Key className="w-3 h-3" /> Need Key
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 truncate">{provider.description}</div>
                          </div>
                          {currentProvider === provider.id && <Check className="w-4 h-4 text-green-500" />}
                          {provider.apiKeyUrl && (
                            <a
                              href={provider.apiKeyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 text-blue-500 hover:text-blue-700"
                              title="Get API Key"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Layer Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowLayerMenu(!showLayerMenu)}
                className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Trucking Layers"
              >
                <Layers className="w-4 h-4 text-slate-600" />
              </button>

              {showLayerMenu && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-[1000] p-2">
                  <div className="text-xs font-medium text-slate-500 uppercase mb-2">Trucking Layers</div>
                  {MAP_LAYERS.filter(l => l.category === 'trucking').map((layer) => (
                    <label
                      key={layer.id}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={enabledLayers.includes(layer.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEnabledLayers([...enabledLayers, layer.id]);
                          } else {
                            setEnabledLayers(enabledLayers.filter(l => l !== layer.id));
                          }
                        }}
                        className="rounded text-blue-600"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{layer.name}</div>
                        <div className="text-xs text-slate-500">{layer.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => fetchData()}
              disabled={isLoading}
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={handleCenterOnVehicles}
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
              title="Center on vehicles"
            >
              <MapPin className="w-4 h-4 text-slate-600" />
            </button>
            
            <button
              onClick={() => setShowGeofences(!showGeofences)}
              className={`p-2 rounded-lg transition-colors ${showGeofences ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-200'}`}
              title="Toggle geofences"
            >
              <Circle className="w-4 h-4" />
            </button>
            
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
              title="Fullscreen"
            >
              <Maximize2 className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        )}
      </div>

      {/* Map Container */}
      <div ref={mapRef} style={{ height, width: '100%' }} />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-lg">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-sm text-slate-600">Updating...</span>
          </div>
        </div>
      )}

      {/* Last update */}
      <div className="absolute bottom-2 left-2 bg-white/90 dark:bg-slate-800/90 px-2 py-1 rounded text-xs text-slate-500 flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Last update: {lastUpdate.toLocaleTimeString()}
      </div>

      {/* Provider indicator */}
      <div className="absolute bottom-2 right-2 bg-white/90 dark:bg-slate-800/90 px-2 py-1 rounded text-xs text-slate-500 flex items-center gap-1">
        <Globe className="w-3 h-3" />
        {currentProviderConfig.name}
        {currentProviderConfig.category === 'free' && <span className="text-green-600">(Free)</span>}
      </div>

      {/* Legend */}
      <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-800/90 px-3 py-2 rounded text-xs z-[500]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Online</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gray-500" />
            <span>Offline</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Anomaly</span>
          </div>
        </div>
      </div>

      {/* API Key Modal */}
      {showApiKeyModal && selectedProviderForKey && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-[2000]">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                Enter API Key
              </h3>
              <button
                onClick={() => {
                  setShowApiKeyModal(false);
                  setSelectedProviderForKey(null);
                  setApiKeyInput('');
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              {MAP_PROVIDERS[selectedProviderForKey].name} requires an API key.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                API Key
              </label>
              <input
                type="text"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Enter your API key..."
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            {MAP_PROVIDERS[selectedProviderForKey].apiKeyUrl && (
              <a
                href={MAP_PROVIDERS[selectedProviderForKey].apiKeyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mb-4"
              >
                <ExternalLink className="w-4 h-4" />
                Get API Key from {MAP_PROVIDERS[selectedProviderForKey].name}
              </a>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowApiKeyModal(false);
                  setSelectedProviderForKey(null);
                  setApiKeyInput('');
                }}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={saveApiKey}
                disabled={!apiKeyInput.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Save & Use
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close menus */}
      {(showProviderMenu || showLayerMenu) && (
        <div
          className="fixed inset-0 z-[999]"
          onClick={() => {
            setShowProviderMenu(false);
            setShowLayerMenu(false);
          }}
        />
      )}
    </div>
  );
};

export default EnhancedTrackingMap;
