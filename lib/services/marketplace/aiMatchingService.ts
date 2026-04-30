/**
 * AI-Powered Marketplace Matching Service
 * Intelligent service matching using ML, learning from history, and continuous improvement
 * 4IR & 5IR Aligned • Integration-First • Deep Architecture
 */

import type {
  MarketplaceServiceListing,
  MarketplaceServiceCategory,
  ServiceProvider,
  MarketplaceBooking,
} from "@/types/marketplace";
import type {
  ServiceRequirement,
  RequirementCompleteness,
  MatchingFeedback,
  RequirementLearning,
} from "@/types/marketplace-requirements";
import { marketplaceService } from "./marketplaceService";
import { mlModelRegistry } from "@/lib/services/ml-registry";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import { agentOrchestrator } from "@/lib/services/agents/agentOrchestrator";
import { eventBus } from "@/lib/services/event-store";

// ============================================================================
// TYPES
// ============================================================================

export interface MatchResult {
  listing: MarketplaceServiceListing;
  provider: ServiceProvider;
  matchScore: number; // 0-100
  confidence: number; // 0-100
  reasons: string[]; // Why this match
  strengths: string[]; // What makes this a good match
  considerations: string[]; // Things to consider
  estimatedPrice?: number;
  estimatedTimeline?: string;
  completenessImpact?: number; // How completeness affects this match
}

export interface MatchingResult {
  requirement: ServiceRequirement;
  completeness: RequirementCompleteness;
  matches: MatchResult[];
  topMatch?: MatchResult;
  recommendations: {
    improveCompleteness?: string[];
    alternativeCategories?: string[];
    pricingInsights?: string[];
  };
  learningApplied: boolean;
}

export interface MatchingHistory {
  requirementId: string;
  category: string;
  matches: MatchResult[];
  selectedMatch?: string; // listingId
  outcome?: "SUCCESS" | "PARTIAL" | "FAILURE";
  feedback?: MatchingFeedback;
  createdAt: string;
}

// ============================================================================
// IN-MEMORY STORAGE
// ============================================================================

const matchingHistory: Map<string, MatchingHistory> = new Map();
const feedbackData: Map<string, MatchingFeedback> = new Map();
const learningData: Map<string, RequirementLearning> = new Map();

// ============================================================================
// AI MATCHING SERVICE
// ============================================================================

export class AIMatchingService {
  /**
   * Find best matches for a service requirement
   */
  async findMatches(requirement: ServiceRequirement): Promise<MatchingResult> {
    // Check cache first
    const cacheKey = getCacheKey(requirement);
    const cached = getCached<MatchingResult>(cacheKey);
    if (cached) {
      return cached;
    }

    // 1. Assess requirement completeness
    const completeness = await this.assessCompleteness(requirement);

    // 2. Get all relevant listings
    const listings = await this.getRelevantListings(requirement);

    // 3. Score each listing
    const matches: MatchResult[] = [];
    for (const listing of listings) {
      const match = await this.scoreMatch(requirement, listing, completeness);
      if (match.matchScore > 30) {
        // Only include reasonable matches
        matches.push(match);
      }
    }

    // 4. Sort by match score
    matches.sort((a, b) => b.matchScore - a.matchScore);

    // 5. Get top match
    const topMatch = matches.length > 0 ? matches[0] : undefined;

    // 6. Apply learning from history
    const learningApplied = await this.applyLearning(requirement, matches);

    // 7. Generate recommendations
    const recommendations = await this.generateRecommendations(
      requirement,
      completeness,
      matches,
    );

    // 8. Store in history
    const historyId = `match-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    matchingHistory.set(historyId, {
      requirementId: historyId,
      category: requirement.category,
      matches,
      createdAt: new Date().toISOString(),
    });

    const result: MatchingResult = {
      requirement,
      completeness,
      matches: matches.slice(0, 10), // Top 10 matches
      topMatch,
      recommendations,
      learningApplied,
    };

    // Cache the result
    setCached(cacheKey, result);

    return result;
  }

  /**
   * Assess requirement completeness
   */
  private async assessCompleteness(
    requirement: ServiceRequirement,
  ): Promise<RequirementCompleteness> {
    const category = requirement.category;
    const requiredFields = this.getRequiredFields(category);
    const recommendedFields = this.getRecommendedFields(category);

    const missingFields: string[] = [];
    const recommended: string[] = [];

    // Check required fields
    for (const field of requiredFields) {
      if (!this.hasField(requirement, field)) {
        missingFields.push(field);
      }
    }

    // Check recommended fields
    for (const field of recommendedFields) {
      if (!this.hasField(requirement, field)) {
        recommended.push(field);
      }
    }

    // Calculate completeness
    const totalFields = requiredFields.length + recommendedFields.length;
    const filledFields =
      totalFields - missingFields.length - recommended.length;
    const completeness =
      totalFields > 0 ? (filledFields / totalFields) * 100 : 0;

    // Get learning data for this category
    const learning = learningData.get(category);
    if (learning) {
      // Adjust confidence based on common missing fields
      const criticalMissing = missingFields.filter((f) =>
        learning.commonMissingFields.some(
          (mf) => mf.field === f && mf.impact === "HIGH",
        ),
      );
      const confidence = Math.max(0, 100 - criticalMissing.length * 15);
      return {
        requirementId: `req-${Date.now()}`,
        category,
        completeness,
        missingFields,
        recommendedFields: recommended,
        confidence,
        lastUpdated: new Date().toISOString(),
      };
    }

    return {
      requirementId: `req-${Date.now()}`,
      category,
      completeness,
      missingFields,
      recommendedFields: recommended,
      confidence: Math.max(0, 100 - missingFields.length * 10),
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get relevant listings for requirement
   */
  private async getRelevantListings(
    requirement: ServiceRequirement,
  ): Promise<MarketplaceServiceListing[]> {
    const filters: any = {
      category: requirement.category as MarketplaceServiceCategory,
    };

    // Add location filter
    if (requirement.location.city) {
      filters.location = {
        city: requirement.location.city,
        country: requirement.location.country,
      };
    }

    // Add availability filter
    filters.availability = "AVAILABLE";

    return await marketplaceService.searchListings(filters);
  }

  /**
   * Score a match between requirement and listing
   */
  private async scoreMatch(
    requirement: ServiceRequirement,
    listing: MarketplaceServiceListing,
    completeness: RequirementCompleteness,
  ): Promise<MatchResult> {
    let score = 0;
    const reasons: string[] = [];
    const strengths: string[] = [];
    const considerations: string[] = [];

    // 1. Category match (base score)
    if (this.matchesCategory(requirement, listing)) {
      score += 20;
      reasons.push("Category matches requirement");
    }

    // 2. Location match
    const locationScore = this.scoreLocation(requirement, listing);
    score += locationScore.score;
    if (locationScore.score > 0) {
      reasons.push(locationScore.reason);
      if (locationScore.score >= 15) {
        strengths.push("Excellent location match");
      }
    }

    // 3. Service type match
    const typeScore = this.scoreServiceType(requirement, listing);
    score += typeScore.score;
    if (typeScore.score > 0) {
      reasons.push(typeScore.reason);
    }

    // 4. Capacity/Volume match
    const capacityScore = this.scoreCapacity(requirement, listing);
    score += capacityScore.score;
    if (capacityScore.score > 0) {
      reasons.push(capacityScore.reason);
    }

    // 5. Pricing match
    const pricingScore = this.scorePricing(requirement, listing);
    score += pricingScore.score;
    if (pricingScore.score > 0) {
      reasons.push(pricingScore.reason);
    }

    // 6. Rating and reputation
    const reputationScore = this.scoreReputation(listing);
    score += reputationScore.score;
    if (reputationScore.score > 0) {
      reasons.push(reputationScore.reason);
      if (listing.rating >= 4.5) {
        strengths.push("High-rated provider");
      }
    }

    // 7. Certifications and compliance
    const complianceScore = this.scoreCompliance(requirement, listing);
    score += complianceScore.score;
    if (complianceScore.score > 0) {
      reasons.push(complianceScore.reason);
      strengths.push("Meets compliance requirements");
    }

    // 8. Availability and timeline
    const availabilityScore = this.scoreAvailability(requirement, listing);
    score += availabilityScore.score;
    if (availabilityScore.score > 0) {
      reasons.push(availabilityScore.reason);
    }

    // 9. Apply completeness penalty
    const completenessPenalty = (100 - completeness.completeness) * 0.1;
    score = Math.max(0, score - completenessPenalty);

    // 10. Use ML model if available
    try {
      const mlScore = await this.getMLScore(requirement, listing);
      if (mlScore > 0) {
        score = score * 0.7 + mlScore * 0.3; // Blend with ML
        reasons.push("ML-enhanced matching");
      }
    } catch (error) {
      console.warn("ML scoring failed, using rule-based:", error);
    }

    // Calculate confidence
    const confidence = Math.min(100, completeness.confidence + score / 2);

    // Get provider
    const provider = await marketplaceService.getProvider(listing.providerId);
    if (!provider) {
      throw new Error(`Provider not found: ${listing.providerId}`);
    }

    return {
      listing,
      provider,
      matchScore: Math.min(100, score),
      confidence,
      reasons,
      strengths,
      considerations,
      estimatedPrice: this.estimatePrice(requirement, listing),
      estimatedTimeline: this.estimateTimeline(requirement, listing),
      completenessImpact: completeness.completeness,
    };
  }

  /**
   * Score location match
   */
  private scoreLocation(
    requirement: ServiceRequirement,
    listing: MarketplaceServiceListing,
  ): { score: number; reason: string } {
    if (!("location" in listing)) {
      return { score: 0, reason: "" };
    }

    const reqLoc = requirement.location;
    const listLoc = listing.location as any;

    if (reqLoc.city && listLoc.city) {
      if (reqLoc.city === listLoc.city) {
        return { score: 20, reason: "Same city" };
      }
      if (reqLoc.country === listLoc.country) {
        return { score: 10, reason: "Same country, different city" };
      }
    }

    return { score: 0, reason: "" };
  }

  /**
   * Score service type match
   */
  private scoreServiceType(
    requirement: ServiceRequirement,
    listing: MarketplaceServiceListing,
  ): { score: number; reason: string } {
    if (requirement.category !== this.getListingCategory(listing)) {
      return { score: 0, reason: "" };
    }

    // Check service type match for specific categories
    if ("serviceType" in requirement && "serviceType" in listing) {
      const reqType = (requirement as any).serviceType;
      const listType = (listing as any).serviceType;
      if (reqType === listType) {
        return { score: 15, reason: "Exact service type match" };
      }
    }

    return { score: 10, reason: "Category match" };
  }

  /**
   * Score capacity match
   */
  private scoreCapacity(
    requirement: ServiceRequirement,
    listing: MarketplaceServiceListing,
  ): { score: number; reason: string } {
    if (
      requirement.category === "STORAGE" &&
      "capacity" in requirement &&
      "capacity" in listing
    ) {
      const reqCap = (requirement as any).capacity;
      const listCap = (listing as any).capacity;

      if (reqCap && listCap) {
        const reqTotal =
          reqCap.volume || reqCap.area || reqCap.pallets || reqCap.weight || 0;
        const listAvailable = listCap.available || 0;

        if (listAvailable >= reqTotal) {
          return { score: 15, reason: "Sufficient capacity available" };
        }
        if (listAvailable >= reqTotal * 0.8) {
          return { score: 10, reason: "Adequate capacity available" };
        }
      }
    }

    return { score: 0, reason: "" };
  }

  /**
   * Score pricing match
   */
  private scorePricing(
    requirement: ServiceRequirement,
    listing: MarketplaceServiceListing,
  ): { score: number; reason: string } {
    if (!requirement.budget || !("pricing" in listing)) {
      return { score: 0, reason: "" };
    }

    const budget = requirement.budget;
    const pricing = (listing as any).pricing;

    if (budget.min && budget.max && pricing.basePrice) {
      if (pricing.basePrice >= budget.min && pricing.basePrice <= budget.max) {
        return { score: 15, reason: "Price within budget" };
      }
      if (pricing.basePrice <= budget.max * 1.2) {
        return { score: 10, reason: "Price slightly above budget" };
      }
    }

    return { score: 0, reason: "" };
  }

  /**
   * Score reputation
   */
  private scoreReputation(listing: MarketplaceServiceListing): {
    score: number;
    reason: string;
  } {
    let score = 0;
    let reason = "";

    if (listing.rating >= 4.5) {
      score = 15;
      reason = "Excellent rating";
    } else if (listing.rating >= 4.0) {
      score = 10;
      reason = "Good rating";
    } else if (listing.rating >= 3.5) {
      score = 5;
      reason = "Average rating";
    }

    if (listing.totalBookings > 100) {
      score += 5;
      reason += " (Established provider)";
    }

    return { score, reason };
  }

  /**
   * Score compliance
   */
  private scoreCompliance(
    requirement: ServiceRequirement,
    listing: MarketplaceServiceListing,
  ): { score: number; reason: string } {
    if (
      !requirement.certifications ||
      requirement.certifications.length === 0
    ) {
      return { score: 0, reason: "" };
    }

    const listCerts =
      "certifications" in listing ? (listing as any).certifications : [];
    const matchedCerts = requirement.certifications.filter((cert) =>
      listCerts.includes(cert),
    );

    if (matchedCerts.length === requirement.certifications.length) {
      return { score: 10, reason: "All certifications met" };
    }
    if (matchedCerts.length > 0) {
      return { score: 5, reason: "Some certifications met" };
    }

    return { score: 0, reason: "" };
  }

  /**
   * Score availability
   */
  private scoreAvailability(
    requirement: ServiceRequirement,
    listing: MarketplaceServiceListing,
  ): { score: number; reason: string } {
    if (listing.availability === "AVAILABLE") {
      return { score: 10, reason: "Available" };
    }
    if (listing.availability === "LIMITED") {
      return { score: 5, reason: "Limited availability" };
    }
    return { score: 0, reason: "Not available" };
  }

  /**
   * Get ML model score
   */
  private async getMLScore(
    requirement: ServiceRequirement,
    listing: MarketplaceServiceListing,
  ): Promise<number> {
    try {
      // Try to get ML model for matching
      const models = await mlModelRegistry.getAllModels();
      const matchingModel = models.find(
        (m) =>
          m.name === "marketplace-matching" &&
          m.status === "deployed" &&
          m.type === "recommendation",
      );

      if (matchingModel) {
        // Use ML model for scoring
        const input = {
          requirement: this.serializeRequirement(requirement),
          listing: this.serializeListing(listing),
        };

        // This would call the actual ML model
        // For now, return a placeholder
        return 0;
      }
    } catch (error) {
      console.warn("ML model scoring failed:", error);
    }

    return 0;
  }

  /**
   * Apply learning from history
   */
  private async applyLearning(
    requirement: ServiceRequirement,
    matches: MatchResult[],
  ): Promise<boolean> {
    try {
      // Get learning data for this category
      const learning = learningData.get(requirement.category);
      if (!learning) {
        return false;
      }

      // Adjust matches based on learning
      for (const match of matches) {
        // Boost matches that have historically performed well
        const historicalPerformance = this.getHistoricalPerformance(
          match.listing.id,
        );
        if (historicalPerformance > 0) {
          match.matchScore = Math.min(
            100,
            match.matchScore + historicalPerformance * 5,
          );
          match.reasons.push(`Historically high performance`);
        }
      }

      // Re-sort after learning adjustment
      matches.sort((a, b) => b.matchScore - a.matchScore);

      return true;
    } catch (error) {
      console.warn("Learning application failed:", error);
      return false;
    }
  }

  /**
   * Generate recommendations
   */
  private async generateRecommendations(
    requirement: ServiceRequirement,
    completeness: RequirementCompleteness,
    matches: MatchResult[],
  ): Promise<MatchingResult["recommendations"]> {
    const recommendations: MatchingResult["recommendations"] = {};

    // Completeness recommendations
    if (completeness.completeness < 80) {
      recommendations.improveCompleteness =
        completeness.recommendedFields.slice(0, 5);
    }

    // Alternative categories if no good matches
    if (matches.length === 0 || (matches[0] && matches[0].matchScore < 50)) {
      recommendations.alternativeCategories =
        await this.suggestAlternativeCategories(requirement);
    }

    // Pricing insights
    if (matches.length > 0) {
      const prices = matches
        .map((m) => m.estimatedPrice || 0)
        .filter((p) => p > 0);
      if (prices.length > 0) {
        const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        recommendations.pricingInsights = [
          `Average price: ${avgPrice.toFixed(2)} ${requirement.budget?.currency || "SAR"}`,
          `Price range: ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)} ${requirement.budget?.currency || "SAR"}`,
        ];
      }
    }

    return recommendations;
  }

  /**
   * Submit feedback for learning
   */
  async submitFeedback(feedback: MatchingFeedback): Promise<void> {
    feedbackData.set(feedback.id, feedback);

    // Update learning data
    await this.updateLearning(feedback);

    // Publish event
    await eventBus.publish("marketplace.matching.feedback", {
      feedbackId: feedback.id,
      requirementId: feedback.requirementId,
      outcome: feedback.outcome,
    });
  }

  /**
   * Update learning from feedback
   */
  private async updateLearning(feedback: MatchingFeedback): Promise<void> {
    const category = feedback.requirementId; // Would extract from requirement
    let learning = learningData.get(category);

    if (!learning) {
      learning = {
        category,
        commonMissingFields: [],
        recommendedFields: [],
        lastAnalyzed: new Date().toISOString(),
      };
    }

    // Update missing fields tracking
    if (feedback.missingInformation) {
      for (const field of feedback.missingInformation) {
        const existing = learning.commonMissingFields.find(
          (mf) => mf.field === field,
        );
        if (existing) {
          existing.frequency++;
        } else {
          learning.commonMissingFields.push({
            field,
            frequency: 1,
            impact:
              feedback.accuracy < 3
                ? "HIGH"
                : feedback.accuracy < 4
                  ? "MEDIUM"
                  : "LOW",
          });
        }
      }
    }

    learning.lastAnalyzed = new Date().toISOString();
    learningData.set(category, learning);
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private getRequiredFields(category: string): string[] {
    const fields: Record<string, string[]> = {
      STORAGE: ["location", "capacity", "timeline"],
      TRANSPORTATION: ["route", "cargo", "timeline"],
      FREIGHT: ["route", "cargo", "timeline"],
      CONSULTING: ["project", "consultant", "serviceLevel"],
      MANPOWER: ["staff", "employment", "serviceLevel"],
      TRANSLATION: ["translation", "serviceLevel"],
      CROSSDOCKING: ["facility", "volume", "operations"],
      WAREHOUSE_NETWORK: ["network", "operations", "capacity"],
    };
    return fields[category] || [];
  }

  private getRecommendedFields(category: string): string[] {
    const fields: Record<string, string[]> = {
      STORAGE: ["materials", "operations", "serviceLevel", "certifications"],
      TRANSPORTATION: ["vehicle", "serviceLevel", "specialRequirements"],
      FREIGHT: ["serviceLevel", "documentation", "specialRequirements"],
      CONSULTING: ["certifications", "languages", "specialRequirements"],
      MANPOWER: ["certifications", "backgroundChecks", "training"],
      TRANSLATION: ["specialty", "certified", "notarized"],
      CROSSDOCKING: ["serviceLevel", "specialRequirements"],
      WAREHOUSE_NETWORK: ["serviceLevel", "certifications"],
    };
    return fields[category] || [];
  }

  private hasField(requirement: ServiceRequirement, field: string): boolean {
    const obj = requirement as any;
    const parts = field.split(".");
    let current = obj;
    for (const part of parts) {
      if (current && typeof current === "object" && part in current) {
        current = current[part];
      } else {
        return false;
      }
    }
    return current !== undefined && current !== null && current !== "";
  }

  private matchesCategory(
    requirement: ServiceRequirement,
    listing: MarketplaceServiceListing,
  ): boolean {
    return requirement.category === this.getListingCategory(listing);
  }

  private getListingCategory(listing: MarketplaceServiceListing): string {
    if ("serviceType" in listing) {
      const type = (listing as any).serviceType;
      if (
        type === "GENERAL_STORAGE" ||
        type === "COLD_STORAGE" ||
        type === "HAZMAT_STORAGE"
      ) {
        return "STORAGE";
      }
      if (type === "FTL" || type === "LTL" || type === "EXPRESS") {
        return "TRANSPORTATION";
      }
      if (type === "FCL" || type === "LCL" || type === "AIR_FREIGHT") {
        return "FREIGHT";
      }
      if (
        type === "CIVIL_DEFENSE" ||
        type === "SAUDIZATION" ||
        type === "COMPLIANCE"
      ) {
        return "CONSULTING";
      }
      if (type === "WAREHOUSE_STAFF" || type === "DRIVERS") {
        return "MANPOWER";
      }
    }
    if ("dockDoors" in listing) {
      return "CROSSDOCKING";
    }
    if ("languages" in listing) {
      return "TRANSLATION";
    }
    if ("warehouses" in listing) {
      return "WAREHOUSE_NETWORK";
    }
    return "OTHER";
  }

  private estimatePrice(
    requirement: ServiceRequirement,
    listing: MarketplaceServiceListing,
  ): number | undefined {
    if ("pricing" in listing) {
      return (listing as any).pricing.basePrice;
    }
    return undefined;
  }

  private estimateTimeline(
    requirement: ServiceRequirement,
    listing: MarketplaceServiceListing,
  ): string | undefined {
    if (requirement.timeline.startDate) {
      return requirement.timeline.startDate;
    }
    return undefined;
  }

  private getHistoricalPerformance(listingId: string): number {
    // Check feedback data for this listing
    const feedbacks = Array.from(feedbackData.values()).filter(
      (f) => f.matchedServiceId === listingId,
    );
    if (feedbacks.length === 0) {
      return 0;
    }
    const avgAccuracy =
      feedbacks.reduce((sum, f) => sum + f.accuracy, 0) / feedbacks.length;
    return avgAccuracy;
  }

  private async suggestAlternativeCategories(
    requirement: ServiceRequirement,
  ): Promise<string[]> {
    // Use knowledge base to suggest alternatives
    try {
      const suggestions = await knowledgeBaseService.search({
        query: `Alternative service categories for ${requirement.category}`,
        category: "marketplace" as any,
        limit: 3,
      });
      return suggestions.map((s) => s.title);
    } catch (error) {
      return [];
    }
  }

  private serializeRequirement(requirement: ServiceRequirement): any {
    return JSON.parse(JSON.stringify(requirement));
  }

  private serializeListing(listing: MarketplaceServiceListing): any {
    return JSON.parse(JSON.stringify(listing));
  }
}

// Singleton instance
export const aiMatchingService = new AIMatchingService();
