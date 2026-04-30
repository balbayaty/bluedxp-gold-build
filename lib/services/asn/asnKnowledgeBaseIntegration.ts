/**
 * ASN Knowledge Base Integration
 * Manages ASN-related knowledge articles, best practices, and FAQs
 * Integrates with platform knowledge base service
 */

import { knowledgeBaseService } from "@/lib/services/knowledge-base/knowledgeBaseService";
import type { ASNData } from "@/types/asn";

export interface ASNKnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: "best_practice" | "troubleshooting" | "faq" | "guide" | "reference";
  tags: string[];
  relatedASNs?: string[];
  createdAt: string;
  updatedAt: string;
}

class ASNKnowledgeBaseIntegration {
  private knowledgeBaseId = "asn-module";

  /**
   * Initialize ASN knowledge base
   */
  async initialize(): Promise<void> {
    try {
      // Create default knowledge articles if they don't exist
      const defaultArticles = this.getDefaultArticles();

      for (const article of defaultArticles) {
        try {
          await knowledgeBaseService.createKnowledgeEntry({
            id: article.id,
            type: "procedure",
            category: "warehouse_operations",
            content: article.content,
            summary: article.title,
            metadata: {
              category: article.category,
              relatedASNs: article.relatedASNs,
              module: "asn",
            },
            keywords: article.tags,
            searchableText: `${article.title} ${article.content}`,
            source: "system",
            sourceId: `asn-module-${article.id}`,
            confidence: 100,
            verified: true,
            feedbackScore: 0,
            usageCount: 0,
            status: "active",
            tenantId: undefined, // Global knowledge
          });
        } catch (error) {
          // Article might already exist, continue
          console.log(`[asn-kb] Article ${article.id} may already exist`);
        }
      }
    } catch (error) {
      console.error("[asn-kb] Error initializing knowledge base:", error);
    }
  }

  /**
   * Get default knowledge articles
   */
  private getDefaultArticles(): ASNKnowledgeArticle[] {
    return [
      {
        id: "asn-001",
        title: "ASN Lifecycle Overview",
        content: `
# ASN Lifecycle Overview

The Advanced Shipping Notice (ASN) lifecycle consists of 12 main stages:

1. **ASN Created** - Document created and awaiting processing
2. **ASN Validated** - ASN validated and ready for scheduling
3. **Receiving Scheduled** - Goods receipt scheduled and dock assigned
4. **In Transit** - Shipment in transit to warehouse
5. **Arrived at Dock** - Shipment arrived at warehouse dock
6. **Receiving in Progress** - Goods receipt process started
7. **Quality Inspection** - Quality inspection in progress (optional)
8. **Putaway Required** - Goods received, putaway required
9. **Putaway in Progress** - Putaway task in progress
10. **Putaway Completed** - All items put away to storage locations
11. **Goods Receipt Posted** - Goods receipt posted to inventory system
12. **ASN Completed** - ASN processing completed successfully

Each stage has SLA targets and can trigger notifications.
        `,
        category: "guide",
        tags: ["lifecycle", "overview", "stages"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "asn-002",
        title: "How to Validate an ASN",
        content: `
# How to Validate an ASN

## Steps to Validate an ASN

1. **Check Required Fields**
   - Document number
   - Vendor information
   - Expected delivery date
   - Destination warehouse
   - Item details

2. **Verify Data Accuracy**
   - Compare with Purchase Order
   - Check vendor details
   - Validate quantities

3. **Review Compliance**
   - Check SLA requirements
   - Verify regulatory compliance
   - Review special requirements

4. **Approve or Reject**
   - Approve if all checks pass
   - Reject with reason if issues found
   - Request clarification if needed

## Common Validation Issues

- Missing vendor information
- Incorrect quantities
- Invalid delivery dates
- Missing compliance documents
        `,
        category: "guide",
        tags: ["validation", "how-to", "process"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "asn-003",
        title: "Troubleshooting ASN Delays",
        content: `
# Troubleshooting ASN Delays

## Common Causes of Delays

1. **Vendor Issues**
   - Late shipment from vendor
   - Incorrect documentation
   - Missing items

2. **Transportation Issues**
   - Carrier delays
   - Route problems
   - Weather conditions

3. **Warehouse Issues**
   - Dock unavailability
   - Equipment breakdown
   - Personnel shortage

## Solutions

1. **Proactive Communication**
   - Contact vendor early
   - Monitor tracking
   - Prepare alternatives

2. **Resource Planning**
   - Schedule docks in advance
   - Reserve equipment
   - Allocate personnel

3. **Process Optimization**
   - Review bottlenecks
   - Improve scheduling
   - Streamline processes
        `,
        category: "troubleshooting",
        tags: ["delays", "troubleshooting", "solutions"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "asn-004",
        title: "SLA Compliance Best Practices",
        content: `
# SLA Compliance Best Practices

## Understanding SLAs

Service Level Agreements (SLAs) define target durations for ASN processing stages.

## Best Practices

1. **Monitor Compliance**
   - Track SLA status regularly
   - Set up alerts for warnings
   - Review compliance reports

2. **Proactive Management**
   - Identify at-risk ASNs early
   - Take corrective action
   - Communicate with stakeholders

3. **Process Optimization**
   - Reduce processing times
   - Eliminate bottlenecks
   - Improve efficiency

4. **Documentation**
   - Record SLA breaches
   - Analyze root causes
   - Implement improvements
        `,
        category: "best_practice",
        tags: ["sla", "compliance", "best-practices"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "asn-005",
        title: "ASN FAQ",
        content: `
# ASN Frequently Asked Questions

## Q: What is an ASN?
A: An Advanced Shipping Notice (ASN) is a document that provides advance notification of a shipment's contents and expected arrival.

## Q: How do I create an ASN?
A: ASNs can be created manually or automatically imported from vendor systems. Use the "Create ASN" button or import via API.

## Q: What happens if an ASN is delayed?
A: The system will send notifications and update SLA compliance status. You can track the delay and take corrective action.

## Q: How do I track an ASN?
A: Use the ASN detail page or real-time tracking. The system provides status updates and location information.

## Q: What is SLA compliance?
A: SLA compliance measures how well ASN processing meets agreed-upon service level targets for each stage.

## Q: Can I export ASN data?
A: Yes, ASN data can be exported in Excel, PDF, or CSV formats using the export functionality.
        `,
        category: "faq",
        tags: ["faq", "common-questions"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  /**
   * Get knowledge articles for ASN context
   */
  async getArticlesForASN(asn: ASNData): Promise<ASNKnowledgeArticle[]> {
    const articles: ASNKnowledgeArticle[] = [];

    try {
      // Get articles based on ASN status
      if (asn.status === "CREATED") {
        const validationArticle = await this.getArticle("asn-002");
        if (validationArticle) articles.push(validationArticle);
      }

      if (asn.status === "IN_TRANSIT" || asn.status === "BLOCKED") {
        const troubleshootingArticle = await this.getArticle("asn-003");
        if (troubleshootingArticle) articles.push(troubleshootingArticle);
      }

      if (
        asn.slaComplianceStatus === "WARNING" ||
        asn.slaComplianceStatus === "CRITICAL"
      ) {
        const slaArticle = await this.getArticle("asn-004");
        if (slaArticle) articles.push(slaArticle);
      }

      // Always include lifecycle overview
      const lifecycleArticle = await this.getArticle("asn-001");
      if (lifecycleArticle) articles.push(lifecycleArticle);
    } catch (error) {
      console.error("[asn-kb] Error getting articles for ASN:", error);
    }

    return articles;
  }

  /**
   * Get specific article
   */
  async getArticle(articleId: string): Promise<ASNKnowledgeArticle | null> {
    try {
      const article = await knowledgeBaseService.getKnowledgeEntry(articleId);
      if (!article) return null;

      return {
        id: article.id,
        title: article.summary || article.id,
        content: article.content,
        category: (article.metadata?.category as any) || "guide",
        tags: article.keywords || [],
        relatedASNs: article.metadata?.relatedASNs || [],
        createdAt: article.createdAt || new Date().toISOString(),
        updatedAt: article.updatedAt || new Date().toISOString(),
      };
    } catch (error) {
      console.error("[asn-kb] Error getting article:", error);
      return null;
    }
  }

  /**
   * Search knowledge base
   */
  async searchArticles(query: string): Promise<ASNKnowledgeArticle[]> {
    try {
      const results = await knowledgeBaseService.search({
        query,
        filters: {
          sources: ["system"],
        },
        limit: 10,
      });

      return results
        .filter((result) => result.entry.metadata?.module === "asn")
        .map((result) => ({
          id: result.entry.id,
          title: result.entry.summary || result.entry.id,
          content: result.entry.content,
          category: (result.entry.metadata?.category as any) || "guide",
          tags: result.entry.keywords || [],
          relatedASNs: result.entry.metadata?.relatedASNs || [],
          createdAt: result.entry.createdAt || new Date().toISOString(),
          updatedAt: result.entry.updatedAt || new Date().toISOString(),
        }));
    } catch (error) {
      console.error("[asn-kb] Error searching articles:", error);
      return [];
    }
  }

  /**
   * Create custom knowledge article
   */
  async createArticle(
    article: Omit<ASNKnowledgeArticle, "id" | "createdAt" | "updatedAt">,
  ): Promise<ASNKnowledgeArticle> {
    const id = `asn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    try {
      const entry = await knowledgeBaseService.createKnowledgeEntry({
        id,
        type: "procedure",
        category: "warehouse_operations",
        content: article.content,
        summary: article.title,
        metadata: {
          category: article.category,
          relatedASNs: article.relatedASNs,
          module: "asn",
        },
        keywords: article.tags,
        searchableText: `${article.title} ${article.content}`,
        source: "user",
        sourceId: `asn-module-${id}`,
        confidence: 80,
        verified: false,
        feedbackScore: 0,
        usageCount: 0,
        status: "active",
        tenantId: undefined,
      });

      return {
        id: entry.id,
        ...article,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      };
    } catch (error) {
      console.error("[asn-kb] Error creating article:", error);
      throw error;
    }
  }
}

export const asnKnowledgeBaseIntegration = new ASNKnowledgeBaseIntegration();

// Initialize on module load
if (typeof window === "undefined") {
  asnKnowledgeBaseIntegration.initialize().catch((err) => {
    console.error("[asn-kb] Failed to initialize on module load:", err);
  });
}
