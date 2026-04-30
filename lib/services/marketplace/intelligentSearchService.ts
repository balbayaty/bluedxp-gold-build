/**
 * Intelligent Search Service
 * Semantic search with intent understanding and context awareness
 * 4IR & 5IR Aligned • Integration-First • Deep Architecture
 */

import type {
  MarketplaceServiceListing,
  MarketplaceServiceCategory,
  MarketplaceSearchFilters,
} from "@/types/marketplace";
import { marketplaceService } from "./marketplaceService";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import { agentOrchestrator } from "@/lib/services/agents/agentOrchestrator";

// ============================================================================
// TYPES
// ============================================================================

export interface SearchIntent {
  primaryIntent:
    | "FIND_SERVICE"
    | "COMPARE"
    | "GET_QUOTE"
    | "LEARN_MORE"
    | "BOOK_NOW";
  secondaryIntents: string[];
  entities: {
    serviceType?: string;
    location?: string;
    budget?: { min?: number; max?: number };
    urgency?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    features?: string[];
  };
  confidence: number; // 0-100
}

export interface IntelligentSearchResult {
  query: string;
  intent: SearchIntent;
  listings: MarketplaceServiceListing[];
  totalResults: number;
  suggestions: string[];
  relatedCategories: MarketplaceServiceCategory[];
  filters: MarketplaceSearchFilters;
  confidence: number;
}

// ============================================================================
// INTELLIGENT SEARCH SERVICE
// ============================================================================

export class IntelligentSearchService {
  /**
   * Perform intelligent search with semantic understanding
   */
  async search(
    query: string,
    filters?: MarketplaceSearchFilters,
  ): Promise<IntelligentSearchResult> {
    // 1. Understand search intent
    const intent = await this.understandIntent(query);

    // 2. Extract entities and enhance filters
    const enhancedFilters = this.enhanceFilters(filters || {}, intent);

    // 3. Perform semantic search
    const listings = await this.performSemanticSearch(
      query,
      enhancedFilters,
      intent,
    );

    // 4. Generate suggestions
    const suggestions = await this.generateSuggestions(query, intent, listings);

    // 5. Find related categories
    const relatedCategories = await this.findRelatedCategories(
      intent,
      listings,
    );

    // 6. Calculate confidence
    const confidence = this.calculateConfidence(intent, listings);

    return {
      query,
      intent,
      listings: listings.slice(0, 20), // Top 20 results
      totalResults: listings.length,
      suggestions,
      relatedCategories,
      filters: enhancedFilters,
      confidence,
    };
  }

  /**
   * Understand search intent
   */
  private async understandIntent(query: string): Promise<SearchIntent> {
    const lowerQuery = query.toLowerCase();

    // Detect primary intent
    let primaryIntent: SearchIntent["primaryIntent"] = "FIND_SERVICE";
    if (
      lowerQuery.includes("compare") ||
      lowerQuery.includes("vs") ||
      lowerQuery.includes("difference")
    ) {
      primaryIntent = "COMPARE";
    } else if (
      lowerQuery.includes("quote") ||
      lowerQuery.includes("price") ||
      lowerQuery.includes("cost")
    ) {
      primaryIntent = "GET_QUOTE";
    } else if (
      lowerQuery.includes("book") ||
      lowerQuery.includes("reserve") ||
      lowerQuery.includes("order")
    ) {
      primaryIntent = "BOOK_NOW";
    } else if (
      lowerQuery.includes("what") ||
      lowerQuery.includes("how") ||
      lowerQuery.includes("explain")
    ) {
      primaryIntent = "LEARN_MORE";
    }

    // Extract entities
    const entities: SearchIntent["entities"] = {};

    // Service type
    const serviceTypes = [
      "storage",
      "transportation",
      "freight",
      "consulting",
      "manpower",
      "translation",
    ];
    for (const type of serviceTypes) {
      if (lowerQuery.includes(type)) {
        entities.serviceType = type.toUpperCase();
        break;
      }
    }

    // Location
    const locations = [
      "riyadh",
      "jeddah",
      "dammam",
      "khobar",
      "mecca",
      "medina",
    ];
    for (const loc of locations) {
      if (lowerQuery.includes(loc)) {
        entities.location = loc;
        break;
      }
    }

    // Budget keywords
    if (
      lowerQuery.includes("cheap") ||
      lowerQuery.includes("affordable") ||
      lowerQuery.includes("budget")
    ) {
      entities.budget = { max: 5000 };
    } else if (
      lowerQuery.includes("premium") ||
      lowerQuery.includes("expensive") ||
      lowerQuery.includes("high-end")
    ) {
      entities.budget = { min: 10000 };
    }

    // Urgency
    if (
      lowerQuery.includes("urgent") ||
      lowerQuery.includes("asap") ||
      lowerQuery.includes("immediate")
    ) {
      entities.urgency = "URGENT";
    } else if (lowerQuery.includes("soon") || lowerQuery.includes("quick")) {
      entities.urgency = "HIGH";
    }

    // Use AI agent for deeper understanding if available
    try {
      const aiIntent = await agentOrchestrator.executeTask({
        id: `intent-${Date.now()}`,
        type: "nlp",
        description: "Understand search intent",
        input: { query },
        priority: "medium",
      });

      if (aiIntent.status === "success" && aiIntent.output) {
        // Merge AI insights
        if (aiIntent.output.intent) {
          primaryIntent = aiIntent.output
            .intent as SearchIntent["primaryIntent"];
        }
        if (aiIntent.output.entities) {
          Object.assign(entities, aiIntent.output.entities);
        }
      }
    } catch (error) {
      console.warn("AI intent understanding failed, using rule-based:", error);
    }

    // Calculate confidence
    const confidence = this.calculateIntentConfidence(
      query,
      primaryIntent,
      entities,
    );

    return {
      primaryIntent,
      secondaryIntents: [],
      entities,
      confidence,
    };
  }

  /**
   * Enhance filters based on intent
   */
  private enhanceFilters(
    filters: MarketplaceSearchFilters,
    intent: SearchIntent,
  ): MarketplaceSearchFilters {
    const enhanced = { ...filters };

    // Add location from intent
    if (intent.entities.location && !enhanced.location) {
      enhanced.location = {
        city:
          intent.entities.location.charAt(0).toUpperCase() +
          intent.entities.location.slice(1),
        country: "Saudi Arabia",
      };
    }

    // Add budget from intent
    if (intent.entities.budget && !enhanced.priceRange) {
      enhanced.priceRange = {
        min: intent.entities.budget.min,
        max: intent.entities.budget.max,
        currency: "SAR",
      };
    }

    // Add category from service type
    if (intent.entities.serviceType && !enhanced.category) {
      const categoryMap: Record<string, MarketplaceServiceCategory> = {
        STORAGE: "STORAGE",
        TRANSPORTATION: "TRANSPORTATION",
        FREIGHT: "FREIGHT",
        CONSULTING: "CONSULTING",
        MANPOWER: "MANPOWER",
        TRANSLATION: "TRANSLATION",
      };
      enhanced.category =
        categoryMap[intent.entities.serviceType] || enhanced.category;
    }

    return enhanced;
  }

  /**
   * Perform semantic search
   */
  private async performSemanticSearch(
    query: string,
    filters: MarketplaceSearchFilters,
    intent: SearchIntent,
  ): Promise<MarketplaceServiceListing[]> {
    // 1. Get base results using filters
    let results = await marketplaceService.searchListings(filters);

    // 2. If query provided, do semantic matching
    if (query && query.trim().length > 0) {
      // Use knowledge base for semantic search
      try {
        const kbResults = await knowledgeBaseService.search({
          query,
          category: "marketplace" as any,
          limit: 50,
        });

        // Boost listings that match KB results
        const kbKeywords = kbResults.flatMap((r) =>
          r.content.toLowerCase().split(" "),
        );
        results = results
          .map((listing) => ({
            listing,
            score: this.calculateSemanticScore(listing, query, kbKeywords),
          }))
          .sort((a, b) => b.score - a.score)
          .map((item) => item.listing);
      } catch (error) {
        console.warn(
          "Knowledge base search failed, using basic matching:",
          error,
        );
        // Fallback to keyword matching
        results = this.keywordMatch(results, query);
      }
    }

    // 3. Apply intent-based ranking
    results = this.rankByIntent(results, intent);

    return results;
  }

  /**
   * Calculate semantic score
   */
  private calculateSemanticScore(
    listing: MarketplaceServiceListing,
    query: string,
    kbKeywords: string[],
  ): number {
    let score = 0;
    const queryWords = query.toLowerCase().split(" ");

    // Check title match
    if ("title" in listing) {
      const title = (listing as any).title.toLowerCase();
      for (const word of queryWords) {
        if (title.includes(word)) {
          score += 10;
        }
      }
    }

    // Check description match
    if ("description" in listing) {
      const desc = (listing as any).description?.toLowerCase() || "";
      for (const word of queryWords) {
        if (desc.includes(word)) {
          score += 5;
        }
      }
    }

    // Check KB keyword match
    const listingText = JSON.stringify(listing).toLowerCase();
    for (const keyword of kbKeywords) {
      if (listingText.includes(keyword)) {
        score += 2;
      }
    }

    return score;
  }

  /**
   * Keyword matching fallback
   */
  private keywordMatch(
    listings: MarketplaceServiceListing[],
    query: string,
  ): MarketplaceServiceListing[] {
    const queryWords = query.toLowerCase().split(" ");
    return listings
      .map((listing) => ({
        listing,
        score: this.calculateSemanticScore(listing, query, []),
      }))
      .sort((a, b) => b.score - a.score)
      .map((item) => item.listing);
  }

  /**
   * Rank by intent
   */
  private rankByIntent(
    listings: MarketplaceServiceListing[],
    intent: SearchIntent,
  ): MarketplaceServiceListing[] {
    return listings.sort((a, b) => {
      // For BOOK_NOW intent, prioritize available listings
      if (intent.primaryIntent === "BOOK_NOW") {
        if (a.availability === "AVAILABLE" && b.availability !== "AVAILABLE") {
          return -1;
        }
        if (b.availability === "AVAILABLE" && a.availability !== "AVAILABLE") {
          return 1;
        }
      }

      // For GET_QUOTE, prioritize by rating
      if (intent.primaryIntent === "GET_QUOTE") {
        return b.rating - a.rating;
      }

      // Default: sort by rating and bookings
      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }
      return (b.totalBookings || 0) - (a.totalBookings || 0);
    });
  }

  /**
   * Generate search suggestions
   */
  private async generateSuggestions(
    query: string,
    intent: SearchIntent,
    listings: MarketplaceServiceListing[],
  ): Promise<string[]> {
    const suggestions: string[] = [];

    // If no results, suggest alternatives
    if (listings.length === 0) {
      suggestions.push("Try a broader search term");
      suggestions.push("Check spelling");
      if (intent.entities.serviceType) {
        suggestions.push(
          `Search for ${intent.entities.serviceType.toLowerCase()} services`,
        );
      }
    }

    // Suggest related searches
    if (intent.entities.location) {
      suggestions.push(`Services in ${intent.entities.location}`);
    }

    // Use knowledge base for suggestions
    try {
      const kbSuggestions = await knowledgeBaseService.search({
        query: `related to ${query}`,
        category: "marketplace" as any,
        limit: 3,
      });
      suggestions.push(...kbSuggestions.map((s) => s.title));
    } catch (error) {
      // Ignore errors
    }

    return suggestions.slice(0, 5);
  }

  /**
   * Find related categories
   */
  private async findRelatedCategories(
    intent: SearchIntent,
    listings: MarketplaceServiceListing[],
  ): Promise<MarketplaceServiceCategory[]> {
    const categories = new Set<MarketplaceServiceCategory>();

    // Extract categories from results
    for (const listing of listings.slice(0, 10)) {
      // Determine category from listing
      const category = this.getListingCategory(listing);
      if (category !== "OTHER") {
        categories.add(category);
      }
    }

    return Array.from(categories);
  }

  /**
   * Calculate confidence
   */
  private calculateConfidence(
    intent: SearchIntent,
    listings: MarketplaceServiceListing[],
  ): number {
    let confidence = intent.confidence;

    // Adjust based on results
    if (listings.length === 0) {
      confidence *= 0.5;
    } else if (listings.length > 10) {
      confidence = Math.min(100, confidence * 1.1);
    }

    // Adjust based on entity extraction
    const entityCount = Object.keys(intent.entities).length;
    confidence = Math.min(100, confidence + entityCount * 5);

    return Math.round(confidence);
  }

  /**
   * Calculate intent confidence
   */
  private calculateIntentConfidence(
    query: string,
    intent: SearchIntent["primaryIntent"],
    entities: SearchIntent["entities"],
  ): number {
    let confidence = 50; // Base confidence

    // Intent keywords boost
    const intentKeywords: Record<string, string[]> = {
      FIND_SERVICE: ["find", "search", "looking", "need"],
      COMPARE: ["compare", "vs", "difference", "better"],
      GET_QUOTE: ["quote", "price", "cost", "how much"],
      BOOK_NOW: ["book", "reserve", "order", "now"],
      LEARN_MORE: ["what", "how", "explain", "tell me"],
    };

    const keywords = intentKeywords[intent] || [];
    const lowerQuery = query.toLowerCase();
    for (const keyword of keywords) {
      if (lowerQuery.includes(keyword)) {
        confidence += 10;
      }
    }

    // Entity extraction boost
    confidence += Object.keys(entities).length * 5;

    return Math.min(100, confidence);
  }

  /**
   * Get listing category
   */
  private getListingCategory(
    listing: MarketplaceServiceListing,
  ): MarketplaceServiceCategory {
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
}

// Singleton instance
export const intelligentSearchService = new IntelligentSearchService();
