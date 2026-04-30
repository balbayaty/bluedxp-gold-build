/**
 * 📚 MARKET DATA KNOWLEDGE BASE INTEGRATION
 * Stores market insights, analyses, and historical context
 * Integrates with existing Knowledge Base service
 */

import { eventBus } from '@/lib/services/event-store';
import type { StockQuote, SupplyChainImpact, MarketAnalysis } from '@/types/market-data';

interface MarketInsight {
  id: string;
  type: 'price_movement' | 'supply_chain_impact' | 'market_trend' | 'recommendation';
  title: string;
  content: string;
  relevance: number;
  confidence: number;
  symbols: string[];
  tags: string[];
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class MarketDataKnowledgeBase {
  private static instance: MarketDataKnowledgeBase;
  private insights: Map<string, MarketInsight> = new Map();

  private constructor() {
    this.initializeEventSubscriptions();
  }

  static getInstance(): MarketDataKnowledgeBase {
    if (!MarketDataKnowledgeBase.instance) {
      MarketDataKnowledgeBase.instance = new MarketDataKnowledgeBase();
    }
    return MarketDataKnowledgeBase.instance;
  }

  /**
   * Initialize event subscriptions to capture market data events
   */
  private initializeEventSubscriptions(): void {
    // Subscribe to market data events
    eventBus.subscribe('market_data.quotes.fetched', async (event) => {
      await this.processQuotesFetched(event.data);
    });

    eventBus.subscribe('market_data.supply_chain_impact', async (event) => {
      await this.processSupplyChainImpact(event.data);
    });

    eventBus.subscribe('market_data.timeseries.fetched', async (event) => {
      await this.processTimeSeriesFetched(event.data);
    });
  }

  /**
   * Process quotes fetched event and generate insights
   */
  private async processQuotesFetched(data: any): Promise<void> {
    const { symbols, count } = data;

    // Generate insight about market activity
    const insight: MarketInsight = {
      id: `insight-quotes-${Date.now()}`,
      type: 'market_trend',
      title: 'Market Data Update',
      content: `Updated quotes for ${count} symbols: ${symbols.join(', ')}`,
      relevance: 60,
      confidence: 95,
      symbols,
      tags: ['market_data', 'real_time', 'quotes'],
      timestamp: new Date(),
    };

    this.insights.set(insight.id, insight);

    // Publish insight event
    await eventBus.publish({
      type: 'knowledge_base.insight.created',
      payload: {
        category: 'market_data',
        insight,
      },
    });
  }

  /**
   * Process supply chain impact and store as knowledge
   */
  private async processSupplyChainImpact(impact: SupplyChainImpact): Promise<void> {
    const insight: MarketInsight = {
      id: `insight-impact-${impact.marketSymbol}-${Date.now()}`,
      type: 'supply_chain_impact',
      title: `Supply Chain Impact: ${impact.marketSymbol}`,
      content: `${impact.description}\n\nRecommendations:\n${impact.recommendations.map(r => `- ${r}`).join('\n')}`,
      relevance: this.calculateRelevance(impact),
      confidence: impact.confidence,
      symbols: [impact.marketSymbol],
      tags: [
        'supply_chain',
        'impact_analysis',
        impact.impactedArea,
        impact.impactSeverity,
      ],
      timestamp: new Date(),
      metadata: {
        impactType: impact.impactType,
        impactSeverity: impact.impactSeverity,
        marketChange: impact.marketChange,
      },
    };

    this.insights.set(insight.id, insight);

    // Publish to knowledge base
    await eventBus.publish({
      type: 'knowledge_base.insight.created',
      payload: {
        category: 'supply_chain_intelligence',
        insight,
      },
    });

    // If impact is high or critical, publish alert
    if (['high', 'critical'].includes(impact.impactSeverity)) {
      await eventBus.publish({
        type: 'alerts.supply_chain.market_impact',
        payload: {
          severity: impact.impactSeverity,
          symbol: impact.marketSymbol,
          impact,
        },
      });
    }
  }

  /**
   * Process time series data and identify trends
   */
  private async processTimeSeriesFetched(data: any): Promise<void> {
    const { symbol, interval, dataPoints } = data;

    if (dataPoints > 0) {
      const insight: MarketInsight = {
        id: `insight-timeseries-${symbol}-${Date.now()}`,
        type: 'market_trend',
        title: `Time Series Data: ${symbol}`,
        content: `Historical data fetched for ${symbol} (${interval} interval, ${dataPoints} points)`,
        relevance: 50,
        confidence: 90,
        symbols: [symbol],
        tags: ['time_series', 'historical_data', interval],
        timestamp: new Date(),
      };

      this.insights.set(insight.id, insight);
    }
  }

  /**
   * Get insights for specific symbols
   */
  async getInsightsForSymbols(symbols: string[]): Promise<MarketInsight[]> {
    const results: MarketInsight[] = [];

    for (const insight of this.insights.values()) {
      if (insight.symbols.some(s => symbols.includes(s))) {
        results.push(insight);
      }
    }

    // Sort by relevance and recency
    return results.sort((a, b) => {
      const relevanceDiff = b.relevance - a.relevance;
      if (relevanceDiff !== 0) return relevanceDiff;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }

  /**
   * Get recent insights
   */
  async getRecentInsights(limit: number = 10): Promise<MarketInsight[]> {
    const allInsights = Array.from(this.insights.values());
    
    return allInsights
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Search insights by query
   */
  async searchInsights(query: string): Promise<MarketInsight[]> {
    const queryLower = query.toLowerCase();
    const results: MarketInsight[] = [];

    for (const insight of this.insights.values()) {
      if (
        insight.title.toLowerCase().includes(queryLower) ||
        insight.content.toLowerCase().includes(queryLower) ||
        insight.symbols.some(s => s.toLowerCase().includes(queryLower)) ||
        insight.tags.some(t => t.toLowerCase().includes(queryLower))
      ) {
        results.push(insight);
      }
    }

    return results.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Calculate relevance score for impact
   */
  private calculateRelevance(impact: SupplyChainImpact): number {
    let score = 50; // Base score

    // Increase based on severity
    const severityScores: Record<string, number> = {
      low: 10,
      medium: 20,
      high: 30,
      critical: 40,
    };
    score += severityScores[impact.impactSeverity] || 0;

    // Increase based on change magnitude
    score += Math.min(Math.abs(impact.marketChange) * 2, 10);

    return Math.min(score, 100);
  }

  /**
   * Generate daily market summary
   */
  async generateDailySummary(): Promise<MarketInsight> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayInsights = Array.from(this.insights.values()).filter(
      insight => insight.timestamp >= today
    );

    const summary: MarketInsight = {
      id: `summary-daily-${today.getTime()}`,
      type: 'market_trend',
      title: 'Daily Market Summary',
      content: this.generateSummaryContent(todayInsights),
      relevance: 100,
      confidence: 85,
      symbols: [...new Set(todayInsights.flatMap(i => i.symbols))],
      tags: ['daily_summary', 'market_overview'],
      timestamp: new Date(),
      metadata: {
        insightCount: todayInsights.length,
        date: today.toISOString(),
      },
    };

    this.insights.set(summary.id, summary);

    // Publish summary
    await eventBus.publish({
      type: 'knowledge_base.daily_summary.created',
      payload: {
        category: 'market_data',
        summary,
      },
    });

    return summary;
  }

  /**
   * Generate summary content from insights
   */
  private generateSummaryContent(insights: MarketInsight[]): string {
    if (insights.length === 0) {
      return 'No significant market activity today.';
    }

    const impactInsights = insights.filter(i => i.type === 'supply_chain_impact');
    const trendInsights = insights.filter(i => i.type === 'market_trend');

    let content = `Market Activity Summary (${insights.length} events)\n\n`;

    if (impactInsights.length > 0) {
      content += `Supply Chain Impacts: ${impactInsights.length}\n`;
      content += impactInsights
        .slice(0, 3)
        .map(i => `- ${i.title}`)
        .join('\n');
      content += '\n\n';
    }

    if (trendInsights.length > 0) {
      content += `Market Updates: ${trendInsights.length}\n`;
    }

    return content;
  }

  /**
   * Clear old insights (older than 30 days)
   */
  async cleanupOldInsights(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let deletedCount = 0;

    for (const [id, insight] of this.insights.entries()) {
      if (insight.timestamp < thirtyDaysAgo) {
        this.insights.delete(id);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      await eventBus.publish({
        type: 'knowledge_base.cleanup.completed',
        payload: {
          category: 'market_data',
          deletedCount,
        },
      });
    }

    return deletedCount;
  }
}

// Export singleton instance
export const marketDataKnowledgeBase = MarketDataKnowledgeBase.getInstance();

export default marketDataKnowledgeBase;
