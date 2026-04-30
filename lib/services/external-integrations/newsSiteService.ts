/**
 * News Site Integration Service
 * RSS feed parsing and web scraping for news sites
 * Supports RSS feeds, API-based news, and web scraping
 */

import { BaseIntegrationService } from "./baseIntegrationService";
import type {
  NewsSiteIntegration,
  NewsArticle,
  IntegrationResponse,
} from "@/types/external-integrations";
import axios from "axios";

interface RSSFeed {
  title: string;
  description: string;
  link: string;
  items: RSSItem[];
}

interface RSSItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  author?: string;
  category?: string[];
  guid?: string;
}

export class NewsSiteService extends BaseIntegrationService {
  protected integrationType = "NEWS_SITE" as const;

  /**
   * Connect news site integration
   */
  async connect(
    integration: Partial<NewsSiteIntegration>,
  ): Promise<NewsSiteIntegration> {
    if (!integration.config?.url && !integration.config?.feedUrl) {
      throw new Error("URL or feed URL required for news site connection");
    }

    // Test connection by fetching feed
    const feedUrl = integration.config.feedUrl || integration.config.url;
    await this.fetchRSSFeed(feedUrl);

    const newsIntegration: NewsSiteIntegration = {
      id: integration.id || `news_${Date.now()}`,
      type: integration.config.feedUrl ? "RSS_FEED" : "NEWS_SITE",
      name: integration.name || `News - ${new URL(feedUrl).hostname}`,
      status: "CONNECTED",
      tenantId: integration.tenantId || "",
      userId: integration.userId,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSyncAt: new Date(),
      config: {
        url: integration.config.url || feedUrl,
        feedUrl,
        refreshInterval: integration.config.refreshInterval || 3600, // 1 hour default
        maxArticles: integration.config.maxArticles || 50,
        filters: integration.config.filters,
        scrapingConfig: integration.config.scrapingConfig,
      },
    };

    this.emitEvent(
      "connected",
      { integrationId: newsIntegration.id },
      newsIntegration.id,
    );
    return newsIntegration;
  }

  /**
   * Disconnect news site integration
   */
  async disconnect(integrationId: string): Promise<void> {
    this.emitEvent("disconnected", { integrationId }, integrationId);
  }

  /**
   * Sync news articles
   */
  async sync(integrationId: string): Promise<void> {
    this.emitEvent("sync_started", { integrationId }, integrationId);

    // Get integration from storage (would be from database)
    // Fetch latest articles
    // Store in database

    this.emitEvent("sync_completed", { integrationId }, integrationId);
  }

  /**
   * Get integration status
   */
  async getStatus(
    integrationId: string,
  ): Promise<"CONNECTED" | "DISCONNECTED" | "PENDING" | "ERROR" | "EXPIRED"> {
    // Test feed accessibility
    return "CONNECTED";
  }

  /**
   * Get news articles
   */
  async getData(
    integrationId: string,
    options?: Record<string, any>,
  ): Promise<NewsArticle[]> {
    // Get integration config
    // Fetch articles based on options (limit, filters, etc.)
    const feedUrl = options?.feedUrl || "";
    if (!feedUrl) {
      return [];
    }

    return await this.fetchArticles(feedUrl, options);
  }

  /**
   * Update configuration
   */
  async updateConfig(
    integrationId: string,
    config: Record<string, any>,
  ): Promise<NewsSiteIntegration> {
    // This method is called by IntegrationManager which handles database updates
    // IntegrationManager will get the integration from database, merge config, and save
    return {
      id: integrationId,
      type: "NEWS_SITE",
      name: "News Site Integration",
      status: "CONNECTED",
      tenantId: "",
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      config: config, // Return merged config (IntegrationManager handles the merge)
    } as NewsSiteIntegration;
  }

  /**
   * Fetch RSS feed
   */
  async fetchRSSFeed(feedUrl: string): Promise<RSSFeed> {
    try {
      const response = await axios.get(feedUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Hazalyze/1.0)",
        },
        timeout: 10000,
      });

      // Parse RSS/XML
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(response.data, "text/xml");

      const channel = xmlDoc.querySelector("channel");
      if (!channel) {
        throw new Error("Invalid RSS feed format");
      }

      const items = Array.from(channel.querySelectorAll("item")).map((item) => {
        const title = item.querySelector("title")?.textContent || "";
        const description =
          item.querySelector("description")?.textContent || "";
        const link = item.querySelector("link")?.textContent || "";
        const pubDate = item.querySelector("pubDate")?.textContent || "";
        const author =
          item.querySelector("author")?.textContent ||
          item.querySelector("dc:creator")?.textContent;
        const categories = Array.from(item.querySelectorAll("category")).map(
          (cat) => cat.textContent || "",
        );

        return {
          title,
          description,
          link,
          pubDate,
          author,
          category: categories,
          guid: item.querySelector("guid")?.textContent,
        };
      });

      return {
        title: channel.querySelector("title")?.textContent || "",
        description: channel.querySelector("description")?.textContent || "",
        link: channel.querySelector("link")?.textContent || "",
        items,
      };
    } catch (error: any) {
      // If RSS parsing fails, try JSON feed
      try {
        const response = await axios.get(feedUrl);
        const json = response.data;

        if (json.version && json.items) {
          // JSON Feed format
          return {
            title: json.title || "",
            description: json.description || "",
            link: json.home_page_url || "",
            items: json.items.map((item: any) => ({
              title: item.title || "",
              description:
                item.content_html || item.content_text || item.summary || "",
              link: item.url || "",
              pubDate: item.date_published || "",
              author: item.authors?.[0]?.name,
              category: item.tags,
              guid: item.id,
            })),
          };
        }
      } catch (jsonError) {
        // If both fail, throw original error
      }

      throw new Error(`Failed to fetch RSS feed: ${error.message}`);
    }
  }

  /**
   * Fetch articles from feed
   */
  async fetchArticles(
    feedUrl: string,
    options?: {
      limit?: number;
      filters?: {
        keywords?: string[];
        categories?: string[];
        dateRange?: {
          start?: Date;
          end?: Date;
        };
      };
    },
  ): Promise<NewsArticle[]> {
    const feed = await this.fetchRSSFeed(feedUrl);
    const limit = options?.limit || 50;
    const filters = options?.filters;

    let articles: NewsArticle[] = feed.items
      .slice(0, limit)
      .map((item, index) => {
        const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();

        return {
          id: item.guid || `article_${index}_${Date.now()}`,
          title: item.title,
          content: item.description,
          summary: this.extractSummary(item.description),
          author: item.author,
          publishedAt,
          url: item.link,
          category: item.category?.[0],
          tags: item.category,
          source: new URL(feedUrl).hostname,
        };
      });

    // Apply filters
    if (filters) {
      if (filters.keywords && filters.keywords.length > 0) {
        const keywordRegex = new RegExp(filters.keywords.join("|"), "i");
        articles = articles.filter(
          (article) =>
            keywordRegex.test(article.title) ||
            keywordRegex.test(article.content),
        );
      }

      if (filters.categories && filters.categories.length > 0) {
        articles = articles.filter(
          (article) =>
            article.category && filters.categories!.includes(article.category),
        );
      }

      if (filters.dateRange) {
        if (filters.dateRange.start) {
          articles = articles.filter(
            (article) => article.publishedAt >= filters.dateRange!.start!,
          );
        }
        if (filters.dateRange.end) {
          articles = articles.filter(
            (article) => article.publishedAt <= filters.dateRange!.end!,
          );
        }
      }
    }

    return articles;
  }

  /**
   * Extract summary from content (first 200 characters)
   */
  private extractSummary(content: string): string {
    // Remove HTML tags
    const text = content.replace(/<[^>]*>/g, "");
    // Return first 200 characters
    return text.length > 200 ? text.substring(0, 200) + "..." : text;
  }

  /**
   * Scrape article from URL (server-side only - would need proper scraping library)
   */
  async scrapeArticle(
    url: string,
    selectors?: {
      title?: string;
      content?: string;
      date?: string;
      author?: string;
    },
  ): Promise<Partial<NewsArticle>> {
    // Note: This is a simplified example
    // In production, you'd use a proper scraping library like Puppeteer, Playwright, or Cheerio
    // This should run server-side only

    try {
      const response = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Hazalyze/1.0)",
        },
      });

      // Basic HTML parsing (would use Cheerio in production)
      const parser = new DOMParser();
      const doc = parser.parseFromString(response.data, "text/html");

      return {
        title: selectors?.title
          ? doc.querySelector(selectors.title)?.textContent || ""
          : doc.querySelector("h1")?.textContent || "",
        content: selectors?.content
          ? doc.querySelector(selectors.content)?.textContent || ""
          : "",
        author: selectors?.author
          ? doc.querySelector(selectors.author)?.textContent
          : undefined,
        publishedAt: selectors?.date
          ? new Date(doc.querySelector(selectors.date)?.textContent || "")
          : new Date(),
      };
    } catch (error: any) {
      throw new Error(`Failed to scrape article: ${error.message}`);
    }
  }
}

export const newsSiteService = new NewsSiteService();
