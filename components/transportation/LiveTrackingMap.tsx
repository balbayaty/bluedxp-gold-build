'use client';

/**
 * Live Tracking Map Component
 * 
 * Real-time vehicle tracking map with:
 * - Multi-provider map support (Google, OSM, Saudi Govt, HERE, etc.)
 * - Live GPS positions from IoT devices
 * - Geofence visualization
 * - Touchpoint markers
 * - Route visualization
 * - Multi-source location indicators
 * - Trucking layers (rest areas, weight stations, etc.)
 * 
 * @module components/transportation/LiveTrackingMap
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
  Map as MapIcon,
  Cloud,
  Car,
  ExternalLink,
  Check,
  X,
} from 'lucide-react';
import { 
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

interface LiveTrackingMapProps {
  /** Initial center coordinates */
  center?: { lat: number; lng: number };
  /** Initial zoom level */
  zoom?: number;
  /** Vehicles to display */
  vehicles?: VehicleLocation[];
  /** Geofence zones to display */
  geofences?: GeofenceZone[];
  /** Touchpoints to display */
  touchpoints?: Touchpoint[];
  /** Refresh interval in ms (0 = manual only) */
  refreshInterval?: number;
  /** Show controls panel */
  showControls?: boolean;
  /** Height of the map */
  height?: string;
  /** Callback when vehicle is clicked */
  onVehicleClick?: (vehicle: VehicleLocation) => void;
  /** Callback when geofence is clicked */
  onGeofenceClick?: (geofence: GeofenceZone) => void;
  /** API endpoint for fetching data */
  apiEndpoint?: string;
  /** Tenant ID for filtering */
  tenantId?: string;
  /** Default map provider */
  defaultProvider?: MapProvider;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate if coordinates are valid lat/lng
 */
function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Get API key from localStorage or environment
 */
function getApiKey(envVar: string): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(`map_api_${envVar}`) || null;
  }
  return null;
}

/**
 * Save API key to localStorage
 */
function saveApiKey(envVar: string, key: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`map_api_${envVar}`, key);
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  center = { lat: 24.7136, lng: 46.6753 }, // Riyadh default
  zoom = 6,
  vehicles: initialVehicles = [],
  geofences: initialGeofences = [],
  touchpoints: initialTouchpoints = [],
  refreshInterval = 30000, // 30 seconds
  showControls = true,
  height = '600px',
  onVehicleClick,
  onGeofenceClick,
  apiEndpoint = '/api/transportation/live-tracking',
  tenantId,
  defaultProvider = 'openstreetmap',
}) => {
  // State
  const [vehicles, setVehicles] = useState<VehicleLocation[]>(initialVehicles);
  const [geofences, setGeofences] = useState<GeofenceZone[]>(initialGeofences);
  const [touchpoints, setTouchpoints] = useState<Touchpoint[]>(initialTouchpoints);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleLocation | null>(null);
  const [showGeofences, setShowGeofences] = useState(true);
  const [showTouchpoints, setShowTouchpoints] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Map provider state
  const [currentProvider, setCurrentProvider] = useState<MapProvider>(defaultProvider);
  const [showProviderPanel, setShowProviderPanel] = useState(false);
  const [showLayersPanel, setShowLayersPanel] = useState(false);
  const [enabledLayers, setEnabledLayers] = useState<Set<string>>(new Set());
  const [apiKeyInput, setApiKeyInput] = useState<{ envVar: string; value: string } | null>(null);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const overlayLayersRef = useRef<Map<string, any>>(new Map());
  const markersRef = useRef<Map<string, any>>(new Map());
  const geofenceLayersRef = useRef<Map<string, any>>(new Map());
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
      
      if (data.vehicles) {
        // Filter out invalid coordinates
        const validVehicles = data.vehicles.filter((v: VehicleLocation) => 
          isValidCoordinate(v.latitude, v.longitude)
        );
        setVehicles(validVehicles);
      }
      if (data.geofences) {
        setGeofences(data.geofences);
      }
      if (data.touchpoints) {
        setTouchpoints(data.touchpoints);
      }
      
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
    // Load Leaflet from CDN
    const loadLeaflet = async () => {
      // Check if already loaded
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
      script.onload = () => {
        initializeMap();
      };
      document.head.appendChild(script);
    };

    const initializeMap = () => {
      if (!mapRef.current || leafletMapRef.current) return;

      const L = (window as any).L;
      
      // Create map
      const map = L.map(mapRef.current, {
        center: [center.lat, center.lng],
        zoom: zoom,
        zoomControl: true,
      });

      // Add initial tile layer
      const provider = MAP_PROVIDERS[currentProvider];
      const apiKey = provider.apiKeyEnvVar ? getApiKey(provider.apiKeyEnvVar) : undefined;
      
      tileLayerRef.current = L.tileLayer(provider.getTileUrl(apiKey || undefined), {
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
  // CHANGE MAP PROVIDER
  // ============================================================================

  useEffect(() => {
    if (!mapLoaded || !leafletMapRef.current) return;

    const L = (window as any).L;
    const map = leafletMapRef.current;
    const provider = MAP_PROVIDERS[currentProvider];
    const apiKey = provider.apiKeyEnvVar ? getApiKey(provider.apiKeyEnvVar) : undefined;

    // Remove old tile layer
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    // Add new tile layer
    tileLayerRef.current = L.tileLayer(provider.getTileUrl(apiKey || undefined), {
      maxZoom: provider.maxZoom,
      attribution: provider.attribution,
      subdomains: provider.subdomains || 'abc',
    }).addTo(map);
  }, [currentProvider, mapLoaded]);

  // ============================================================================
  // UPDATE OVERLAY LAYERS
  // ============================================================================

  useEffect(() => {
    if (!mapLoaded || !leafletMapRef.current) return;

    const L = (window as any).L;
    const map = leafletMapRef.current;

    // Remove disabled layers
    overlayLayersRef.current.forEach((layer, id) => {
      if (!enabledLayers.has(id)) {
        map.removeLayer(layer);
        overlayLayersRef.current.delete(id);
      }
    });

    // Add enabled layers
    enabledLayers.forEach((layerId) => {
      if (!overlayLayersRef.current.has(layerId)) {
        const layerConfig = MAP_LAYERS.find((l) => l.id === layerId);
        if (layerConfig) {
          const apiKey = layerConfig.apiKeyEnvVar 
            ? getApiKey(layerConfig.apiKeyEnvVar) 
            : undefined;
          
          const tileUrl = layerConfig.getTileUrl(apiKey || undefined);
          if (tileUrl) {
            const layer = L.tileLayer(tileUrl, {
              opacity: layerConfig.opacity || 1,
            }).addTo(map);
            overlayLayersRef.current.set(layerId, layer);
          }
        }
      }
    });
  }, [enabledLayers, mapLoaded]);

  // ============================================================================
  // UPDATE MARKERS
  // ============================================================================

  useEffect(() => {
    if (!mapLoaded || !leafletMapRef.current) return;

    const L = (window as any).L;
    const map = leafletMapRef.current;

    // Update vehicle markers
    vehicles.forEach((vehicle) => {
      if (!isValidCoordinate(vehicle.latitude, vehicle.longitude)) return;
      
      const markerId = vehicle.deviceId;
      let marker = markersRef.current.get(markerId);

      // Create custom icon
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
        // Update existing marker
        marker.setLatLng([vehicle.latitude, vehicle.longitude]);
        marker.setIcon(icon);
      } else {
        // Create new marker
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

    // Clear existing geofence layers
    geofenceLayersRef.current.forEach((layer) => {
      map.removeLayer(layer);
    });
    geofenceLayersRef.current.clear();

    // Add geofence zones
    geofences.forEach((zone) => {
      const color = zone.color || getZoneColor(zone.type);
      let layer;

      if (zone.geometry.type === 'CIRCLE' && zone.geometry.coordinates.center) {
        const { center: c, radius } = zone.geometry.coordinates;
        if (c && isValidCoordinate(c.lat, c.lng)) {
          layer = L.circle([c.lat, c.lng], {
            radius: radius || 500,
            color: color,
            fillColor: color,
            fillOpacity: 0.2,
            weight: 2,
          }).addTo(map);
        }
      } else if (zone.geometry.type === 'POLYGON' && zone.geometry.coordinates.points) {
        const validPoints = zone.geometry.coordinates.points.filter(
          (p) => isValidCoordinate(p.lat, p.lng)
        );
        if (validPoints.length >= 3) {
          const points = validPoints.map((p) => [p.lat, p.lng]);
          layer = L.polygon(points, {
            color: color,
            fillColor: color,
            fillOpacity: 0.2,
            weight: 2,
          }).addTo(map);
        }
      }

      if (layer) {
        layer.bindPopup(`
          <div style="min-width: 150px;">
            <strong>${zone.name}</strong><br/>
            <span style="color: #666;">${zone.type}</span>
          </div>
        `);
        
        layer.on('click', () => {
          if (onGeofenceClick) onGeofenceClick(zone);
        });
        
        geofenceLayersRef.current.set(zone.id, layer);
      }
    });
  }, [geofences, showGeofences, mapLoaded, onGeofenceClick]);

  // ============================================================================
  // UPDATE TOUCHPOINTS
  // ============================================================================

  useEffect(() => {
    if (!mapLoaded || !leafletMapRef.current || !showTouchpoints) return;

    const L = (window as any).L;
    const map = leafletMapRef.current;

    // Add touchpoint markers
    touchpoints.forEach((tp) => {
      if (!isValidCoordinate(tp.coordinates.lat, tp.coordinates.lng)) return;
      
      const color = getTouchpointColor(tp.status);
      const iconHtml = `
        <div style="
          width: 24px;
          height: 24px;
          background: ${color};
          border: 2px solid white;
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
      `;

      const icon = L.divIcon({
        html: iconHtml,
        className: 'touchpoint-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      L.marker([tp.coordinates.lat, tp.coordinates.lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="min-width: 150px;">
            <strong>${tp.name}</strong><br/>
            <span style="color: #666;">${tp.type}</span><br/>
            <span style="color: ${color};">${tp.status}</span>
          </div>
        `);
    });
  }, [touchpoints, showTouchpoints, mapLoaded]);

  // ============================================================================
  // AUTO-REFRESH
  // ============================================================================

  useEffect(() => {
    if (refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(fetchData, refreshInterval);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [refreshInterval, fetchData]);

  // Initial fetch
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
          ${vehicle.shipmentId ? `<div>📦 ${vehicle.shipmentId}</div>` : ''}
          ${vehicle.anomaly?.detected ? `
            <div style="color: #ef4444; font-weight: 500; margin-top: 4px;">
              ⚠️ ${vehicle.anomaly.type || 'Anomaly detected'}
            </div>
          ` : ''}
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
      PORT_TERMINAL: '#06b6d4',
      WAREHOUSE: '#22c55e',
      CUSTOMER_SITE: '#84cc16',
      TRUCK_BAN_AREA: '#f43f5e',
      REST_AREA: '#6366f1',
    };
    return colors[type] || '#64748b';
  };

  const getTouchpointColor = (status: string): string => {
    const colors: Record<string, string> = {
      PENDING: '#64748b',
      APPROACHING: '#f59e0b',
      ARRIVED: '#22c55e',
      DEPARTED: '#3b82f6',
    };
    return colors[status] || '#64748b';
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleCenterOnVehicles = () => {
    if (!leafletMapRef.current) return;
    
    const validVehicles = vehicles.filter(
      (v) => isValidCoordinate(v.latitude, v.longitude)
    );
    
    if (validVehicles.length === 0) {
      // No valid vehicles, center on default (Riyadh)
      leafletMapRef.current.setView([center.lat, center.lng], zoom);
      return;
    }
    
    const L = (window as any).L;
    
    if (validVehicles.length === 1) {
      leafletMapRef.current.setView(
        [validVehicles[0].latitude, validVehicles[0].longitude],
        14
      );
    } else {
      try {
        const bounds = L.latLngBounds(
          validVehicles.map((v) => [v.latitude, v.longitude])
        );
        if (bounds.isValid()) {
          leafletMapRef.current.fitBounds(bounds, { padding: [50, 50] });
        } else {
          // Fallback
          leafletMapRef.current.setView(
            [validVehicles[0].latitude, validVehicles[0].longitude],
            10
          );
        }
      } catch (e) {
        console.warn('Could not fit bounds:', e);
        leafletMapRef.current.setView(
          [validVehicles[0].latitude, validVehicles[0].longitude],
          10
        );
      }
    }
  };

  const toggleFullscreen = () => {
    if (!mapRef.current) return;
    
    if (!isFullscreen) {
      mapRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleProviderChange = (provider: MapProvider) => {
    const config = MAP_PROVIDERS[provider];
    
    // Check if API key is required but not set
    if (config.requiresApiKey && config.apiKeyEnvVar) {
      const existingKey = getApiKey(config.apiKeyEnvVar);
      if (!existingKey) {
        setApiKeyInput({ envVar: config.apiKeyEnvVar, value: '' });
        return;
      }
    }
    
    setCurrentProvider(provider);
    setShowProviderPanel(false);
  };

  const handleSaveApiKey = () => {
    if (apiKeyInput && apiKeyInput.value.trim()) {
      saveApiKey(apiKeyInput.envVar, apiKeyInput.value.trim());
      
      // Find and set the provider that uses this key
      const provider = Object.values(MAP_PROVIDERS).find(
        (p) => p.apiKeyEnvVar === apiKeyInput.envVar
      );
      if (provider) {
        setCurrentProvider(provider.id);
      }
    }
    setApiKeyInput(null);
    setShowProviderPanel(false);
  };

  const toggleLayer = (layerId: string) => {
    setEnabledLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layerId)) {
        next.delete(layerId);
      } else {
        next.add(layerId);
      }
      return next;
    });
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const currentProviderConfig = MAP_PROVIDERS[currentProvider];

  return (
    <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Navigation2 className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Live Tracking
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${
              isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
            
            <span className="text-slate-500 dark:text-slate-400">
              {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {showControls && (
          <div className="flex items-center gap-2">
            {/* Map Provider Selector */}
            <button
              onClick={() => setShowProviderPanel(!showProviderPanel)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm"
              title="Change map provider"
            >
              <MapIcon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400 hidden sm:inline">
                {currentProviderConfig.name}
              </span>
            </button>
            
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 text-slate-600 dark:text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={handleCenterOnVehicles}
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Center on vehicles"
            >
              <MapPin className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
            
            <button
              onClick={() => setShowGeofences(!showGeofences)}
              className={`p-2 rounded-lg transition-colors ${
                showGeofences ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title="Toggle geofences"
            >
              <Circle className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setShowLayersPanel(!showLayersPanel)}
              className={`p-2 rounded-lg transition-colors ${
                showLayersPanel ? 'bg-purple-100 text-purple-600' : 'hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title="Map layers"
            >
              <Layers className="w-4 h-4" />
            </button>
            
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Fullscreen"
            >
              <Maximize2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        )}
      </div>

      {/* Map Provider Panel */}
      {showProviderPanel && (
        <div className="absolute top-16 right-4 z-[1000] w-80 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 max-h-[500px] overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-slate-800 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-800 dark:text-slate-200">Map Provider</span>
              <button 
                onClick={() => setShowProviderPanel(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="p-2">
            {/* Group by category */}
            {(['free', 'freemium', 'commercial'] as const).map((category) => (
              <div key={category} className="mb-4">
                <div className="px-2 py-1 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  {category === 'free' ? '🆓 Free' : category === 'freemium' ? '💳 Freemium' : '💰 Commercial'}
                </div>
                
                {Object.values(MAP_PROVIDERS)
                  .filter((p) => p.category === category)
                  .map((provider) => {
                    const hasKey = !provider.requiresApiKey || 
                      (provider.apiKeyEnvVar && getApiKey(provider.apiKeyEnvVar));
                    
                    return (
                      <button
                        key={provider.id}
                        onClick={() => handleProviderChange(provider.id)}
                        className={`w-full px-3 py-2 rounded-lg text-left flex items-start gap-3 transition-colors ${
                          currentProvider === provider.id
                            ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-slate-800 dark:text-slate-200">
                              {provider.name}
                            </span>
                            {provider.truckingSupport && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                                🚛 Trucking
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{provider.description}</p>
                          
                          {provider.requiresApiKey && !hasKey && (
                            <a
                              href={provider.apiKeyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1"
                            >
                              Get API Key <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        
                        {currentProvider === provider.id && (
                          <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* API Key Input Modal */}
      {apiKeyInput && (
        <div className="absolute inset-0 z-[1100] bg-black/50 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-96">
            <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200 mb-4">
              Enter API Key
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              This map provider requires an API key. You can get one from the provider's website.
            </p>
            <input
              type="text"
              value={apiKeyInput.value}
              onChange={(e) => setApiKeyInput({ ...apiKeyInput, value: e.target.value })}
              placeholder="Paste your API key here..."
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setApiKeyInput(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveApiKey}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save & Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Layers Panel */}
      {showLayersPanel && (
        <div className="absolute top-16 right-4 z-[1000] w-72 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-800 dark:text-slate-200">Map Layers</span>
              <button 
                onClick={() => setShowLayersPanel(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="p-3 space-y-3 max-h-80 overflow-y-auto">
            {(['trucking', 'traffic', 'weather'] as const).map((category) => {
              const layers = MAP_LAYERS.filter((l) => l.category === category);
              if (layers.length === 0) return null;
              
              return (
                <div key={category}>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase mb-2">
                    {category === 'trucking' && <Truck className="w-3 h-3" />}
                    {category === 'traffic' && <Car className="w-3 h-3" />}
                    {category === 'weather' && <Cloud className="w-3 h-3" />}
                    {category}
                  </div>
                  
                  {layers.map((layer) => (
                    <label
                      key={layer.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={enabledLayers.has(layer.id)}
                        onChange={() => toggleLayer(layer.id)}
                        className="w-4 h-4 rounded border-slate-300"
                      />
                      <div className="flex-1">
                        <div className="text-sm text-slate-700 dark:text-slate-300">
                          {layer.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {layer.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Map Container */}
      <div ref={mapRef} style={{ height, width: '100%' }} />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-lg">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-sm text-slate-600 dark:text-slate-300">Updating...</span>
          </div>
        </div>
      )}

      {/* Last update */}
      <div className="absolute bottom-2 left-2 bg-white/90 dark:bg-slate-800/90 px-2 py-1 rounded text-xs text-slate-500 flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Last update: {lastUpdate.toLocaleTimeString()}
      </div>

      {/* Selected vehicle panel */}
      {selectedVehicle && (
        <div className="absolute top-16 right-4 w-72 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-4 z-[900]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {selectedVehicle.plateNumber || selectedVehicle.vehicleId || selectedVehicle.deviceId}
              </span>
            </div>
            <button
              onClick={() => setSelectedVehicle(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Speed</span>
              <span className="font-medium">{Math.round(selectedVehicle.speed)} km/h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Heading</span>
              <span className="font-medium">{selectedVehicle.heading?.toFixed(0) || '-'}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Source</span>
              <span className="font-medium flex items-center gap-1">
                <Signal className="w-3 h-3" />
                {selectedVehicle.source}
              </span>
            </div>
            {selectedVehicle.shipmentId && (
              <div className="flex justify-between">
                <span className="text-slate-500">Shipment</span>
                <span className="font-medium text-blue-600">{selectedVehicle.shipmentId}</span>
              </div>
            )}
            {selectedVehicle.anomaly?.detected && (
              <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs">{selectedVehicle.anomaly.type || 'Anomaly detected'}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-2 right-2 bg-white/90 dark:bg-slate-800/90 px-3 py-2 rounded text-xs">
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
    </div>
  );
};

export default LiveTrackingMap;
