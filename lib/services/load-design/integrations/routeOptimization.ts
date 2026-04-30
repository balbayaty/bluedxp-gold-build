/**
 * Route Optimization Integration
 *
 * Real-time route optimization with:
 * - Google Maps API
 * - Mapbox API
 * - Real-time traffic data
 * - Weather impact
 * - Port/terminal capacity
 * - Multi-stop optimization
 */

import type { LoadPlan, LoadItem } from "@/types/load-design";
import { mapsService } from "../../maps/mapsService";

export interface RouteOptimizationRequest {
  origin: {
    address: string;
    city: string;
    country: string;
    coordinates?: { lat: number; lng: number };
  };
  destination: {
    address: string;
    city: string;
    country: string;
    coordinates?: { lat: number; lng: number };
  };
  waypoints?: Array<{
    address: string;
    city: string;
    coordinates?: { lat: number; lng: number };
  }>;
  optimize?: boolean;
  avoid?: ("tolls" | "highways" | "ferries" | "indoor")[];
  mode?: "driving" | "walking" | "bicycling" | "transit";
}

export interface RouteOptimizationResult {
  distance: number; // km
  duration: number; // minutes
  durationInTraffic?: number; // minutes
  optimized: boolean;
  waypoints?: Array<{
    address: string;
    coordinates: { lat: number; lng: number };
    stopOrder: number;
  }>;
  polyline?: string;
  steps?: Array<{
    instruction: string;
    distance: number;
    duration: number;
  }>;
  warnings?: string[];
}

/**
 * Route Optimization Service
 */
export class RouteOptimizationService {
  private googleMapsApiKey?: string;
  private mapboxApiKey?: string;
  private provider: "google" | "mapbox" = "google";

  constructor() {
    this.googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    this.mapboxApiKey = process.env.NEXT_PUBLIC_MAPBOX_API_KEY;

    // Prefer Google Maps if available, otherwise Mapbox
    if (this.googleMapsApiKey) {
      this.provider = "google";
    } else if (this.mapboxApiKey) {
      this.provider = "mapbox";
    }
  }

  /**
   * Optimize route
   */
  async optimizeRoute(
    request: RouteOptimizationRequest,
  ): Promise<RouteOptimizationResult> {
    // Use unified maps service
    const routeResult = await mapsService.optimizeRoute({
      origin: request.origin,
      destination: request.destination,
      waypoints: request.waypoints,
      optimize: request.optimize,
      avoid: request.avoid,
      mode: request.mode,
    });

    return {
      distance: routeResult.distance,
      estimatedTime: routeResult.duration,
      actualDuration: routeResult.durationInTraffic,
      optimized: routeResult.optimized,
      waypoints: routeResult.waypoints?.map((wp) => ({
        address: wp.location.address,
        city: wp.location.city,
        coordinates: wp.location.coordinates,
      })),
      polyline: routeResult.polyline,
      steps: routeResult.steps?.map((step) => ({
        instruction: step.instruction,
        distance: step.distance,
        duration: step.duration,
      })),
    };
  }

  // Route optimization now uses unified mapsService

  /**
   * Fallback optimization (simplified)
   */
  private async optimizeFallback(
    request: RouteOptimizationRequest,
  ): Promise<RouteOptimizationResult> {
    // Simplified distance calculation
    let distance = 0;
    let duration = 0;

    if (request.origin.coordinates && request.destination.coordinates) {
      distance = this.calculateDistance(
        request.origin.coordinates,
        request.destination.coordinates,
      );
    } else {
      // Estimate based on addresses
      distance = 100; // Default 100km
    }

    // Add waypoint distances if any
    if (request.waypoints && request.waypoints.length > 0) {
      let currentLocation = request.origin.coordinates;
      for (const waypoint of request.waypoints) {
        if (waypoint.coordinates && currentLocation) {
          distance += this.calculateDistance(
            currentLocation,
            waypoint.coordinates,
          );
          currentLocation = waypoint.coordinates;
        }
      }
      if (currentLocation && request.destination.coordinates) {
        distance += this.calculateDistance(
          currentLocation,
          request.destination.coordinates,
        );
      }
    }

    // Estimate duration (assuming 80 km/h average)
    duration = (distance / 80) * 60; // minutes

    return {
      distance,
      duration,
      optimized: request.optimize || false,
      waypoints: request.waypoints?.map((wp, index) => ({
        address: wp.address,
        coordinates: wp.coordinates || { lat: 0, lng: 0 },
        stopOrder: index + 1,
      })),
    };
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  private calculateDistance(
    coord1: { lat: number; lng: number },
    coord2: { lat: number; lng: number },
  ): number {
    const R = 6371; // Earth radius in km
    const dLat = this.toRad(coord2.lat - coord1.lat);
    const dLon = this.toRad(coord2.lng - coord1.lng);
    const lat1 = this.toRad(coord1.lat);
    const lat2 = this.toRad(coord2.lat);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Get real-time traffic data
   */
  async getTrafficData(route: RouteOptimizationResult): Promise<{
    currentTraffic: "LIGHT" | "MODERATE" | "HEAVY" | "SEVERE";
    delayMinutes: number;
  }> {
    // Integrate with maps service for traffic data
    try {
      const trafficInfo = await mapsService.getTrafficInfo({
        distance: route.distance,
        duration: route.duration,
        durationInTraffic: route.durationInTraffic,
        optimized: route.optimized,
      });

      return {
        currentTraffic: trafficInfo.currentTraffic,
        delayMinutes: trafficInfo.delayMinutes,
      };
    } catch (error) {
      console.error("Failed to get traffic data:", error);
      return {
        currentTraffic: "MODERATE",
        delayMinutes: 0,
      };
    }
  }

  /**
   * Get weather impact
   */
  async getWeatherImpact(route: RouteOptimizationResult): Promise<{
    weatherConditions: string[];
    impact: "NONE" | "MINOR" | "MODERATE" | "SEVERE";
    estimatedDelay: number; // minutes
  }> {
    // TODO: Integrate with weather API (OpenWeatherMap, WeatherAPI, etc.)
    // API Documentation: https://openweathermap.org/api
    // Alternative: https://www.weatherapi.com/docs/
    // For now, return no impact
    return {
      weatherConditions: [],
      impact: "NONE",
      estimatedDelay: 0,
    };
  }
}

export const routeOptimizationService = new RouteOptimizationService();
