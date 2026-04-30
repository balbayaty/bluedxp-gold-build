/**
 * Template Marketplace Service
 * Shareable proposal templates with ratings, categories, and community features
 */

import { eventBus } from "@/lib/services/event-store";
import type { DomainEvent } from "@/types/cqrs";

// ============================================================================
// TYPES
// ============================================================================

export interface MarketplaceTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  template: any; // Full template structure
  preview?: {
    thumbnail?: string;
    screenshot?: string;
  };
  stats: {
    downloads: number;
    ratings: number;
    averageRating: number;
    usageCount: number;
  };
  pricing: {
    type: "FREE" | "PREMIUM" | "SUBSCRIPTION";
    price?: number;
    currency?: string;
  };
  license: "MIT" | "COMMERCIAL" | "CUSTOM";
  featured: boolean;
  verified: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface TemplateReview {
  id: string;
  templateId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: Date | string;
}

// ============================================================================
// MARKETPLACE SERVICE
// ============================================================================

class TemplateMarketplaceService {
  private templates: Map<string, MarketplaceTemplate> = new Map();
  private reviews: Map<string, TemplateReview[]> = new Map(); // templateId -> reviews

  constructor() {
    this.initializeDefaultTemplates();
  }

  /**
   * Initialize default marketplace templates
   */
  private initializeDefaultTemplates(): void {
    const defaultTemplates: MarketplaceTemplate[] = [
      {
        id: "marketplace-warehousing-premium",
        name: "Premium Warehousing Proposal",
        description:
          "Comprehensive warehousing proposal template with advanced features",
        category: "WAREHOUSING",
        tags: ["warehousing", "storage", "premium"],
        author: { id: "system", name: "BlueDXP Team" },
        template: {},
        stats: {
          downloads: 1250,
          ratings: 89,
          averageRating: 4.8,
          usageCount: 450,
        },
        pricing: { type: "PREMIUM", price: 99, currency: "SAR" },
        license: "COMMERCIAL",
        featured: true,
        verified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    defaultTemplates.forEach((template) => {
      this.templates.set(template.id, template);
      this.reviews.set(template.id, []);
    });
  }

  /**
   * List marketplace templates
   */
  async listTemplates(filters?: {
    category?: string;
    tags?: string[];
    featured?: boolean;
    verified?: boolean;
    pricing?: "FREE" | "PREMIUM" | "SUBSCRIPTION";
    search?: string;
    sortBy?: "popular" | "rating" | "newest" | "downloads";
  }): Promise<MarketplaceTemplate[]> {
    let templates = Array.from(this.templates.values());

    // Apply filters
    if (filters) {
      if (filters.category) {
        templates = templates.filter((t) => t.category === filters.category);
      }
      if (filters.tags && filters.tags.length > 0) {
        templates = templates.filter((t) =>
          filters.tags!.some((tag) => t.tags.includes(tag)),
        );
      }
      if (filters.featured !== undefined) {
        templates = templates.filter((t) => t.featured === filters.featured);
      }
      if (filters.verified !== undefined) {
        templates = templates.filter((t) => t.verified === filters.verified);
      }
      if (filters.pricing) {
        templates = templates.filter((t) => t.pricing.type === filters.pricing);
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        templates = templates.filter(
          (t) =>
            t.name.toLowerCase().includes(searchLower) ||
            t.description.toLowerCase().includes(searchLower) ||
            t.tags.some((tag) => tag.toLowerCase().includes(searchLower)),
        );
      }
    }

    // Sort
    if (filters?.sortBy) {
      switch (filters.sortBy) {
        case "popular":
          templates.sort((a, b) => b.stats.downloads - a.stats.downloads);
          break;
        case "rating":
          templates.sort(
            (a, b) => b.stats.averageRating - a.stats.averageRating,
          );
          break;
        case "newest":
          templates.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
          break;
        case "downloads":
          templates.sort((a, b) => b.stats.downloads - a.stats.downloads);
          break;
      }
    }

    return templates;
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): MarketplaceTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Publish template to marketplace
   */
  async publishTemplate(
    template: Omit<
      MarketplaceTemplate,
      "id" | "createdAt" | "updatedAt" | "stats"
    >,
  ): Promise<MarketplaceTemplate> {
    const newTemplate: MarketplaceTemplate = {
      ...template,
      id: `marketplace-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      stats: {
        downloads: 0,
        ratings: 0,
        averageRating: 0,
        usageCount: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.templates.set(newTemplate.id, newTemplate);
    this.reviews.set(newTemplate.id, []);

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "proposals.template.published",
      aggregateId: newTemplate.id,
      aggregateType: "TEMPLATE",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: { templateId: newTemplate.id, authorId: template.author.id },
    });

    return newTemplate;
  }

  /**
   * Download template
   */
  async downloadTemplate(
    templateId: string,
    userId: string,
  ): Promise<MarketplaceTemplate | null> {
    const template = this.templates.get(templateId);
    if (!template) return null;

    // Update stats
    template.stats.downloads += 1;
    this.templates.set(templateId, template);

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "proposals.template.downloaded",
      aggregateId: templateId,
      aggregateType: "TEMPLATE",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: { templateId, userId },
    });

    return template;
  }

  /**
   * Add review
   */
  async addReview(
    templateId: string,
    review: Omit<TemplateReview, "id" | "templateId" | "createdAt">,
  ): Promise<TemplateReview> {
    const newReview: TemplateReview = {
      ...review,
      id: `review-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      templateId,
      createdAt: new Date().toISOString(),
    };

    const reviews = this.reviews.get(templateId) || [];
    reviews.push(newReview);
    this.reviews.set(templateId, reviews);

    // Update template rating
    const template = this.templates.get(templateId);
    if (template) {
      const allRatings = reviews.map((r) => r.rating);
      template.stats.ratings = reviews.length;
      template.stats.averageRating =
        allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length;
      this.templates.set(templateId, template);
    }

    return newReview;
  }

  /**
   * Get reviews for template
   */
  getReviews(templateId: string): TemplateReview[] {
    return this.reviews.get(templateId) || [];
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const templateMarketplaceService = new TemplateMarketplaceService();
