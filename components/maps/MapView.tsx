/**
 * Unified Map View Component
 *
 * Platform-wide map component supporting:
 * - Google Maps
 * - Mapbox
 * - Route visualization
 * - Marker placement
 * - Interactive controls
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { mapsService } from "@/lib/services/maps/mapsService";
import type { Location, RouteResult } from "@/lib/services/maps/mapsService";

interface MapViewProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{
    id: string;
    location: Location;
    label?: string;
    color?: string;
    onClick?: () => void;
  }>;
  route?: RouteResult;
  height?: string;
  interactive?: boolean;
  showControls?: boolean;
}

export default function MapView({
  center,
  zoom = 10,
  markers = [],
  route,
  height = "400px",
  interactive = true,
  showControls = true,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [mapMarkers, setMapMarkers] = useState<any[]>([]);
  const [mapRoute, setMapRoute] = useState<any>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map based on provider
    const initMap = async () => {
      const config = (mapsService as any).config;

      if (config.provider === "google" && (window as any).google) {
        initGoogleMap();
      } else if (config.provider === "mapbox" && (window as any).mapboxgl) {
        initMapboxMap();
      } else {
        // Load map library
        if (config.provider === "google") {
          loadGoogleMaps();
        } else {
          loadMapbox();
        }
      }
    };

    initMap();
  }, []);

  useEffect(() => {
    if (map && center) {
      updateMapCenter(center);
    }
  }, [map, center]);

  useEffect(() => {
    if (map && markers.length > 0) {
      updateMarkers(markers);
    }
  }, [map, markers]);

  useEffect(() => {
    if (map && route) {
      updateRoute(route);
    }
  }, [map, route]);

  const loadGoogleMaps = () => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,directions`;
    script.async = true;
    script.defer = true;
    script.onload = () => initGoogleMap();
    document.head.appendChild(script);
  };

  const loadMapbox = () => {
    const script = document.createElement("script");
    script.src = "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js";
    script.async = true;
    const link = document.createElement("link");
    link.href = "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css";
    link.rel = "stylesheet";
    document.head.appendChild(script);
    document.head.appendChild(link);
    script.onload = () => initMapboxMap();
  };

  const initGoogleMap = () => {
    if (!mapRef.current || !(window as any).google) return;

    const googleMap = new (window as any).google.maps.Map(mapRef.current, {
      center: center || { lat: 24.7136, lng: 46.6753 }, // Default to Riyadh
      zoom,
      mapTypeControl: showControls,
      streetViewControl: showControls,
      fullscreenControl: showControls,
    });

    setMap(googleMap);
  };

  const initMapboxMap = () => {
    if (!mapRef.current || !(window as any).mapboxgl) return;

    const mapboxMap = new (window as any).mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: center ? [center.lng, center.lat] : [46.6753, 24.7136],
      zoom,
    });

    setMap(mapboxMap);
  };

  const updateMapCenter = (newCenter: { lat: number; lng: number }) => {
    if (!map) return;

    const config = (mapsService as any).config;
    if (config.provider === "google") {
      map.setCenter(
        new (window as any).google.maps.LatLng(newCenter.lat, newCenter.lng),
      );
    } else {
      map.setCenter([newCenter.lng, newCenter.lat]);
    }
  };

  const updateMarkers = (newMarkers: MapViewProps["markers"]) => {
    if (!map) return;

    // Clear existing markers
    mapMarkers.forEach((marker) => {
      if (marker.setMap) marker.setMap(null);
      if (marker.remove) marker.remove();
    });

    const config = (mapsService as any).config;
    const newMapMarkers: any[] = [];

    newMarkers.forEach((markerData) => {
      if (!markerData.location.coordinates) return;

      const { lat, lng } = markerData.location.coordinates;

      if (config.provider === "google") {
        const marker = new (window as any).google.maps.Marker({
          position: { lat, lng },
          map,
          label: markerData.label,
          title: markerData.location.address,
        });

        if (markerData.onClick) {
          marker.addListener("click", markerData.onClick);
        }

        newMapMarkers.push(marker);
      } else {
        const el = document.createElement("div");
        el.className = "marker";
        el.style.width = "30px";
        el.style.height = "30px";
        el.style.borderRadius = "50%";
        el.style.backgroundColor = markerData.color || "#3b82f6";
        el.style.border = "2px solid white";
        el.style.cursor = "pointer";

        const marker = new (window as any).mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .addTo(map);

        if (markerData.onClick) {
          el.addEventListener("click", markerData.onClick);
        }

        newMapMarkers.push(marker);
      }
    });

    setMapMarkers(newMapMarkers);
  };

  const updateRoute = (newRoute: RouteResult) => {
    if (!map || !newRoute.polyline) return;

    // Clear existing route
    if (mapRoute) {
      if (mapRoute.setMap) mapRoute.setMap(null);
      if (mapRoute.remove) mapRoute.remove();
    }

    const config = (mapsService as any).config;

    if (config.provider === "google") {
      const directionsService = new (
        window as any
      ).google.maps.DirectionsService();
      const directionsRenderer = new (
        window as any
      ).google.maps.DirectionsRenderer();
      directionsRenderer.setMap(map);

      // Decode polyline and render
      const path = (window as any).google.maps.geometry.encoding.decodePath(
        newRoute.polyline,
      );
      const routePolyline = new (window as any).google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: "#3b82f6",
        strokeOpacity: 1.0,
        strokeWeight: 3,
      });
      routePolyline.setMap(map);
      setMapRoute(routePolyline);
    } else {
      // Mapbox route rendering
      const geojson = JSON.parse(newRoute.polyline);
      if (map.getSource("route")) {
        map.getSource("route").setData(geojson);
      } else {
        map.addLayer({
          id: "route",
          type: "line",
          source: {
            type: "geojson",
            data: geojson,
          },
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#3b82f6",
            "line-width": 3,
          },
        });
      }
    }
  };

  return (
    <div
      className="w-full rounded-lg overflow-hidden border border-gray-300"
      style={{ height }}
    >
      <div ref={mapRef} className="w-full h-full" />
      {!map && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <i className="ri-map-pin-line text-4xl text-gray-400 mb-2"></i>
            <p className="text-gray-500">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
}
