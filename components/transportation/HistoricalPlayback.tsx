'use client';

/**
 * Historical Playback Component
 * 
 * Enables users to replay shipment routes with:
 * - Timeline scrubber with date/time selection
 * - Playback controls (play, pause, speed)
 * - Route visualization with animation
 * - Event markers on timeline
 * - Speed and heading trail visualization
 * 
 * Uses Leaflet for map rendering (free, no API key required)
 * 
 * @module components/transportation/HistoricalPlayback
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
  MapPin,
  Truck,
  Navigation2,
  Gauge,
  AlertTriangle,
  Download,
  Share2,
  Maximize2,
  RefreshCw,
  Settings,
  X,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: Date | string;
  speed?: number;
  heading?: number;
  source?: 'IOT' | 'DALEELI' | 'DRIVER';
  eventType?: 'NORMAL' | 'STOP' | 'SPEEDING' | 'GEOFENCE_ENTRY' | 'GEOFENCE_EXIT' | 'ANOMALY';
  eventDetails?: string;
}

interface ShipmentRoute {
  shipmentId: string;
  shipmentNumber?: string;
  vehicleId?: string;
  plateNumber?: string;
  driverName?: string;
  startTime: Date | string;
  endTime?: Date | string;
  origin: { name: string; lat: number; lng: number };
  destination: { name: string; lat: number; lng: number };
  points: LocationPoint[];
  events?: ShipmentEvent[];
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

interface ShipmentEvent {
  id: string;
  type: 'GEOFENCE_ENTRY' | 'GEOFENCE_EXIT' | 'STOP' | 'SPEEDING' | 'ANOMALY' | 'CHECKPOINT';
  timestamp: Date | string;
  location: { lat: number; lng: number };
  description: string;
  duration?: number; // seconds
  severity?: 'INFO' | 'WARNING' | 'CRITICAL';
}

interface HistoricalPlaybackProps {
  /** Shipment ID to load history for */
  shipmentId?: string;
  /** Pre-loaded route data */
  route?: ShipmentRoute;
  /** Height of the map */
  height?: string;
  /** API endpoint for fetching route data */
  apiEndpoint?: string;
  /** Callback when playback position changes */
  onPositionChange?: (point: LocationPoint, index: number) => void;
  /** Callback when event is reached */
  onEventReached?: (event: ShipmentEvent) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PLAYBACK_SPEEDS = [0.5, 1, 2, 5, 10, 20, 50];
const DEFAULT_SPEED = 2;

// ============================================================================
// COMPONENT
// ============================================================================

export const HistoricalPlayback: React.FC<HistoricalPlaybackProps> = ({
  shipmentId,
  route: initialRoute,
  height = '600px',
  apiEndpoint = '/api/transportation/history',
  onPositionChange,
  onEventReached,
}) => {
  // State
  const [route, setRoute] = useState<ShipmentRoute | null>(initialRoute || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(DEFAULT_SPEED);
  const [selectedDateRange, setSelectedDateRange] = useState<{ start: Date; end: Date } | null>(null);
  
  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [showTrail, setShowTrail] = useState(true);
  const [trailLength, setTrailLength] = useState(50); // Number of points to show in trail
  const [showEvents, setShowEvents] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Refs
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const vehicleMarkerRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);
  const trailLineRef = useRef<any>(null);
  const eventMarkersRef = useRef<Map<string, any>>(new Map());
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchRouteData = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      params.set('shipmentId', id);
      if (selectedDateRange) {
        params.set('startTime', selectedDateRange.start.toISOString());
        params.set('endTime', selectedDateRange.end.toISOString());
      }
      
      const response = await fetch(`${apiEndpoint}?${params}`);
      if (!response.ok) throw new Error('Failed to fetch route data');
      
      const data = await response.json();
      setRoute(data.route);
      setCurrentIndex(0);
      setIsPlaying(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load route');
    } finally {
      setIsLoading(false);
    }
  }, [apiEndpoint, selectedDateRange]);

  // Load data on mount if shipmentId provided
  useEffect(() => {
    if (shipmentId && !initialRoute) {
      fetchRouteData(shipmentId);
    }
  }, [shipmentId, initialRoute, fetchRouteData]);

  // ============================================================================
  // MAP INITIALIZATION
  // ============================================================================

  useEffect(() => {
    // Load Leaflet from CDN
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
      
      // Default center (Riyadh)
      const defaultCenter = route?.origin
        ? [route.origin.lat, route.origin.lng]
        : [24.7136, 46.6753];
      
      const map = L.map(mapRef.current, {
        center: defaultCenter,
        zoom: 8,
        zoomControl: true,
      });

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
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
  // ROUTE VISUALIZATION
  // ============================================================================

  useEffect(() => {
    if (!mapLoaded || !leafletMapRef.current || !route) return;

    const L = (window as any).L;
    const map = leafletMapRef.current;

    // Clear existing layers
    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current);
    }
    if (trailLineRef.current) {
      map.removeLayer(trailLineRef.current);
    }
    eventMarkersRef.current.forEach((marker) => map.removeLayer(marker));
    eventMarkersRef.current.clear();

    // Draw full route (faded)
    const routePoints = route.points.map((p) => [p.latitude, p.longitude]);
    routeLineRef.current = L.polyline(routePoints, {
      color: '#94a3b8',
      weight: 3,
      opacity: 0.5,
      dashArray: '5, 10',
    }).addTo(map);

    // Add origin marker
    L.marker([route.origin.lat, route.origin.lng], {
      icon: L.divIcon({
        html: `
          <div style="
            width: 32px;
            height: 32px;
            background: #22c55e;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            </svg>
          </div>
        `,
        className: 'origin-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      }),
    }).addTo(map).bindPopup(`<b>Origin</b><br/>${route.origin.name}`);

    // Add destination marker
    L.marker([route.destination.lat, route.destination.lng], {
      icon: L.divIcon({
        html: `
          <div style="
            width: 32px;
            height: 32px;
            background: #ef4444;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            </svg>
          </div>
        `,
        className: 'destination-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      }),
    }).addTo(map).bindPopup(`<b>Destination</b><br/>${route.destination.name}`);

    // Add event markers
    if (showEvents && route.events) {
      route.events.forEach((event) => {
        const color = getEventColor(event.type, event.severity);
        const marker = L.marker([event.location.lat, event.location.lng], {
          icon: L.divIcon({
            html: `
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
                ${getEventIcon(event.type)}
              </div>
            `,
            className: 'event-marker',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          }),
        }).addTo(map).bindPopup(`
          <b>${event.description}</b><br/>
          ${new Date(event.timestamp).toLocaleString()}
          ${event.duration ? `<br/>Duration: ${formatDuration(event.duration)}` : ''}
        `);
        
        eventMarkersRef.current.set(event.id, marker);
      });
    }

    // Fit bounds to route
    if (routePoints.length > 0) {
      map.fitBounds(L.latLngBounds(routePoints), { padding: [50, 50] });
    }
  }, [mapLoaded, route, showEvents]);

  // ============================================================================
  // VEHICLE ANIMATION
  // ============================================================================

  useEffect(() => {
    if (!mapLoaded || !leafletMapRef.current || !route || route.points.length === 0) return;

    const L = (window as any).L;
    const map = leafletMapRef.current;
    const currentPoint = route.points[currentIndex];
    
    if (!currentPoint) return;

    // Create or update vehicle marker
    const heading = currentPoint.heading || 0;
    const speed = currentPoint.speed || 0;
    const isAnomaly = currentPoint.eventType === 'ANOMALY';
    
    const iconHtml = `
      <div style="
        position: relative;
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 40px;
          height: 40px;
          background: ${isAnomaly ? '#ef4444' : '#3b82f6'};
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(${heading}deg);
          transition: transform 0.3s ease;
        ">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white" style="transform: rotate(-${heading}deg);">
            <path d="M12 2L4 20h16L12 2z"/>
          </svg>
        </div>
        <div style="
          position: absolute;
          bottom: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: #1e293b;
          color: white;
          font-size: 10px;
          font-weight: 500;
          padding: 2px 6px;
          border-radius: 4px;
          white-space: nowrap;
        ">${Math.round(speed)} km/h</div>
      </div>
    `;

    const icon = L.divIcon({
      html: iconHtml,
      className: 'vehicle-marker-animated',
      iconSize: [48, 60],
      iconAnchor: [24, 30],
    });

    if (vehicleMarkerRef.current) {
      vehicleMarkerRef.current.setLatLng([currentPoint.latitude, currentPoint.longitude]);
      vehicleMarkerRef.current.setIcon(icon);
    } else {
      vehicleMarkerRef.current = L.marker([currentPoint.latitude, currentPoint.longitude], { icon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup(createVehiclePopup(currentPoint, route));
    }

    // Update trail line
    if (showTrail) {
      const trailStart = Math.max(0, currentIndex - trailLength);
      const trailPoints = route.points.slice(trailStart, currentIndex + 1).map((p) => [p.latitude, p.longitude]);
      
      if (trailLineRef.current) {
        map.removeLayer(trailLineRef.current);
      }
      
      trailLineRef.current = L.polyline(trailPoints, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.9,
      }).addTo(map);
    }

    // Pan map to follow vehicle
    map.panTo([currentPoint.latitude, currentPoint.longitude], { animate: true });

    // Trigger callback
    if (onPositionChange) {
      onPositionChange(currentPoint, currentIndex);
    }

    // Check for events
    if (route.events && onEventReached) {
      const currentTime = new Date(currentPoint.timestamp).getTime();
      const event = route.events.find((e) => {
        const eventTime = new Date(e.timestamp).getTime();
        return Math.abs(eventTime - currentTime) < 60000; // Within 1 minute
      });
      if (event) {
        onEventReached(event);
      }
    }
  }, [currentIndex, mapLoaded, route, showTrail, trailLength, onPositionChange, onEventReached]);

  // ============================================================================
  // PLAYBACK CONTROL
  // ============================================================================

  useEffect(() => {
    if (isPlaying && route) {
      const intervalMs = 1000 / playbackSpeed;
      
      playbackIntervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= route.points.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    }

    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, route]);

  // ============================================================================
  // HELPERS
  // ============================================================================

  const getEventColor = (type: string, severity?: string): string => {
    if (severity === 'CRITICAL') return '#ef4444';
    if (severity === 'WARNING') return '#f59e0b';
    
    const colors: Record<string, string> = {
      GEOFENCE_ENTRY: '#22c55e',
      GEOFENCE_EXIT: '#3b82f6',
      STOP: '#8b5cf6',
      SPEEDING: '#ef4444',
      ANOMALY: '#dc2626',
      CHECKPOINT: '#06b6d4',
    };
    return colors[type] || '#64748b';
  };

  const getEventIcon = (type: string): string => {
    const icons: Record<string, string> = {
      GEOFENCE_ENTRY: '<svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M12 2L4 20h16L12 2z"/></svg>',
      GEOFENCE_EXIT: '<svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M12 22L4 4h16L12 22z"/></svg>',
      STOP: '<svg width="12" height="12" viewBox="0 0 24 24" fill="white"><rect x="6" y="6" width="12" height="12"/></svg>',
      SPEEDING: '<svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M12 2L2 12l10 10 10-10L12 2z"/></svg>',
      ANOMALY: '<svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M12 2l-2 18h4L12 2z"/></svg>',
      CHECKPOINT: '<svg width="12" height="12" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="12" r="8"/></svg>',
    };
    return icons[type] || '<svg width="12" height="12" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="12" r="6"/></svg>';
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  const createVehiclePopup = (point: LocationPoint, route: ShipmentRoute): string => {
    return `
      <div style="min-width: 200px; font-family: system-ui;">
        <div style="font-weight: 600; margin-bottom: 8px;">
          ${route.plateNumber || route.vehicleId || 'Vehicle'}
        </div>
        <div style="font-size: 12px; color: #64748b; line-height: 1.6;">
          <div>📍 ${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}</div>
          <div>🚗 Speed: ${Math.round(point.speed || 0)} km/h</div>
          <div>🧭 Heading: ${point.heading?.toFixed(0) || '-'}°</div>
          <div>📡 Source: ${point.source || 'Unknown'}</div>
          <div>🕐 ${new Date(point.timestamp).toLocaleString()}</div>
          ${route.driverName ? `<div>👤 ${route.driverName}</div>` : ''}
        </div>
      </div>
    `;
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentIndex(parseInt(e.target.value, 10));
    setIsPlaying(false);
  };

  const skipTo = (direction: 'start' | 'end' | 'prev' | 'next') => {
    if (!route) return;
    
    switch (direction) {
      case 'start':
        setCurrentIndex(0);
        break;
      case 'end':
        setCurrentIndex(route.points.length - 1);
        break;
      case 'prev':
        setCurrentIndex(Math.max(0, currentIndex - Math.ceil(route.points.length / 20)));
        break;
      case 'next':
        setCurrentIndex(Math.min(route.points.length - 1, currentIndex + Math.ceil(route.points.length / 20)));
        break;
    }
    setIsPlaying(false);
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

  const exportRoute = () => {
    if (!route) return;
    
    const data = {
      ...route,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `route-${route.shipmentId}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getCurrentTime = (): string => {
    if (!route || route.points.length === 0) return '--:--:--';
    const point = route.points[currentIndex];
    return new Date(point.timestamp).toLocaleTimeString();
  };

  const getProgress = (): number => {
    if (!route || route.points.length === 0) return 0;
    return (currentIndex / (route.points.length - 1)) * 100;
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div 
      ref={containerRef}
      className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Historical Playback
            </span>
          </div>
          
          {route && (
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">
                {route.shipmentNumber || route.shipmentId}
              </span>
              <span>•</span>
              <span>{route.points.length} points</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </button>
          
          <button
            onClick={exportRoute}
            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Export route"
          >
            <Download className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </button>
          
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-16 right-4 z-[1000] w-64 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="font-medium text-slate-800 dark:text-slate-200">Settings</span>
            <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Show trail</span>
              <button
                onClick={() => setShowTrail(!showTrail)}
                className={`w-10 h-6 rounded-full transition-colors ${
                  showTrail ? 'bg-blue-500' : 'bg-slate-300'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${
                  showTrail ? 'translate-x-5' : 'translate-x-1'
                }`} />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Show events</span>
              <button
                onClick={() => setShowEvents(!showEvents)}
                className={`w-10 h-6 rounded-full transition-colors ${
                  showEvents ? 'bg-blue-500' : 'bg-slate-300'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${
                  showEvents ? 'translate-x-5' : 'translate-x-1'
                }`} />
              </button>
            </div>
            
            <div>
              <span className="text-sm text-slate-600 dark:text-slate-400">Trail length</span>
              <input
                type="range"
                min="10"
                max="200"
                value={trailLength}
                onChange={(e) => setTrailLength(parseInt(e.target.value, 10))}
                className="w-full mt-1"
              />
              <div className="text-xs text-slate-500 text-right">{trailLength} points</div>
            </div>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div ref={mapRef} style={{ height, width: '100%' }} />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 flex items-center justify-center z-[999]">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-lg">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-sm text-slate-600 dark:text-slate-300">Loading route...</span>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[999]">
          <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-3 rounded-lg shadow-lg">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Playback Controls */}
      {route && (
        <div className="absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur border-t border-slate-200 dark:border-slate-700 p-4">
          {/* Timeline slider */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>{new Date(route.startTime).toLocaleString()}</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{getCurrentTime()}</span>
              <span>{route.endTime ? new Date(route.endTime).toLocaleString() : 'In Progress'}</span>
            </div>
            
            <div className="relative">
              <input
                type="range"
                min="0"
                max={route.points.length - 1}
                value={currentIndex}
                onChange={handleSliderChange}
                className="w-full h-2 appearance-none bg-slate-200 dark:bg-slate-600 rounded-full cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #3b82f6 ${getProgress()}%, #e2e8f0 ${getProgress()}%)`,
                }}
              />
              
              {/* Event markers on timeline */}
              {showEvents && route.events && (
                <div className="absolute top-0 left-0 right-0 h-2 pointer-events-none">
                  {route.events.map((event) => {
                    const eventTime = new Date(event.timestamp).getTime();
                    const startTime = new Date(route.startTime).getTime();
                    const endTime = new Date(route.endTime || route.points[route.points.length - 1].timestamp).getTime();
                    const position = ((eventTime - startTime) / (endTime - startTime)) * 100;
                    
                    if (position < 0 || position > 100) return null;
                    
                    return (
                      <div
                        key={event.id}
                        className="absolute w-2 h-2 rounded-full -top-1"
                        style={{
                          left: `${position}%`,
                          backgroundColor: getEventColor(event.type, event.severity),
                          transform: 'translateX(-50%)',
                        }}
                        title={event.description}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            {/* Left: Navigation */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => skipTo('start')}
                className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Go to start"
              >
                <SkipBack className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>
              
              <button
                onClick={() => skipTo('prev')}
                className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Skip back"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>
              
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`p-3 rounded-full transition-colors ${
                  isPlaying 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              
              <button
                onClick={() => skipTo('next')}
                className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Skip forward"
              >
                <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>
              
              <button
                onClick={() => skipTo('end')}
                className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Go to end"
              >
                <SkipForward className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>
            </div>

            {/* Center: Current info */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <Gauge className="w-4 h-4" />
                <span>{Math.round(route.points[currentIndex]?.speed || 0)} km/h</span>
              </div>
              
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <Navigation2 className="w-4 h-4" />
                <span>{route.points[currentIndex]?.heading?.toFixed(0) || '-'}°</span>
              </div>
              
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <MapPin className="w-4 h-4" />
                <span>{currentIndex + 1} / {route.points.length}</span>
              </div>
            </div>

            {/* Right: Speed control */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Speed:</span>
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                className="px-2 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300"
              >
                {PLAYBACK_SPEEDS.map((speed) => (
                  <option key={speed} value={speed}>
                    {speed}x
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!route && !isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-slate-500">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No route data loaded</p>
            <p className="text-sm">Select a shipment to view its history</p>
          </div>
        </div>
      )}

      {/* Legend */}
      {route && (
        <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-800/90 px-3 py-2 rounded-lg text-xs z-[500]">
          <div className="font-medium text-slate-700 dark:text-slate-300 mb-2">Route</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Origin: {route.origin.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>Destination: {route.destination.name}</span>
            </div>
            {route.plateNumber && (
              <div className="flex items-center gap-2">
                <Truck className="w-3 h-3 text-blue-500" />
                <span>{route.plateNumber}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoricalPlayback;
