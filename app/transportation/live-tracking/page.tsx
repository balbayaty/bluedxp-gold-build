'use client';

/**
 * Live Tracking Page
 * 
 * Real-time vehicle tracking dashboard with map visualization.
 * 
 * Features:
 * - Live GPS positions from IoT devices, Daleeli, and driver apps
 * - Geofence visualization
 * - Touchpoint tracking
 * - Vehicle status indicators
 * - Anomaly alerts
 * 
 * @module app/transportation/live-tracking
 */

import React, { useState, useEffect } from 'react';
import {
  Truck,
  MapPin,
  Radio,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Navigation2,
  Signal,
  Wifi,
  WifiOff,
  RefreshCw,
  Filter,
  Download,
  Settings,
  ChevronRight,
  Activity,
  Gauge,
  RotateCcw,
} from 'lucide-react';
import LiveTrackingMap from '@/components/transportation/EnhancedTrackingMap';

// ============================================================================
// TYPES
// ============================================================================

interface VehicleStats {
  total: number;
  online: number;
  offline: number;
  moving: number;
  stationary: number;
  anomalies: number;
}

interface Vehicle {
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

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function LiveTrackingPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [stats, setStats] = useState<VehicleStats>({
    total: 0,
    online: 0,
    offline: 0,
    moving: 0,
    stationary: 0,
    anomalies: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [filter, setFilter] = useState<'all' | 'online' | 'offline' | 'anomaly'>('all');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, []);

  // Polling
  useEffect(() => {
    if (!isPolling) return;

    const interval = setInterval(fetchData, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [isPolling]);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/transportation/live-tracking');
      const data = await response.json();

      if (data.vehicles) {
        setVehicles(data.vehicles);
        
        // Calculate stats
        const online = data.vehicles.filter((v: Vehicle) => v.isOnline !== false).length;
        const offline = data.vehicles.length - online;
        const moving = data.vehicles.filter((v: Vehicle) => v.speed > 0).length;
        const anomalies = data.vehicles.filter((v: Vehicle) => v.anomaly?.detected).length;

        setStats({
          total: data.vehicles.length,
          online,
          offline,
          moving,
          stationary: data.vehicles.length - moving,
          anomalies,
        });
      }

      setLastUpdate(new Date());
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      setIsLoading(false);
    }
  };

  const handleVehicleClick = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
  };

  const filteredVehicles = vehicles.filter((v) => {
    switch (filter) {
      case 'online':
        return v.isOnline !== false;
      case 'offline':
        return v.isOnline === false;
      case 'anomaly':
        return v.anomaly?.detected;
      default:
        return true;
    }
  });

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20">
                <Navigation2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Live Vehicle Tracking
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Real-time GPS monitoring across Saudi Arabia & GCC
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Polling status */}
              <button
                onClick={() => setIsPolling(!isPolling)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                  isPolling
                    ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
                    : 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700'
                }`}
              >
                {isPolling ? (
                  <>
                    <Radio className="w-4 h-4 animate-pulse" />
                    <span className="text-sm font-medium">Live</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span className="text-sm font-medium">Paused</span>
                  </>
                )}
              </button>

              {/* Last update */}
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Clock className="w-4 h-4" />
                {lastUpdate.toLocaleTimeString()}
              </div>

              {/* Refresh button */}
              <button
                onClick={fetchData}
                disabled={isLoading}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <RefreshCw className={`w-5 h-5 text-slate-600 dark:text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-6 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <StatCard
            icon={<Truck className="w-5 h-5" />}
            label="Total Vehicles"
            value={stats.total}
            color="blue"
          />
          <StatCard
            icon={<Wifi className="w-5 h-5" />}
            label="Online"
            value={stats.online}
            color="green"
            onClick={() => setFilter('online')}
            active={filter === 'online'}
          />
          <StatCard
            icon={<WifiOff className="w-5 h-5" />}
            label="Offline"
            value={stats.offline}
            color="gray"
            onClick={() => setFilter('offline')}
            active={filter === 'offline'}
          />
          <StatCard
            icon={<Activity className="w-5 h-5" />}
            label="Moving"
            value={stats.moving}
            color="indigo"
          />
          <StatCard
            icon={<MapPin className="w-5 h-5" />}
            label="Stationary"
            value={stats.stationary}
            color="slate"
          />
          <StatCard
            icon={<AlertTriangle className="w-5 h-5" />}
            label="Anomalies"
            value={stats.anomalies}
            color="red"
            onClick={() => setFilter('anomaly')}
            active={filter === 'anomaly'}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Map - Takes 3 columns */}
          <div className="lg:col-span-3">
            <LiveTrackingMap
              vehicles={filteredVehicles}
              height="calc(100vh - 320px)"
              refreshInterval={isPolling ? 30000 : 0}
              onVehicleClick={handleVehicleClick}
            />
          </div>

          {/* Vehicle List - Takes 1 column */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden h-[calc(100vh-320px)] flex flex-col">
              {/* Header */}
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                    Vehicles
                  </h3>
                  <button
                    onClick={() => setFilter('all')}
                    className={`text-xs px-2 py-1 rounded ${
                      filter === 'all'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Show All
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto">
                {filteredVehicles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <Truck className="w-12 h-12 mb-2" />
                    <p className="text-sm">No vehicles found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredVehicles.map((vehicle) => (
                      <VehicleListItem
                        key={vehicle.deviceId}
                        vehicle={vehicle}
                        isSelected={selectedVehicle?.deviceId === vehicle.deviceId}
                        onClick={() => handleVehicleClick(vehicle)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'blue' | 'green' | 'red' | 'gray' | 'indigo' | 'slate';
  onClick?: () => void;
  active?: boolean;
}

function StatCard({ icon, label, value, color, onClick, active }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
    green: 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
    red: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
    gray: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-700',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800',
    slate: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
  };

  return (
    <div
      onClick={onClick}
      className={`
        p-4 rounded-xl border transition-all
        ${colorClasses[color]}
        ${onClick ? 'cursor-pointer hover:shadow-md' : ''}
        ${active ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
      `}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-white/50 dark:bg-black/20">
          {icon}
        </div>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-xs opacity-80">{label}</div>
        </div>
      </div>
    </div>
  );
}

interface VehicleListItemProps {
  vehicle: Vehicle;
  isSelected: boolean;
  onClick: () => void;
}

function VehicleListItem({ vehicle, isSelected, onClick }: VehicleListItemProps) {
  const isOnline = vehicle.isOnline !== false;
  const isMoving = vehicle.speed > 0;
  const hasAnomaly = vehicle.anomaly?.detected;
  const timeAgo = getTimeAgo(new Date(vehicle.timestamp));

  return (
    <div
      onClick={onClick}
      className={`
        px-4 py-3 cursor-pointer transition-all
        ${isSelected
          ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-4 border-transparent'
        }
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Status indicator */}
          <div className={`
            w-3 h-3 rounded-full
            ${hasAnomaly ? 'bg-red-500 animate-pulse' :
              isOnline ? (isMoving ? 'bg-green-500' : 'bg-blue-500') : 'bg-gray-400'}
          `} />
          
          <div>
            <div className="font-medium text-sm text-slate-800 dark:text-slate-200">
              {vehicle.plateNumber || vehicle.vehicleId || vehicle.deviceId}
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-2">
              {vehicle.shipmentId && (
                <span className="text-blue-600 dark:text-blue-400">
                  {vehicle.shipmentId}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Signal className="w-3 h-3" />
                {vehicle.source}
              </span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-1 text-sm">
            {isMoving ? (
              <>
                <Gauge className="w-3 h-3 text-green-600" />
                <span className="font-medium text-green-600">
                  {Math.round(vehicle.speed)} km/h
                </span>
              </>
            ) : (
              <span className="text-slate-400 text-xs">Stationary</span>
            )}
          </div>
          <div className="text-xs text-slate-400">{timeAgo}</div>
        </div>
      </div>

      {hasAnomaly && (
        <div className="mt-2 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
          <AlertTriangle className="w-3 h-3" />
          {vehicle.anomaly?.type || 'Anomaly detected'}
        </div>
      )}
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
