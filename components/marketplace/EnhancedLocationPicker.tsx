/**
 * Enhanced Interactive Location Picker
 * Features: Map integration, geocoding, address autocomplete, coordinate picker
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Search,
  Navigation,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import MapView from "@/components/maps/MapView";
import { mapsService } from "@/lib/services/maps/mapsService";

interface EnhancedLocationPickerProps {
  value?: {
    address?: string;
    city?: string;
    country?: string;
    coordinates?: { lat: number; lng: number };
    postalCode?: string;
  };
  onChange: (location: any) => void;
  label?: string;
  required?: boolean;
  multiple?: boolean;
}

export default function EnhancedLocationPicker({
  value,
  onChange,
  label = "Location",
  required = false,
  multiple = false,
}: EnhancedLocationPickerProps) {
  const [showMap, setShowMap] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(value?.coordinates || null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(
    value?.coordinates || { lat: 24.7136, lng: 46.6753 }, // Default to Riyadh
  );
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (value?.coordinates) {
      setCurrentLocation(value.coordinates);
      setMapCenter(value.coordinates);
    }
  }, [value]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Use maps service for geocoding
      const results = await mapsService.geocode(query);
      setSearchResults(results.slice(0, 5));
    } catch (error) {
      console.error("Geocoding error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(query);
    }, 300);
  };

  const handleSelectResult = async (result: any) => {
    setSearchQuery("");
    setSearchResults([]);

    const location = {
      address: result.address || result.formatted_address || "",
      city: result.city || "",
      country: result.country || "",
      coordinates: result.coordinates || { lat: result.lat, lng: result.lng },
      postalCode: result.postalCode || result.postal_code || "",
    };

    setCurrentLocation(location.coordinates);
    setMapCenter(location.coordinates);
    onChange(location);
  };

  const handleMapClick = async (lat: number, lng: number) => {
    try {
      // Reverse geocode to get address
      const address = await mapsService.reverseGeocode({ lat, lng });
      const location = {
        address: address.address || "",
        city: address.city || "",
        country: address.country || "",
        coordinates: { lat, lng },
        postalCode: address.postalCode || "",
      };

      setCurrentLocation({ lat, lng });
      onChange(location);
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      // Still update coordinates even if reverse geocoding fails
      const location = {
        ...value,
        coordinates: { lat, lng },
      };
      setCurrentLocation({ lat, lng });
      onChange(location);
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          handleMapClick(latitude, longitude);
        },
        (error) => {
          console.error("Geolocation error:", error);
          alert(
            "Unable to get your current location. Please select manually on the map.",
          );
        },
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
          {label} {required && <span className="text-red-500">*</span>}
        </label>

        {/* Address Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery || value?.address || ""}
            onChange={handleSearchChange}
            onFocus={() => setShowMap(true)}
            className="w-full pl-10 pr-10 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500"
            placeholder="Search address or click on map..."
          />
          {value?.address && (
            <button
              onClick={() => {
                onChange({});
                setSearchQuery("");
                setCurrentLocation(null);
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-red-500"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Results */}
        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            >
              {searchResults.map((result, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectResult(result)}
                  className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-b-0"
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 mt-1 text-blue-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {result.address || result.formatted_address}
                      </p>
                      {(result.city || result.country) && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {[result.city, result.country]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Current Location Display */}
        {value?.address && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                {value.address}
              </p>
              {value.coordinates && (
                <p className="text-xs text-green-700 dark:text-green-300">
                  {value.coordinates.lat.toFixed(6)},{" "}
                  {value.coordinates.lng.toFixed(6)}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Map Picker */}
      <AnimatePresence>
        {showMap && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden"
          >
            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-500" />
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  Select Location on Map
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleGetCurrentLocation}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Navigation className="w-4 h-4" />
                  Use My Location
                </button>
                <button
                  onClick={() => setShowMap(false)}
                  className="px-3 py-1.5 text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
                >
                  Hide Map
                </button>
              </div>
            </div>
            <div className="h-96 relative">
              <MapView
                center={mapCenter}
                zoom={currentLocation ? 15 : 10}
                markers={
                  currentLocation
                    ? [
                        {
                          id: "selected",
                          location: currentLocation,
                          label: "Selected Location",
                          color: "#3b82f6",
                        },
                      ]
                    : []
                }
                interactive={true}
                showControls={true}
              />
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Click on the map to select location
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Coordinate Input */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1 text-slate-600 dark:text-slate-400">
            Latitude
          </label>
          <input
            type="number"
            step="any"
            value={value?.coordinates?.lat || ""}
            onChange={(e) => {
              const lat = parseFloat(e.target.value);
              if (!isNaN(lat)) {
                onChange({
                  ...value,
                  coordinates: { lat, lng: value?.coordinates?.lng || 0 },
                });
                setMapCenter({ lat, lng: value?.coordinates?.lng || 0 });
              }
            }}
            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            placeholder="24.7136"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1 text-slate-600 dark:text-slate-400">
            Longitude
          </label>
          <input
            type="number"
            step="any"
            value={value?.coordinates?.lng || ""}
            onChange={(e) => {
              const lng = parseFloat(e.target.value);
              if (!isNaN(lng)) {
                onChange({
                  ...value,
                  coordinates: { lat: value?.coordinates?.lat || 0, lng },
                });
                setMapCenter({ lat: value?.coordinates?.lat || 0, lng });
              }
            }}
            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            placeholder="46.6753"
          />
        </div>
      </div>

      {/* Additional Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
            City
          </label>
          <input
            type="text"
            value={value?.city || ""}
            onChange={(e) => onChange({ ...value, city: e.target.value })}
            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            placeholder="City name..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
            Country
          </label>
          <input
            type="text"
            value={value?.country || ""}
            onChange={(e) => onChange({ ...value, country: e.target.value })}
            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            placeholder="Country name..."
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
          Postal Code
        </label>
        <input
          type="text"
          value={value?.postalCode || ""}
          onChange={(e) => onChange({ ...value, postalCode: e.target.value })}
          className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
          placeholder="e.g., 11564"
        />
      </div>
    </div>
  );
}
