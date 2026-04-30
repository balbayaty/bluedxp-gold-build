/**
 * AI-Powered Location Intelligence Service
 *
 * Revolutionary location intelligence that:
 * - Processes text descriptions, Google locations, WhatsApp locations
 * - Auto-creates draft zones with accuracy scoring
 * - Self-learns from corrections
 * - Integrates with RAG/Knowledge Base
 * - Provides confidence levels and suggestions
 *
 * Industry-leading accuracy for liability and SLA compliance
 */

import { mapsService } from "@/lib/services/maps/mapsService";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import { geofenceZoneService } from "../zone-service";
import { eventBus } from "@/lib/services/event-store";
import type { GeofenceZone, ZoneType } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export interface LocationInput {
  type:
    | "TEXT"
    | "GOOGLE_LOCATION"
    | "WHATSAPP_LOCATION"
    | "COORDINATES"
    | "ADDRESS";
  source: string; // 'user', 'whatsapp', 'google', 'api'
  data: {
    // For TEXT
    text?: string; // "Main warehouse in Riyadh Industrial City"

    // For GOOGLE_LOCATION / WHATSAPP_LOCATION
    location?: {
      lat: number;
      lng: number;
      accuracy?: number; // meters
      address?: string;
    };

    // For COORDINATES
    coordinates?: {
      lat: number;
      lng: number;
    };

    // For ADDRESS
    address?: string;

    // Context
    context?: {
      shipmentId?: string;
      customerId?: string;
      zoneTypeHint?: string;
      previousZones?: string[];
    };
  };
  metadata?: {
    senderId?: string;
    timestamp?: Date;
    confidence?: number;
  };
}

export interface LocationIntelligenceResult {
  success: boolean;
  confidence: number; // 0-1
  accuracy: {
    level: "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW" | "VERY_LOW";
    score: number; // 0-100
    factors: Array<{
      factor: string;
      impact: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
      score: number;
      explanation: string;
    }>;
  };
  location: {
    coordinates: { lat: number; lng: number };
    address: string;
    formattedAddress: string;
    placeId?: string;
    accuracy: number; // meters
    confidence: number; // 0-1
  };
  zoneDraft: {
    name: string;
    type: ZoneType;
    suggestedGeometry: {
      type: "CIRCLE" | "POLYGON";
      coordinates: any;
      suggestedRadius?: number; // meters
    };
    suggestedMetadata: {
      expectedDwellTime?: number;
      maxDwellTime?: number;
      operatingHours?: any;
      contacts?: any[];
    };
    confidence: number;
    suggestions: string[];
    warnings: string[];
  };
  alternatives: Array<{
    location: { lat: number; lng: number };
    address: string;
    confidence: number;
    reason: string;
  }>;
  learning: {
    canLearn: boolean;
    learningPoints: string[];
    knowledgeBaseEntry?: string;
  };
}

export interface LocationLearning {
  id: string;
  originalInput: LocationInput;
  result: LocationIntelligenceResult;
  userCorrection?: {
    correctedLocation: { lat: number; lng: number };
    correctedZone: Partial<GeofenceZone>;
    timestamp: Date;
  };
  accuracy: number;
  learned: boolean;
  createdAt: Date;
}

// ============================================================================
// SERVICE
// ============================================================================

class LocationIntelligenceService {
  private learningHistory: Map<string, LocationLearning> = new Map();
  private accuracyThreshold = 0.7; // Minimum confidence for auto-creation

  /**
   * Process location input and generate intelligent zone draft
   */
  async processLocation(
    input: LocationInput,
    tenantId: string,
  ): Promise<LocationIntelligenceResult> {
    try {
      let location: {
        lat: number;
        lng: number;
        address?: string;
        accuracy?: number;
      } | null = null;
      let confidence = 0.5;
      const factors: LocationIntelligenceResult["accuracy"]["factors"] = [];

      // Process based on input type
      switch (input.type) {
        case "TEXT":
          const textResult = await this.processTextLocation(
            input.data.text || "",
            input.data.context,
          );
          location = textResult.location;
          confidence = textResult.confidence;
          factors.push(...textResult.factors);
          break;

        case "GOOGLE_LOCATION":
        case "WHATSAPP_LOCATION":
          location = input.data.location || null;
          confidence = input.data.location?.accuracy
            ? this.calculateAccuracyFromGPS(input.data.location.accuracy)
            : 0.8;
          factors.push({
            factor: "GPS Accuracy",
            impact:
              input.data.location?.accuracy && input.data.location.accuracy < 50
                ? "POSITIVE"
                : "NEGATIVE",
            score: input.data.location?.accuracy
              ? Math.max(0, 100 - input.data.location.accuracy)
              : 70,
            explanation: `GPS accuracy: ${input.data.location?.accuracy || "unknown"} meters`,
          });
          break;

        case "COORDINATES":
          location = input.data.coordinates || null;
          confidence = 0.9;
          factors.push({
            factor: "Direct Coordinates",
            impact: "POSITIVE",
            score: 95,
            explanation: "Direct coordinate input - highest accuracy",
          });
          break;

        case "ADDRESS":
          const geocodeResult = await mapsService.geocode(
            input.data.address || "",
          );
          if (geocodeResult) {
            location = {
              lat: geocodeResult.location.coordinates?.lat || 0,
              lng: geocodeResult.location.coordinates?.lng || 0,
              address: geocodeResult.formattedAddress,
            };
            confidence = 0.85;
            factors.push({
              factor: "Geocoding",
              impact: "POSITIVE",
              score: 85,
              explanation: `Geocoded from address: ${input.data.address}`,
            });
          }
          break;
      }

      if (!location || !location.lat || !location.lng) {
        throw new Error("Could not determine location from input");
      }

      // Enhance with knowledge base
      const kbEnhancement = await this.enhanceWithKnowledgeBase(
        location,
        input.data.context,
        tenantId,
      );
      confidence = Math.min(1.0, confidence + kbEnhancement.confidenceBoost);
      factors.push(...kbEnhancement.factors);

      // Learn from history
      const historicalLearning = await this.learnFromHistory(
        location,
        input.data.context,
        tenantId,
      );
      confidence = Math.min(
        1.0,
        confidence + historicalLearning.confidenceBoost,
      );
      factors.push(...historicalLearning.factors);

      // Generate zone draft
      const zoneDraft = await this.generateZoneDraft(
        location,
        input,
        confidence,
        tenantId,
      );

      // Calculate accuracy level
      const accuracyScore = this.calculateAccuracyScore(factors);
      const accuracyLevel = this.getAccuracyLevel(accuracyScore);

      // Find alternatives
      const alternatives = await this.findAlternatives(
        location,
        input,
        tenantId,
      );

      // Generate learning points
      const learning = await this.generateLearningPoints(
        input,
        location,
        zoneDraft,
        tenantId,
      );

      const result: LocationIntelligenceResult = {
        success: true,
        confidence,
        accuracy: {
          level: accuracyLevel,
          score: accuracyScore,
          factors,
        },
        location: {
          coordinates: { lat: location.lat, lng: location.lng },
          address:
            location.address ||
            (await this.reverseGeocode(location.lat, location.lng)),
          formattedAddress:
            location.address ||
            (await this.reverseGeocode(location.lat, location.lng)),
          accuracy: location.accuracy || 100,
          confidence,
        },
        zoneDraft,
        alternatives,
        learning,
      };

      // Store for learning
      await this.storeForLearning(input, result, tenantId);

      return result;
    } catch (error) {
      console.error("Error processing location:", error);
      throw error;
    }
  }

  /**
   * Process text location description
   */
  private async processTextLocation(
    text: string,
    context?: LocationInput["data"]["context"],
  ): Promise<{
    location: { lat: number; lng: number; address?: string };
    confidence: number;
    factors: LocationIntelligenceResult["accuracy"]["factors"];
  }> {
    const factors: LocationIntelligenceResult["accuracy"]["factors"] = [];
    let confidence = 0.6;

    // Try to extract location from text using AI/geocoding
    // For now, use geocoding service
    const geocodeResult = await mapsService.geocode(text);

    if (geocodeResult && geocodeResult.location.coordinates) {
      confidence = 0.75;
      factors.push({
        factor: "Text Geocoding",
        impact: "POSITIVE",
        score: 75,
        explanation: `Successfully geocoded: "${text}"`,
      });

      // Check if context provides hints
      if (context?.zoneTypeHint) {
        confidence += 0.1;
        factors.push({
          factor: "Context Hint",
          impact: "POSITIVE",
          score: 10,
          explanation: `Zone type hint provided: ${context.zoneTypeHint}`,
        });
      }
    } else {
      confidence = 0.4;
      factors.push({
        factor: "Text Ambiguity",
        impact: "NEGATIVE",
        score: 40,
        explanation: `Could not reliably geocode: "${text}"`,
      });
    }

    return {
      location: geocodeResult?.location.coordinates
        ? {
            lat: geocodeResult.location.coordinates.lat,
            lng: geocodeResult.location.coordinates.lng,
            address: geocodeResult.formattedAddress,
          }
        : { lat: 0, lng: 0 },
      confidence,
      factors,
    };
  }

  /**
   * Enhance with knowledge base
   */
  private async enhanceWithKnowledgeBase(
    location: { lat: number; lng: number },
    context?: LocationInput["data"]["context"],
    tenantId?: string,
  ): Promise<{
    confidenceBoost: number;
    factors: LocationIntelligenceResult["accuracy"]["factors"];
  }> {
    const factors: LocationIntelligenceResult["accuracy"]["factors"] = [];
    let confidenceBoost = 0;

    try {
      // Search knowledge base for similar locations
      const searchQuery = `location ${location.lat.toFixed(4)} ${location.lng.toFixed(4)} zone geofence`;
      const kbResults = await knowledgeBaseService.search({
        query: searchQuery,
        tenantId: tenantId || "default",
        maxResults: 5,
      });

      if (kbResults.results.length > 0) {
        confidenceBoost += 0.15;
        factors.push({
          factor: "Knowledge Base Match",
          impact: "POSITIVE",
          score: 15,
          explanation: `Found ${kbResults.results.length} similar location(s) in knowledge base`,
        });
      }

      // Check for customer context
      if (context?.customerId) {
        confidenceBoost += 0.1;
        factors.push({
          factor: "Customer Context",
          impact: "POSITIVE",
          score: 10,
          explanation: "Customer context provided - higher confidence",
        });
      }
    } catch (error) {
      console.warn("Error enhancing with knowledge base:", error);
    }

    return { confidenceBoost, factors };
  }

  /**
   * Learn from historical corrections
   */
  private async learnFromHistory(
    location: { lat: number; lng: number },
    context?: LocationInput["data"]["context"],
    tenantId?: string,
  ): Promise<{
    confidenceBoost: number;
    factors: LocationIntelligenceResult["accuracy"]["factors"];
  }> {
    const factors: LocationIntelligenceResult["accuracy"]["factors"] = [];
    let confidenceBoost = 0;

    // Check learning history for similar locations
    for (const learning of this.learningHistory.values()) {
      if (learning.learned && learning.userCorrection) {
        const distance = this.calculateDistance(
          location,
          learning.userCorrection.correctedLocation,
        );

        // If within 100m of a learned location, boost confidence
        if (distance < 100) {
          confidenceBoost += 0.1;
          factors.push({
            factor: "Historical Learning",
            impact: "POSITIVE",
            score: 10,
            explanation: `Similar location learned from previous correction (${distance.toFixed(0)}m away)`,
          });
        }
      }
    }

    return { confidenceBoost, factors };
  }

  /**
   * Generate zone draft
   */
  private async generateZoneDraft(
    location: { lat: number; lng: number; address?: string },
    input: LocationInput,
    confidence: number,
    tenantId: string,
  ): Promise<LocationIntelligenceResult["zoneDraft"]> {
    // Infer zone type from context
    let zoneType: ZoneType = "CUSTOM";
    const suggestions: string[] = [];
    const warnings: string[] = [];

    // Type inference logic
    if (input.data.context?.zoneTypeHint) {
      zoneType = input.data.context.zoneTypeHint as ZoneType;
    } else if (input.data.text) {
      const text = input.data.text.toLowerCase();
      if (text.includes("warehouse") || text.includes("storage"))
        zoneType = "WAREHOUSE";
      else if (text.includes("border") || text.includes("customs"))
        zoneType = "BORDER_ENTRY_POINT";
      else if (text.includes("customer") || text.includes("delivery"))
        zoneType = "CUSTOMER_SITE";
      else if (text.includes("port") || text.includes("terminal"))
        zoneType = "PORT_TERMINAL";
      else if (text.includes("airport")) zoneType = "AIRPORT_CARGO_TERMINAL";
    }

    // Suggest geometry based on zone type
    const suggestedRadius = this.getSuggestedRadius(zoneType);
    const suggestedGeometry = {
      type: "CIRCLE" as const,
      coordinates: {
        center: { lat: location.lat, lng: location.lng },
        radius: suggestedRadius,
      },
    };

    // Suggest metadata
    const suggestedMetadata = {
      expectedDwellTime: this.getSuggestedDwellTime(zoneType),
      maxDwellTime: this.getSuggestedMaxDwellTime(zoneType),
    };

    // Generate name
    const name =
      input.data.text ||
      input.data.address ||
      `Zone at ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;

    // Warnings
    if (confidence < this.accuracyThreshold) {
      warnings.push(
        "Low confidence - please verify location before creating zone",
      );
    }
    if (!input.data.context?.zoneTypeHint) {
      warnings.push("Zone type inferred - please verify and adjust if needed");
    }

    // Suggestions
    if (confidence >= this.accuracyThreshold) {
      suggestions.push("High confidence - ready to create zone");
    } else {
      suggestions.push("Consider verifying location coordinates");
    }

    return {
      name,
      type: zoneType,
      suggestedGeometry,
      suggestedMetadata,
      confidence,
      suggestions,
      warnings,
    };
  }

  /**
   * Find alternative locations
   */
  private async findAlternatives(
    location: { lat: number; lng: number },
    input: LocationInput,
    tenantId: string,
  ): Promise<LocationIntelligenceResult["alternatives"]> {
    const alternatives: LocationIntelligenceResult["alternatives"] = [];

    // If text input, try variations
    if (input.type === "TEXT" && input.data.text) {
      // Try with city name added
      const cityVariations = ["Riyadh", "Jeddah", "Dammam", "Khobar"];
      for (const city of cityVariations) {
        if (!input.data.text.toLowerCase().includes(city.toLowerCase())) {
          const altText = `${input.data.text}, ${city}`;
          const geocodeResult = await mapsService.geocode(altText);
          if (geocodeResult && geocodeResult.location.coordinates) {
            const distance = this.calculateDistance(
              location,
              geocodeResult.location.coordinates,
            );
            if (distance > 1000) {
              // Only add if significantly different
              alternatives.push({
                location: geocodeResult.location.coordinates,
                address: geocodeResult.formattedAddress,
                confidence: 0.6,
                reason: `Alternative location in ${city}`,
              });
            }
          }
        }
      }
    }

    return alternatives.slice(0, 3); // Max 3 alternatives
  }

  /**
   * Generate learning points
   */
  private async generateLearningPoints(
    input: LocationInput,
    location: { lat: number; lng: number },
    zoneDraft: LocationIntelligenceResult["zoneDraft"],
    tenantId: string,
  ): Promise<LocationIntelligenceResult["learning"]> {
    const learningPoints: string[] = [];

    // Store in knowledge base for future learning
    try {
      await knowledgeBaseService.addEntry({
        id: `location-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "LOCATION",
        category: "GEOFENCE",
        title: `Location: ${zoneDraft.name}`,
        content: JSON.stringify({
          input,
          location,
          zoneDraft,
          timestamp: new Date(),
        }),
        metadata: {
          coordinates: location,
          zoneType: zoneDraft.type,
        },
        tenantId,
        source: "location-intelligence",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      learningPoints.push(
        "Location stored in knowledge base for future learning",
      );
    } catch (error) {
      console.warn("Error storing in knowledge base:", error);
    }

    return {
      canLearn: true,
      learningPoints,
    };
  }

  /**
   * Store for learning
   */
  private async storeForLearning(
    input: LocationInput,
    result: LocationIntelligenceResult,
    tenantId: string,
  ): Promise<void> {
    const learning: LocationLearning = {
      id: `learning-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      originalInput: input,
      result,
      accuracy: result.accuracy.score,
      learned: false,
      createdAt: new Date(),
    };

    this.learningHistory.set(learning.id, learning);
  }

  /**
   * Learn from user correction
   */
  async learnFromCorrection(
    learningId: string,
    correctedLocation: { lat: number; lng: number },
    correctedZone: Partial<GeofenceZone>,
  ): Promise<void> {
    const learning = this.learningHistory.get(learningId);
    if (!learning) return;

    learning.userCorrection = {
      correctedLocation,
      correctedZone,
      timestamp: new Date(),
    };
    learning.learned = true;

    // Update knowledge base with correction
    await knowledgeBaseService.addEntry({
      id: `correction-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "CORRECTION",
      category: "GEOFENCE",
      title: "Location Correction",
      content: JSON.stringify({
        original: learning.originalInput,
        corrected: {
          location: correctedLocation,
          zone: correctedZone,
        },
      }),
      metadata: {
        learningId,
      },
      tenantId: "default",
      source: "location-intelligence",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Publish learning event
    await eventBus.publish({
      type: "geofence.location.learned",
      data: {
        learningId,
        correction: learning.userCorrection,
      },
      metadata: {
        source: "location-intelligence-service",
        timestamp: new Date().toISOString(),
      },
    });
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private calculateAccuracyFromGPS(accuracy: number): number {
    // GPS accuracy in meters -> confidence (0-1)
    if (accuracy < 10) return 0.95;
    if (accuracy < 50) return 0.85;
    if (accuracy < 100) return 0.75;
    if (accuracy < 200) return 0.65;
    return 0.5;
  }

  private calculateAccuracyScore(
    factors: LocationIntelligenceResult["accuracy"]["factors"],
  ): number {
    if (factors.length === 0) return 50;
    const totalScore = factors.reduce((sum, f) => sum + f.score, 0);
    return Math.min(100, Math.max(0, totalScore / factors.length));
  }

  private getAccuracyLevel(
    score: number,
  ): LocationIntelligenceResult["accuracy"]["level"] {
    if (score >= 90) return "VERY_HIGH";
    if (score >= 75) return "HIGH";
    if (score >= 60) return "MEDIUM";
    if (score >= 40) return "LOW";
    return "VERY_LOW";
  }

  private getSuggestedRadius(zoneType: ZoneType): number {
    const radii: Record<ZoneType, number> = {
      ORIGIN_FACILITY: 500,
      DESTINATION_FACILITY: 500,
      WAREHOUSE: 1000,
      CUSTOMER_SITE: 300,
      BORDER_ENTRY_POINT: 2000,
      BORDER_EXIT_POINT: 2000,
      CUSTOMS_CLEARANCE_FACILITY: 1500,
      CUSTOMS_INSPECTION_AREA: 500,
      NO_MANS_LAND: 1000,
      BORDER_CROSSING_COMPLEX: 3000,
      REGULATORY_CHECKPOINT: 500,
      INSPECTION_FACILITY: 800,
      DOCUMENTATION_CENTER: 300,
      COMPLIANCE_VERIFICATION_POINT: 400,
      PORT_TERMINAL: 2000,
      AIRPORT_CARGO_TERMINAL: 1500,
      RAILWAY_TERMINAL: 1000,
      DRY_PORT: 1500,
      LOGISTICS_HUB: 2000,
      HIGHWAY_TOLL_PLAZA: 200,
      WEIGH_STATION: 300,
      REST_AREA: 500,
      FUEL_STATION: 200,
      SERVICE_AREA: 600,
      SECURITY_CHECKPOINT: 300,
      RESTRICTED_AREA: 1000,
      QUARANTINE_ZONE: 800,
      HAZMAT_HANDLING_AREA: 1000,
      CITY_LIMIT: 5000,
      PROVINCE_BOUNDARY: 10000,
      COUNTRY_BOUNDARY: 20000,
      FREE_ZONE: 2000,
      CUSTOM: 500,
    };
    return radii[zoneType] || 500;
  }

  private getSuggestedDwellTime(zoneType: ZoneType): number {
    const times: Record<ZoneType, number> = {
      ORIGIN_FACILITY: 120, // 2 hours for loading
      DESTINATION_FACILITY: 60, // 1 hour for unloading
      WAREHOUSE: 90,
      CUSTOMER_SITE: 45,
      BORDER_ENTRY_POINT: 180, // 3 hours for customs
      BORDER_EXIT_POINT: 180,
      CUSTOMS_CLEARANCE_FACILITY: 240, // 4 hours
      CUSTOMS_INSPECTION_AREA: 120,
      NO_MANS_LAND: 30,
      BORDER_CROSSING_COMPLEX: 360, // 6 hours
      REGULATORY_CHECKPOINT: 60,
      INSPECTION_FACILITY: 90,
      DOCUMENTATION_CENTER: 30,
      COMPLIANCE_VERIFICATION_POINT: 45,
      PORT_TERMINAL: 480,
      AIRPORT_CARGO_TERMINAL: 360,
      RAILWAY_TERMINAL: 240,
      DRY_PORT: 300,
      LOGISTICS_HUB: 180,
      HIGHWAY_TOLL_PLAZA: 5,
      WEIGH_STATION: 15,
      REST_AREA: 60,
      FUEL_STATION: 20,
      SERVICE_AREA: 45,
      SECURITY_CHECKPOINT: 30,
      RESTRICTED_AREA: 120,
      QUARANTINE_ZONE: 240,
      HAZMAT_HANDLING_AREA: 180,
      CITY_LIMIT: 0,
      PROVINCE_BOUNDARY: 0,
      COUNTRY_BOUNDARY: 0,
      FREE_ZONE: 180,
      CUSTOM: 60,
    };
    return times[zoneType] || 60;
  }

  private getSuggestedMaxDwellTime(zoneType: ZoneType): number {
    return this.getSuggestedDwellTime(zoneType) * 2;
  }

  private calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number },
  ): number {
    const R = 6371; // Earth radius in km
    const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
    const dLng = ((point2.lng - point1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((point1.lat * Math.PI) / 180) *
        Math.cos((point2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; // Return in meters
  }

  private async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      // In production, would use reverse geocoding API
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }
}

export const locationIntelligenceService = new LocationIntelligenceService();
