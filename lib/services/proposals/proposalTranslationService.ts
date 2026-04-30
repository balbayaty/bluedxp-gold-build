/**
 * Proposal Translation Service
 * Multi-language support with auto-translation and RTL support
 */

import { eventBus } from "@/lib/services/event-store";
import type { DomainEvent } from "@/types/cqrs";

// ============================================================================
// TYPES
// ============================================================================

export type SupportedLanguage = "en" | "ar" | "fr" | "es" | "de" | "zh" | "ja";

export interface ProposalTranslation {
  proposalId: string;
  language: SupportedLanguage;
  translatedContent: {
    title: string;
    description?: string;
    executiveSummary?: string;
    sections: Array<{
      id: string;
      title: string;
      content: string;
    }>;
  };
  autoTranslated: boolean;
  translatedAt: Date | string;
  translatorId?: string;
}

export interface TranslationConfig {
  sourceLanguage: SupportedLanguage;
  targetLanguages: SupportedLanguage[];
  autoTranslate?: boolean;
  preserveFormatting?: boolean;
  translateNumbers?: boolean;
}

// ============================================================================
// TRANSLATION SERVICE
// ============================================================================

class ProposalTranslationService {
  private translations: Map<
    string,
    Map<SupportedLanguage, ProposalTranslation>
  > = new Map(); // proposalId -> language -> translation

  constructor() {
    this.initializeEventHandlers();
  }

  /**
   * Initialize event handlers
   */
  private initializeEventHandlers(): void {
    eventBus.subscribe(
      "proposals.proposal.created",
      async (event: DomainEvent) => {
        // Auto-translate if configured
      },
    );
  }

  /**
   * Translate proposal
   */
  async translateProposal(
    proposalId: string,
    targetLanguage: SupportedLanguage,
    config?: TranslationConfig,
  ): Promise<ProposalTranslation> {
    // In production, would integrate with translation API (Google Translate, DeepL, etc.)
    // For now, return mock translation

    const translation: ProposalTranslation = {
      proposalId,
      language: targetLanguage,
      translatedContent: {
        title: "Translated Title", // Would translate actual title
        sections: [],
      },
      autoTranslated: config?.autoTranslate !== false,
      translatedAt: new Date().toISOString(),
    };

    if (!this.translations.has(proposalId)) {
      this.translations.set(proposalId, new Map());
    }
    this.translations.get(proposalId)!.set(targetLanguage, translation);

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "proposals.proposal.translated",
      aggregateId: proposalId,
      aggregateType: "PROPOSAL",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: { proposalId, targetLanguage },
    });

    return translation;
  }

  /**
   * Get translation
   */
  getTranslation(
    proposalId: string,
    language: SupportedLanguage,
  ): ProposalTranslation | undefined {
    return this.translations.get(proposalId)?.get(language);
  }

  /**
   * Get all translations for proposal
   */
  getAllTranslations(proposalId: string): ProposalTranslation[] {
    const translationsMap = this.translations.get(proposalId);
    if (!translationsMap) return [];
    return Array.from(translationsMap.values());
  }

  /**
   * Detect language
   */
  detectLanguage(text: string): SupportedLanguage {
    // Simplified detection - in production would use proper language detection
    if (/[\u0600-\u06FF]/.test(text)) return "ar"; // Arabic
    return "en"; // Default to English
  }

  /**
   * Check if language is RTL
   */
  isRTL(language: SupportedLanguage): boolean {
    return language === "ar"; // Arabic is RTL
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const proposalTranslationService = new ProposalTranslationService();
