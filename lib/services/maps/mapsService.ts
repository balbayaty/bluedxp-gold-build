/**
 * Unified Maps Service
 *
 * Platform-wide maps integration supporting:
 * - Google Maps API
 * - Mapbox API
 * - Route optimization
 * - Geocoding
 * - Reverse geocoding
 * - Distance calculation
 * - Real-time traffic
 * - Places API
 *
 * Used across: Load Design, Transportation, Routes, Tracking, etc.
 */

export interface MapsConfig {
  provider: "google" | "mapbox";
  apiKey?: string;
  enableTraffic: boolean;
  enablePlaces: boolean;
  enableGeocoding: boolean;
}

export interface Location {
  address: string;
  city: string;
  country: string;
  coordinates?: { lat: number; lng: number };
  postalCode?: string;
}

export interface RouteRequest {
  origin: Location;
  destination: Location;
  waypoints?: Location[];
  optimize?: boolean;
  avoid?: ("tolls" | "highways" | "ferries" | "indoor")[];
  mode?: "driving" | "walking" | "bicycling" | "transit";
}

export interface RouteResult {
  distance: number; // km
  duration: number; // minutes
  durationInTraffic?: number; // minutes
  optimized: boolean;
  waypoints?: Array<{
    location: Location;
    stopOrder: number;
  }>;
  polyline?: string;
  steps?: Array<{
    instruction: string;
    distance: number;
    duration: number;
    coordinates: { lat: number; lng: number };
  }>;
  bounds?: {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };
  warnings?: string[];
}

export interface GeocodeResult {
  location: Location;
  placeId?: string;
  formattedAddress: string;
  addressComponents: Array<{
    longName: string;
    shortName: string;
    types: string[];
  }>;
}

export interface TrafficInfo {
  currentTraffic: "LIGHT" | "MODERATE" | "HEAVY" | "SEVERE";
  delayMinutes: number;
  speed: number; // km/h
  congestionLevel: number; // 0-100
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  location: { lat: number; lng: number };
  address: string;
  types: string[];
  rating?: number;
  photos?: string[];
}

/**
 * Unified Maps Service
 */
export class MapsService {
  private config: MapsConfig;
  private googleMapsApiKey?: string;
  private mapboxApiKey?: string;

  constructor() {
    this.googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    this.mapboxApiKey = process.env.NEXT_PUBLIC_MAPBOX_API_KEY;

    // Determine provider
    const provider = this.googleMapsApiKey
      ? "google"
      : this.mapboxApiKey
        ? "mapbox"
        : "google";

    this.config = {
      provider,
      apiKey: provider === "google" ? this.googleMapsApiKey : this.mapboxApiKey,
      enableTraffic: true,
      enablePlaces: true,
      enableGeocoding: true,
    };
  }

  /**
   * Get route between locations
   */
  async getRoute(request: RouteRequest): Promise<RouteResult> {
    if (this.config.provider === "google" && this.googleMapsApiKey) {
      return this.getRouteGoogleMaps(request);
    } else if (this.config.provider === "mapbox" && this.mapboxApiKey) {
      return this.getRouteMapbox(request);
    } else {
      return this.getRouteFallback(request);
    }
  }

  /**
   * Optimize route with multiple waypoints
   */
  async optimizeRoute(request: RouteRequest): Promise<RouteResult> {
    const optimizedRequest = { ...request, optimize: true };
    return this.getRoute(optimizedRequest);
  }

  /**
   * Geocode address to coordinates
   */
  async geocode(address: string): Promise<GeocodeResult | null> {
    if (this.config.provider === "google" && this.googleMapsApiKey) {
      return this.geocodeGoogleMaps(address);
    } else if (this.config.provider === "mapbox" && this.mapboxApiKey) {
      return this.geocodeMapbox(address);
    } else {
      return this.geocodeFallback(address);
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(coordinates: {
    lat: number;
    lng: number;
  }): Promise<GeocodeResult | null> {
    if (this.config.provider === "google" && this.googleMapsApiKey) {
      return this.reverseGeocodeGoogleMaps(coordinates);
    } else if (this.config.provider === "mapbox" && this.mapboxApiKey) {
      return this.reverseGeocodeMapbox(coordinates);
    } else {
      return this.reverseGeocodeFallback(coordinates);
    }
  }

  /**
   * Get real-time traffic information
   */
  async getTrafficInfo(route: RouteResult): Promise<TrafficInfo> {
    if (this.config.provider === "google" && this.googleMapsApiKey) {
      return this.getTrafficInfoGoogleMaps(route);
    } else if (this.config.provider === "mapbox" && this.mapboxApiKey) {
      return this.getTrafficInfoMapbox(route);
    } else {
      return {
        currentTraffic: "MODERATE",
        delayMinutes: 0,
        speed: 80,
        congestionLevel: 50,
      };
    }
  }

  /**
   * Search places
   */
  async searchPlaces(
    query: string,
    location?: { lat: number; lng: number },
  ): Promise<PlaceDetails[]> {
    if (this.config.provider === "google" && this.googleMapsApiKey) {
      return this.searchPlacesGoogleMaps(query, location);
    } else if (this.config.provider === "mapbox" && this.mapboxApiKey) {
      return this.searchPlacesMapbox(query, location);
    } else {
      return [];
    }
  }

  /**
   * Calculate distance between two points
   */
  calculateDistance(
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

  // ============================================================================
  // GOOGLE MAPS IMPLEMENTATIONS
  // ============================================================================

  private async getRouteGoogleMaps(
    request: RouteRequest,
  ): Promise<RouteResult> {
    if (!this.googleMapsApiKey) {
      return this.getRouteFallback(request);
    }

    try {
      // Build waypoints string
      let waypoints = "";
      if (request.waypoints && request.waypoints.length > 0) {
        const waypointCoords = request.waypoints
          .map((wp) =>
            wp.coordinates
              ? `${wp.coordinates.lat},${wp.coordinates.lng}`
              : wp.address,
          )
          .join("|");
        waypoints = `&waypoints=${request.optimize ? "optimize:true|" : ""}${waypointCoords}`;
      }

      // Build avoid string
      let avoid = "";
      if (request.avoid && request.avoid.length > 0) {
        avoid = `&avoid=${request.avoid.join("|")}`;
      }

      const origin = request.origin.coordinates
        ? `${request.origin.coordinates.lat},${request.origin.coordinates.lng}`
        : encodeURIComponent(request.origin.address);
      const destination = request.destination.coordinates
        ? `${request.destination.coordinates.lat},${request.destination.coordinates.lng}`
        : encodeURIComponent(request.destination.address);

      const mode = request.mode || "driving";
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}${waypoints}${avoid}&mode=${mode}&key=${this.googleMapsApiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK" && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];

        return {
          distance: leg.distance.value / 1000, // Convert to km
          duration: leg.duration.value / 60, // Convert to minutes
          durationInTraffic: leg.duration_in_traffic?.value / 60,
          optimized: request.optimize || false,
          polyline: route.overview_polyline.points,
          steps: leg.steps.map((step: any) => ({
            instruction: step.html_instructions,
            distance: step.distance.value / 1000,
            duration: step.duration.value / 60,
            coordinates: {
              lat: step.start_location.lat,
              lng: step.start_location.lng,
            },
          })),
          bounds: route.bounds,
        };
      }

      return this.getRouteFallback(request);
    } catch (error) {
      console.error("Google Maps API error:", error);
      return this.getRouteFallback(request);
    }
  }

  private async geocodeGoogleMaps(
    address: string,
  ): Promise<GeocodeResult | null> {
    if (!this.googleMapsApiKey) {
      return this.geocodeFallback(address);
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.googleMapsApiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK" && data.results && data.results.length > 0) {
        const result = data.results[0];
        const location = result.geometry.location;

        return {
          location: {
            address: result.formatted_address,
            city: this.extractCity(result.address_components),
            country: this.extractCountry(result.address_components),
            coordinates: { lat: location.lat, lng: location.lng },
            postalCode: this.extractPostalCode(result.address_components),
          },
          placeId: result.place_id,
          formattedAddress: result.formatted_address,
          addressComponents: result.address_components.map((comp: any) => ({
            longName: comp.long_name,
            shortName: comp.short_name,
            types: comp.types,
          })),
        };
      }

      return null;
    } catch (error) {
      console.error("Google Maps Geocoding error:", error);
      return this.geocodeFallback(address);
    }
  }

  private async reverseGeocodeGoogleMaps(coordinates: {
    lat: number;
    lng: number;
  }): Promise<GeocodeResult | null> {
    if (!this.googleMapsApiKey) {
      return this.reverseGeocodeFallback(coordinates);
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinates.lat},${coordinates.lng}&key=${this.googleMapsApiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK" && data.results && data.results.length > 0) {
        const result = data.results[0];

        return {
          location: {
            address: result.formatted_address,
            city: this.extractCity(result.address_components),
            country: this.extractCountry(result.address_components),
            coordinates,
            postalCode: this.extractPostalCode(result.address_components),
          },
          placeId: result.place_id,
          formattedAddress: result.formatted_address,
          addressComponents: result.address_components.map((comp: any) => ({
            longName: comp.long_name,
            shortName: comp.short_name,
            types: comp.types,
          })),
        };
      }

      return null;
    } catch (error) {
      console.error("Google Maps Reverse Geocoding error:", error);
      return this.reverseGeocodeFallback(coordinates);
    }
  }

  private async getTrafficInfoGoogleMaps(
    route: RouteResult,
  ): Promise<TrafficInfo> {
    // Traffic info is included in route response
    if (route.durationInTraffic && route.duration) {
      const delayMinutes = route.durationInTraffic - route.duration;
      const congestionLevel = Math.min(
        100,
        (delayMinutes / route.duration) * 100,
      );

      return {
        currentTraffic:
          delayMinutes < 5
            ? "LIGHT"
            : delayMinutes < 15
              ? "MODERATE"
              : delayMinutes < 30
                ? "HEAVY"
                : "SEVERE",
        delayMinutes: Math.max(0, delayMinutes),
        speed: route.distance / (route.durationInTraffic / 60),
        congestionLevel,
      };
    }

    return {
      currentTraffic: "MODERATE",
      delayMinutes: 0,
      speed: 80,
      congestionLevel: 50,
    };
  }

  private async searchPlacesGoogleMaps(
    query: string,
    location?: { lat: number; lng: number },
  ): Promise<PlaceDetails[]> {
    if (!this.googleMapsApiKey) {
      return [];
    }

    try {
      let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${this.googleMapsApiKey}`;
      if (location) {
        url += `&location=${location.lat},${location.lng}&radius=50000`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK" && data.results) {
        return data.results.map((place: any) => ({
          placeId: place.place_id,
          name: place.name,
          location: place.geometry.location,
          address: place.formatted_address,
          types: place.types,
          rating: place.rating,
        }));
      }

      return [];
    } catch (error) {
      console.error("Google Maps Places search error:", error);
      return [];
    }
  }

  // ============================================================================
  // MAPBOX IMPLEMENTATIONS
  // ============================================================================

  private async getRouteMapbox(request: RouteRequest): Promise<RouteResult> {
    if (!this.mapboxApiKey) {
      return this.getRouteFallback(request);
    }

    try {
      // Build coordinates string
      const coords: string[] = [];

      if (request.origin.coordinates) {
        coords.push(
          `${request.origin.coordinates.lng},${request.origin.coordinates.lat}`,
        );
      } else {
        const geocoded = await this.geocode(request.origin.address);
        if (geocoded?.location.coordinates) {
          coords.push(
            `${geocoded.location.coordinates.lng},${geocoded.location.coordinates.lat}`,
          );
        }
      }

      if (request.waypoints) {
        for (const waypoint of request.waypoints) {
          if (waypoint.coordinates) {
            coords.push(
              `${waypoint.coordinates.lng},${waypoint.coordinates.lat}`,
            );
          } else {
            const geocoded = await this.geocode(waypoint.address);
            if (geocoded?.location.coordinates) {
              coords.push(
                `${geocoded.location.coordinates.lng},${geocoded.location.coordinates.lat}`,
              );
            }
          }
        }
      }

      if (request.destination.coordinates) {
        coords.push(
          `${request.destination.coordinates.lng},${request.destination.coordinates.lat}`,
        );
      } else {
        const geocoded = await this.geocode(request.destination.address);
        if (geocoded?.location.coordinates) {
          coords.push(
            `${geocoded.location.coordinates.lng},${geocoded.location.coordinates.lat}`,
          );
        }
      }

      const profile =
        request.mode === "walking"
          ? "walking"
          : request.mode === "bicycling"
            ? "cycling"
            : "driving";
      const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coords.join(";")}?access_token=${this.mapboxApiKey}&geometries=geojson`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.code === "Ok" && data.routes && data.routes.length > 0) {
        const route = data.routes[0];

        return {
          distance: route.distance / 1000, // Convert to km
          duration: route.duration / 60, // Convert to minutes
          optimized: request.optimize || false,
          polyline: JSON.stringify(route.geometry),
          steps: route.legs.flatMap((leg: any) =>
            leg.steps.map((step: any) => ({
              instruction: step.maneuver.instruction,
              distance: step.distance / 1000,
              duration: step.duration / 60,
              coordinates: {
                lat: step.maneuver.location[1],
                lng: step.maneuver.location[0],
              },
            })),
          ),
        };
      }

      return this.getRouteFallback(request);
    } catch (error) {
      console.error("Mapbox API error:", error);
      return this.getRouteFallback(request);
    }
  }

  private async geocodeMapbox(address: string): Promise<GeocodeResult | null> {
    if (!this.mapboxApiKey) {
      return this.geocodeFallback(address);
    }

    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${this.mapboxApiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const [lng, lat] = feature.center;

        return {
          location: {
            address: feature.place_name,
            city: this.extractCityFromMapbox(feature),
            country: this.extractCountryFromMapbox(feature),
            coordinates: { lat, lng },
            postalCode: this.extractPostalCodeFromMapbox(feature),
          },
          placeId: feature.id,
          formattedAddress: feature.place_name,
          addressComponents:
            feature.context?.map((ctx: any) => ({
              longName: ctx.text,
              shortName: ctx.short_code || ctx.text,
              types: [ctx.id.split(".")[0]],
            })) || [],
        };
      }

      return null;
    } catch (error) {
      console.error("Mapbox Geocoding error:", error);
      return this.geocodeFallback(address);
    }
  }

  private async reverseGeocodeMapbox(coordinates: {
    lat: number;
    lng: number;
  }): Promise<GeocodeResult | null> {
    if (!this.mapboxApiKey) {
      return this.reverseGeocodeFallback(coordinates);
    }

    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates.lng},${coordinates.lat}.json?access_token=${this.mapboxApiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];

        return {
          location: {
            address: feature.place_name,
            city: this.extractCityFromMapbox(feature),
            country: this.extractCountryFromMapbox(feature),
            coordinates,
            postalCode: this.extractPostalCodeFromMapbox(feature),
          },
          placeId: feature.id,
          formattedAddress: feature.place_name,
          addressComponents:
            feature.context?.map((ctx: any) => ({
              longName: ctx.text,
              shortName: ctx.short_code || ctx.text,
              types: [ctx.id.split(".")[0]],
            })) || [],
        };
      }

      return null;
    } catch (error) {
      console.error("Mapbox Reverse Geocoding error:", error);
      return this.reverseGeocodeFallback(coordinates);
    }
  }

  private async getTrafficInfoMapbox(route: RouteResult): Promise<TrafficInfo> {
    // Mapbox doesn't provide traffic in free tier, use estimated
    return {
      currentTraffic: "MODERATE",
      delayMinutes: 0,
      speed: route.distance / (route.duration / 60),
      congestionLevel: 50,
    };
  }

  private async searchPlacesMapbox(
    query: string,
    location?: { lat: number; lng: number },
  ): Promise<PlaceDetails[]> {
    if (!this.mapboxApiKey) {
      return [];
    }

    try {
      let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${this.mapboxApiKey}`;
      if (location) {
        url += `&proximity=${location.lng},${location.lat}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.features) {
        return data.features.map((feature: any) => {
          const [lng, lat] = feature.center;
          return {
            placeId: feature.id,
            name: feature.text,
            location: { lat, lng },
            address: feature.place_name,
            types: feature.properties?.category
              ? [feature.properties.category]
              : [],
          };
        });
      }

      return [];
    } catch (error) {
      console.error("Mapbox Places search error:", error);
      return [];
    }
  }

  // ============================================================================
  // FALLBACK IMPLEMENTATIONS
  // ============================================================================

  private async getRouteFallback(request: RouteRequest): Promise<RouteResult> {
    let distance = 0;
    let duration = 0;

    if (request.origin.coordinates && request.destination.coordinates) {
      distance = this.calculateDistance(
        request.origin.coordinates,
        request.destination.coordinates,
      );
    } else {
      distance = 100; // Default estimate
    }

    // Add waypoint distances
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

    // Estimate duration (80 km/h average)
    duration = (distance / 80) * 60; // minutes

    return {
      distance,
      duration,
      optimized: false,
    };
  }

  private async geocodeFallback(
    address: string,
  ): Promise<GeocodeResult | null> {
    // Fallback: return address without coordinates
    return {
      location: {
        address,
        city: "",
        country: "",
      },
      formattedAddress: address,
      addressComponents: [],
    };
  }

  private async reverseGeocodeFallback(coordinates: {
    lat: number;
    lng: number;
  }): Promise<GeocodeResult | null> {
    return {
      location: {
        address: `${coordinates.lat}, ${coordinates.lng}`,
        city: "",
        country: "",
        coordinates,
      },
      formattedAddress: `${coordinates.lat}, ${coordinates.lng}`,
      addressComponents: [],
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  private extractCity(components: any[]): string {
    const city = components.find((c) => c.types.includes("locality"));
    return city?.long_name || "";
  }

  private extractCountry(components: any[]): string {
    const country = components.find((c) => c.types.includes("country"));
    return country?.long_name || "";
  }

  private extractPostalCode(components: any[]): string {
    const postal = components.find((c) => c.types.includes("postal_code"));
    return postal?.long_name || "";
  }

  private extractCityFromMapbox(feature: any): string {
    const city = feature.context?.find((ctx: any) =>
      ctx.id.startsWith("place."),
    );
    return city?.text || "";
  }

  private extractCountryFromMapbox(feature: any): string {
    const country = feature.context?.find((ctx: any) =>
      ctx.id.startsWith("country."),
    );
    return country?.text || "";
  }

  private extractPostalCodeFromMapbox(feature: any): string {
    const postal = feature.context?.find((ctx: any) =>
      ctx.id.startsWith("postcode."),
    );
    return postal?.text || "";
  }
}

export const mapsService = new MapsService();
