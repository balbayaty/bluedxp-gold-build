'use client';

/**
 * Historical Playback Page
 * 
 * View and replay past shipment routes with full visualization.
 * 
 * @module app/transportation/history
 */

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  Clock,
  Truck,
  MapPin,
  Calendar,
  Search,
  ChevronRight,
  Package,
  User,
  Navigation,
} from 'lucide-react';

// Dynamic import to avoid SSR issues with Leaflet
const HistoricalPlayback = dynamic(
  () => import('@/components/transportation/HistoricalPlayback'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[600px] bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
        <div className="text-slate-500">Loading map...</div>
      </div>
    ),
  }
);

interface RouteListItem {
  shipmentId: string;
  shipmentNumber: string;
  plateNumber: string;
  driverName: string;
  origin: string;
  destination: string;
  startTime: string;
  endTime: string;
  status: string;
}

export default function HistoryPage() {
  const [routes, setRoutes] = useState<RouteListItem[]>([]);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch available routes
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await fetch('/api/transportation/history');
        const data = await response.json();
        setRoutes(data.routes || []);
      } catch (error) {
        console.error('Error fetching routes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoutes();
  }, []);

  // Filter routes by search
  const filteredRoutes = routes.filter((route) => {
    const query = searchQuery.toLowerCase();
    return (
      route.shipmentNumber.toLowerCase().includes(query) ||
      route.plateNumber.toLowerCase().includes(query) ||
      route.driverName.toLowerCase().includes(query) ||
      route.origin.toLowerCase().includes(query) ||
      route.destination.toLowerCase().includes(query)
    );
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'CANCELLED':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Historical Playback
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Replay past shipment routes with full visualization
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search routes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Route List */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                <h2 className="font-semibold text-slate-800 dark:text-slate-200">
                  Available Routes
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {filteredRoutes.length} routes found
                </p>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[calc(100vh-300px)] overflow-y-auto">
                {isLoading ? (
                  <div className="p-8 text-center text-slate-500">
                    Loading routes...
                  </div>
                ) : filteredRoutes.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    No routes found
                  </div>
                ) : (
                  filteredRoutes.map((route) => (
                    <button
                      key={route.shipmentId}
                      onClick={() => setSelectedShipmentId(route.shipmentId)}
                      className={`w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                        selectedShipmentId === route.shipmentId
                          ? 'bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {route.shipmentNumber}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(route.status)}`}>
                          {route.status}
                        </span>
                      </div>

                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <Truck className="w-3.5 h-3.5" />
                          <span>{route.plateNumber}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <User className="w-3.5 h-3.5" />
                          <span>{route.driverName}</span>
                        </div>

                        <div className="flex items-start gap-2 text-slate-500 dark:text-slate-500">
                          <Navigation className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="truncate">{route.origin}</div>
                            <div className="flex items-center gap-1">
                              <ChevronRight className="w-3 h-3" />
                              <span className="truncate">{route.destination}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-xs">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(route.startTime)}</span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Map / Playback */}
          <div className="lg:col-span-2">
            {selectedShipmentId ? (
              <HistoricalPlayback
                shipmentId={selectedShipmentId}
                height="calc(100vh - 220px)"
                onPositionChange={(point, index) => {
                  // Could show current position info in sidebar
                }}
                onEventReached={(event) => {
                  // Could show event notification
                  console.log('Event reached:', event);
                }}
              />
            ) : (
              <div className="h-[calc(100vh-220px)] bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Select a Route
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                    Choose a shipment from the list to view and replay its historical route
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
