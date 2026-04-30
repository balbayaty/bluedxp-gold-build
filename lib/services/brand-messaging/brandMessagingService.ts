/**
 * BlueDXP Brand Messaging Engine
 * Generates on-brand, bilingual messaging using LLM prompt system
 * Fully integrated, adaptive, and intelligent
 */

import { callAI, isAIAvailable, buildSystemPrompt } from "@/utils/aiClient";
import type {
  BrandMessage,
  MessagingContext,
  MessagingType,
  MessagingGenerationRequest,
  BrandVoice,
  MessagingQuality,
  BatchGenerationRequest,
  BatchGenerationResult,
  MessagingTemplate,
} from "@/types/brand-messaging";

// ============================================================================
// BRAND VOICE DEFINITION
// ============================================================================

const BLUEDXP_BRAND_VOICE: BrandVoice = {
  principles: [
    "Confident but not arrogant — We know what we're building matters",
    "Philosophical but practical — We think beyond features to meaning",
    "Precise — Every word earns its place",
    "Arabic-native — Not translated, originated",
    "Human — Technology serves people, not the reverse",
  ],
  philosophy: [
    '"Matter is common. Meaning is rare." — Our core insight',
    "We collapse complexity into clarity",
    "We're an intelligence company that writes code, not a software company",
    "We serve MENA enterprises with respect for their unique context",
    "Every interaction builds or breaks trust",
  ],
  wordsToUse: [
    "Intelligence",
    "clarity",
    "bridge",
    "collapse",
    "compound",
    "infrastructure",
    "trust",
    "meaning",
    "pattern",
    "decision",
    "relationship",
    "connection",
    "insight",
    "precision",
  ],
  wordsToAvoid: [
    "Revolutionary",
    "game-changing",
    "leverage",
    "synergies",
    "best-in-class",
    "cutting-edge",
    "seamless",
    "robust",
    "scalable",
    "disrupt",
    "paradigm",
    "ecosystem",
  ],
  toneCalibration: {
    philosophical: 'Memorable, quotable, captures deeper "why"',
    practical: "Clear, benefit-focused, human",
    confident: "Brief, warm, acknowledges accomplishment",
    dignified: "Honest, helpful, maintains dignity",
    optimistic: "Forward-looking, potential-focused, not apologetic",
    intelligent: "Active, purposeful, suggests system is thinking",
  },
};

// ============================================================================
// MESSAGE TEMPLATES (Fallback when LLM unavailable)
// ============================================================================

const MESSAGE_TEMPLATES: Record<MessagingType, MessagingTemplate[]> = {
  module_header: [
    {
      id: "header-1",
      type: "module_header",
      pattern: {
        en: "{{moduleName}} — where {{purpose}}",
        ar: "{{moduleName}} — حيث {{purpose}}",
      },
      variables: ["moduleName", "purpose"],
      examples: {
        en: ["Warehouse Management — where inventory becomes intelligence"],
        ar: ["إدارة المستودعات — حيث يصبح المخزون ذكاءً"],
      },
      tone: "philosophical",
    },
  ],
  empty_state: [
    {
      id: "empty-1",
      type: "empty_state",
      pattern: {
        en: "No {{items}} yet. {{potential}} awaits.",
        ar: "لا توجد {{items}} بعد. {{potential}} ينتظر.",
      },
      variables: ["items", "potential"],
      examples: {
        en: ["No shipments yet. Every journey awaits its first step."],
        ar: ["لا توجد شحنات بعد. كل رحلة تنتظر خطوتها الأولى."],
      },
      tone: "optimistic",
    },
  ],
  loading_state: [
    {
      id: "loading-1",
      type: "loading_state",
      pattern: {
        en: "Collapsing {{domain}} into clarity...",
        ar: "تحويل {{domain}} إلى وضوح...",
      },
      variables: ["domain"],
      examples: {
        en: ["Collapsing possibilities into clarity..."],
        ar: ["تحويل الاحتمالات إلى وضوح..."],
      },
      tone: "intelligent",
    },
  ],
  success_message: [
    {
      id: "success-1",
      type: "success_message",
      pattern: {
        en: "{{action}} complete. {{implication}}.",
        ar: "اكتمل {{action}}. {{implication}}.",
      },
      variables: ["action", "implication"],
      examples: {
        en: ["Shipment created. The journey begins."],
        ar: ["تم إنشاء الشحنة. تبدأ الرحلة."],
      },
      tone: "confident",
    },
  ],
  error_message: [
    {
      id: "error-1",
      type: "error_message",
      pattern: {
        en: "{{issue}}. {{solution}}.",
        ar: "{{issue}}. {{solution}}.",
      },
      variables: ["issue", "solution"],
      examples: {
        en: ["This didn't work as expected. Try again or contact support."],
        ar: ["لم يعمل هذا كما هو متوقع. حاول مرة أخرى أو اتصل بالدعم."],
      },
      tone: "dignified",
    },
  ],
  notification: [
    {
      id: "notif-1",
      type: "notification",
      pattern: {
        en: "{{title}}: {{body}}",
        ar: "{{title}}: {{body}}",
      },
      variables: ["title", "body"],
      examples: {
        en: ["New Update: Your shipment status has changed."],
        ar: ["تحديث جديد: تغيرت حالة شحنتك."],
      },
      tone: "practical",
    },
  ],
  button_label: [
    {
      id: "button-1",
      type: "button_label",
      pattern: {
        en: "{{action}} {{object}}",
        ar: "{{action}} {{object}}",
      },
      variables: ["action", "object"],
      examples: {
        en: ["Create Shipment"],
        ar: ["إنشاء شحنة"],
      },
      tone: "practical",
    },
  ],
  tooltip: [
    {
      id: "tooltip-1",
      type: "tooltip",
      pattern: {
        en: "{{description}}",
        ar: "{{description}}",
      },
      variables: ["description"],
      examples: {
        en: ["Click to view detailed information"],
        ar: ["انقر لعرض معلومات مفصلة"],
      },
      tone: "practical",
    },
  ],
  dashboard_wisdom: [
    {
      id: "wisdom-1",
      type: "dashboard_wisdom",
      pattern: {
        en: "{{insight}}",
        ar: "{{insight}}",
      },
      variables: ["insight"],
      examples: {
        en: ["The fastest route isn't speed—it's preparation."],
        ar: ["أسرع طريق ليس السرعة—بل الاستعداد."],
      },
      tone: "philosophical",
    },
  ],
  module_description: [
    {
      id: "desc-1",
      type: "module_description",
      pattern: {
        en: "{{moduleName}} helps you {{benefit}}. {{value}}.",
        ar: "{{moduleName}} يساعدك على {{benefit}}. {{value}}.",
      },
      variables: ["moduleName", "benefit", "value"],
      examples: {
        en: [
          "Warehouse Management helps you track inventory. Turn complexity into clarity.",
        ],
        ar: ["إدارة المستودعات تساعدك على تتبع المخزون. حول التعقيد إلى وضوح."],
      },
      tone: "practical",
    },
  ],
  feature_header: [
    {
      id: "feature-1",
      type: "feature_header",
      pattern: {
        en: "{{featureName}}",
        ar: "{{featureName}}",
      },
      variables: ["featureName"],
      examples: {
        en: ["Intelligent Routing"],
        ar: ["التوجيه الذكي"],
      },
      tone: "practical",
    },
  ],
  feature_description: [
    {
      id: "feature-desc-1",
      type: "feature_description",
      pattern: {
        en: "{{featureName}} {{action}} to {{benefit}}.",
        ar: "{{featureName}} {{action}} لـ {{benefit}}.",
      },
      variables: ["featureName", "action", "benefit"],
      examples: {
        en: ["Intelligent Routing optimizes routes to reduce delivery time."],
        ar: ["التوجيه الذكي يحسن المسارات لتقليل وقت التسليم."],
      },
      tone: "practical",
    },
  ],
  onboarding_step: [
    {
      id: "onboard-1",
      type: "onboarding_step",
      pattern: {
        en: "{{stepTitle}}: {{description}}",
        ar: "{{stepTitle}}: {{description}}",
      },
      variables: ["stepTitle", "description"],
      examples: {
        en: ["Welcome: Let's set up your workspace"],
        ar: ["مرحباً: دعنا نعد مساحة عملك"],
      },
      tone: "optimistic",
    },
  ],
  confirmation_dialog: [
    {
      id: "confirm-1",
      type: "confirmation_dialog",
      pattern: {
        en: "{{question}} {{consequence}}",
        ar: "{{question}} {{consequence}}",
      },
      variables: ["question", "consequence"],
      examples: {
        en: ["Are you sure? This action cannot be undone."],
        ar: ["هل أنت متأكد؟ لا يمكن التراجع عن هذا الإجراء."],
      },
      tone: "dignified",
    },
  ],
  section_header: [
    {
      id: "section-1",
      type: "section_header",
      pattern: {
        en: "{{sectionName}}",
        ar: "{{sectionName}}",
      },
      variables: ["sectionName"],
      examples: {
        en: ["Documentation"],
        ar: ["الوثائق"],
      },
      tone: "practical",
    },
  ],
  welcome_message: [
    {
      id: "welcome-1",
      type: "welcome_message",
      pattern: {
        en: "Welcome to {{moduleName}}. {{greeting}}.",
        ar: "مرحباً بك في {{moduleName}}. {{greeting}}.",
      },
      variables: ["moduleName", "greeting"],
      examples: {
        en: ["Welcome to BlueDXP. Let's begin."],
        ar: ["مرحباً بك في BlueDXP. لنبدأ."],
      },
      tone: "optimistic",
    },
  ],
  completion_message: [
    {
      id: "complete-1",
      type: "completion_message",
      pattern: {
        en: "{{achievement}}. {{nextStep}}.",
        ar: "{{achievement}}. {{nextStep}}.",
      },
      variables: ["achievement", "nextStep"],
      examples: {
        en: ["Setup complete. You're ready to begin."],
        ar: ["اكتمل الإعداد. أنت جاهز للبدء."],
      },
      tone: "confident",
    },
  ],
};

// ============================================================================
// BRAND MESSAGING SERVICE
// ============================================================================

class BrandMessagingService {
  private cache: Map<string, BrandMessage> = new Map();
  private qualityThreshold = 70;
  private maxCacheSize = 1000;
  private analytics: Map<string, any> = new Map();
  // Saudi Alignment integration - disabled until service is implemented
  // When Saudi Alignment service is available, uncomment and enable this feature
  // private saudiAlignmentServiceAvailable: boolean | null = null

  /**
   * Generate brand message
   */
  async generateMessage(
    request: MessagingGenerationRequest,
  ): Promise<BrandMessage> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey(request.type, request.context);

    // Check cache if enabled and not regenerating
    if (request.useCache !== false && !request.regenerate) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        this.trackUsage(cached.id, "cache_hit");
        return cached;
      }
    }

    // Build prompt
    const prompt = await this.buildPrompt(request);

    // Generate using LLM or template
    let message: BrandMessage;
    if (
      isAIAvailable() &&
      request.promptConfig?.systemPromptOverride !== "template"
    ) {
      try {
        message = await this.generateWithLLM(prompt, request);
        message.metadata = {
          ...message.metadata,
          generatedBy: "llm",
        };
      } catch (error) {
        console.warn("LLM generation failed, falling back to template:", error);
        message = await this.generateWithTemplate(request);
      }
    } else {
      message = await this.generateWithTemplate(request);
    }

    // Quality check if requested
    if (request.qualityCheck !== false) {
      const quality = await this.checkQuality(message);
      message.metadata = {
        ...message.metadata,
        qualityScore: quality.overallScore,
      };

      // Regenerate if quality is low and LLM is available
      if (
        quality.overallScore < this.qualityThreshold &&
        isAIAvailable() &&
        !request.regenerate
      ) {
        const improvedPrompt = this.improvePrompt(prompt, quality);
        try {
          const improvedMessage = await this.generateWithLLM(improvedPrompt, {
            ...request,
            regenerate: true,
          });
          const improvedQuality = await this.checkQuality(improvedMessage);
          if (improvedQuality.overallScore > quality.overallScore) {
            message = improvedMessage;
            message.metadata = {
              ...message.metadata,
              qualityScore: improvedQuality.overallScore,
            };
          }
        } catch (error) {
          console.warn("Quality improvement failed:", error);
        }
      }
    }

    // Add generation metadata
    const generationTime = Date.now() - startTime;
    message.metadata = {
      ...message.metadata,
      generatedAt: new Date(),
      cacheKey,
      generationTime,
    };

    // Cache result
    this.cacheMessage(cacheKey, message);
    this.trackUsage(message.id, "generated");

    return message;
  }

  /**
   * Build comprehensive LLM prompt
   */
  private async buildPrompt(
    request: MessagingGenerationRequest,
  ): Promise<string> {
    const { type, context, promptConfig = {} } = request;

    let prompt = "";

    // 1. Brand Context (always include unless overridden)
    if (promptConfig.includeBrandContext !== false) {
      prompt += this.getBrandContextBlock();
      prompt += "\n\n";
    }

    // 2. Saudi Context (if applicable and module context exists)
    // NOTE: Saudi Alignment service integration is DISABLED until the service is implemented
    // To enable: Uncomment the code below and implement the Saudi Alignment service
    // if (promptConfig.includeSaudiContext && context.moduleId) {
    //   try {
    //     const { saudiAlignmentService } = await import('@/lib/services/saudi-alignment/saudiAlignmentService')
    //     const saudiContext = await saudiAlignmentService.getCopilotContext(
    //       context.moduleId,
    //       context.metadata?.userId,
    //       context.metadata?.tenantId
    //     )
    //     prompt += this.getSaudiContextBlock(saudiContext)
    //     prompt += '\n\n'
    //   } catch (error) {
    //     console.debug('Saudi context unavailable:', error)
    //   }
    // }

    // 3. Module Context
    if (promptConfig.includeModuleContext !== false && context.moduleId) {
      prompt += this.getModuleContextBlock(context);
      prompt += "\n\n";
    }

    // 4. Type-specific prompt
    prompt += this.getTypeSpecificPrompt(type, context);

    // 5. Output format instructions
    prompt += "\n\nOUTPUT FORMAT:\n";
    prompt += "Provide your response in this exact JSON format:\n";
    prompt += "{\n";
    prompt += '  "en": "English version here",\n';
    prompt += '  "ar": "Arabic version here (original, not translated)",\n';
    prompt += '  "transliteration": "Optional transliteration",\n';
    prompt += '  "backTranslation": "Optional back-translation"\n';
    prompt += "}\n";

    return prompt;
  }

  /**
   * Get brand context block
   */
  private getBrandContextBlock(): string {
    return `
You are generating messaging for BlueDXP OS, an enterprise intelligence platform for MENA logistics, manufacturing, and supply chain operations.

BRAND VOICE PRINCIPLES:
${BLUEDXP_BRAND_VOICE.principles.map((p) => `- ${p}`).join("\n")}

MESSAGING PHILOSOPHY:
${BLUEDXP_BRAND_VOICE.philosophy.map((p) => `- ${p}`).join("\n")}

WORDS WE USE:
${BLUEDXP_BRAND_VOICE.wordsToUse.join(", ")}

WORDS WE AVOID (NEVER USE THESE):
${BLUEDXP_BRAND_VOICE.wordsToAvoid.join(", ")}

TONE CALIBRATION:
- Headers: Philosophical, memorable, quotable
- Descriptions: Clear, benefit-focused, human
- Empty states: Optimistic, forward-looking, not apologetic
- Loading states: Active, intelligent, purposeful
- Errors: Dignified, honest, helpful
- Success: Brief, warm, confident

ARABIC REQUIREMENTS:
- Arabic must be ORIGINAL, not translated
- Use Modern Standard Arabic suitable for business
- Consider Arabic rhetorical traditions (parallelism, proverb-like structures)
- Maintain confident, philosophical tone in Arabic
- Arabic should feel native to MENA business context
    `.trim();
  }

  /**
   * Get Saudi context block
   */
  private getSaudiContextBlock(context: any): string {
    return `
SAUDI ALIGNMENT CONTEXT:
- Operating in Saudi Arabia with Vision 2030 alignment
- Regulatory authorities: ${context.authorityCode || "N/A"}
- Compliance areas: ${context.complianceStatus?.map((s: any) => s.complianceArea).join(", ") || "N/A"}
- Bilingual audience: Arabic and English
- Cultural context: MENA business environment
    `.trim();
  }

  /**
   * Get module context block
   */
  private getModuleContextBlock(context: MessagingContext): string {
    return `
MODULE CONTEXT:
- Module: ${context.moduleName || context.moduleId || "N/A"}
- Feature: ${context.featureName || context.featureId || "N/A"}
- User Role: ${context.userRole || "General User"}
- Action: ${context.action || "N/A"}
- Urgency: ${context.urgency || "medium"}
    `.trim();
  }

  /**
   * Get type-specific prompt
   */
  private getTypeSpecificPrompt(
    type: MessagingType,
    context: MessagingContext,
  ): string {
    const prompts: Record<MessagingType, string> = {
      module_header: `
Generate a MODULE HEADER for BlueDXP:
- Philosophical, memorable, 8-15 words
- Should feel quotable
- Captures the deeper "why" of the module
- Uses contrast or tension where appropriate

Module: ${context.moduleName || context.moduleId}
Purpose: ${context.metadata?.purpose || "Enterprise operations"}

Generate both English and Arabic versions.
      `,
      module_description: `
Generate a MODULE DESCRIPTION for BlueDXP:
- 2-3 sentences
- Clear explanation of value
- Speaks to the user's job-to-be-done
- No jargon

Module: ${context.moduleName || context.moduleId}
      `,
      empty_state: `
Generate an EMPTY STATE MESSAGE for BlueDXP:
- Optimistic and forward-looking
- Should feel like potential, not absence
- Not apologetic

Context: ${context.metadata?.emptyStateContext || "No data yet"}
Entity: ${context.entityType || "items"}
      `,
      loading_state: `
Generate a LOADING STATE MESSAGE for BlueDXP:
- Active, intelligent phrasing
- Suggests the system is thinking/working
- Examples: "Collapsing possibilities into clarity...", "Reading the regulations...", "Finding the signal..."

Action: ${context.action || "Processing"}
Domain: ${context.metadata?.domain || "data"}
      `,
      success_message: `
Generate a SUCCESS MESSAGE for BlueDXP:
- Brief, warm, confident
- Acknowledges what was accomplished
- Examples: "Shipment created. The journey begins.", "Done. What this enables."

Action: ${context.action || "Completed"}
Entity: ${context.entityType || "item"}
      `,
      error_message: `
Generate an ERROR MESSAGE for BlueDXP:
- Honest but not alarming
- Dignified, not apologetic
- Explains what happened in user terms
- Offers clear next step
- Never blames the user

Error Type: ${context.metadata?.errorType || "Unknown"}
Context: ${context.metadata?.errorContext || "An error occurred"}
Recoverable: ${context.metadata?.recoverable !== false ? "Yes" : "No"}
      `,
      notification: `
Generate a NOTIFICATION MESSAGE for BlueDXP:
- Clear indication of what happened
- Appropriate urgency level
- 1-3 sentences

Type: ${context.metadata?.notificationType || "Info"}
Urgency: ${context.urgency || "medium"}
Event: ${context.metadata?.event || "Update"}
      `,
      button_label: `
Generate a BUTTON LABEL for BlueDXP:
- 2-4 words
- Clear action verb
- Specific to what will happen

Action: ${context.action || "N/A"}
Stakes: ${context.metadata?.stakes || "routine"}
      `,
      tooltip: `
Generate a TOOLTIP for BlueDXP:
- 1 sentence
- Ultra-concise explanation
- Written for someone who's never seen this before

Element: ${context.featureName || context.featureId || "N/A"}
Purpose: ${context.metadata?.purpose || "Provide information"}
      `,
      dashboard_wisdom: `
Generate DASHBOARD WISDOM for BlueDXP:
- One philosophical insight
- A truth about the domain that makes users think
- Could work as a tooltip or sidebar quote

Module: ${context.moduleName || context.moduleId}
Domain: ${context.metadata?.domain || "operations"}
      `,
      onboarding_step: `
Generate an ONBOARDING STEP MESSAGE for BlueDXP:
- Clear indication of what this step accomplishes
- Should feel like progress, not bureaucracy
- 1-3 sentences

Step: ${context.metadata?.stepName || "N/A"}
Goal: ${context.metadata?.stepGoal || "N/A"}
Step Number: ${context.metadata?.stepNumber || "1"}
Total Steps: ${context.metadata?.totalSteps || "1"}
      `,
      confirmation_dialog: `
Generate a CONFIRMATION DIALOG for BlueDXP:
- Header: Clear question
- Body: Explains consequences
- Confirm button: Specific action verb
- Cancel button: Simple "Cancel" or contextual alternative

Action: ${context.action || "N/A"}
Consequence: ${context.metadata?.consequence || "This action cannot be undone"}
Reversible: ${context.metadata?.reversible ? "Yes" : "No"}
      `,
      feature_header: `
Generate a FEATURE HEADER for BlueDXP:
- 5-10 words
- Clear but not generic
- Hints at the intelligence or value

Feature: ${context.featureName || context.featureId || "N/A"}
Purpose: ${context.metadata?.purpose || "Enhance operations"}
      `,
      feature_description: `
Generate a FEATURE DESCRIPTION for BlueDXP:
- 1-2 sentences
- Explains what it does in user terms
- Mentions the benefit, not just the function

Feature: ${context.featureName || context.featureId || "N/A"}
Benefit: ${context.metadata?.benefit || "Improves efficiency"}
      `,
      section_header: `
Generate a SECTION HEADER for BlueDXP:
- Concise but meaningful
- Should feel connected to the module's philosophy

Section: ${context.metadata?.sectionName || "N/A"}
Module: ${context.moduleName || context.moduleId}
      `,
      welcome_message: `
Generate a WELCOME MESSAGE for BlueDXP:
- Warm but efficient
- Sets expectations for time/effort
- Should feel like beginning, not ending

Module: ${context.moduleName || context.moduleId}
User: ${context.userRole || "User"}
      `,
      completion_message: `
Generate a COMPLETION MESSAGE for BlueDXP:
- Celebrates without being excessive
- Points to next meaningful action
- Should feel like "beginning" not "ending"

Achievement: ${context.metadata?.achievement || "Task completed"}
Next Step: ${context.metadata?.nextStep || "Continue"}
      `,
    };

    return prompts[type] || "";
  }

  /**
   * Generate message using LLM
   */
  private async generateWithLLM(
    prompt: string,
    request: MessagingGenerationRequest,
  ): Promise<BrandMessage> {
    const systemPrompt = buildSystemPrompt({
      currentPage: request.context.moduleId,
      userRole: request.context.userRole,
    });

    const fullPrompt = `${systemPrompt}\n\n${prompt}`;

    const response = await callAI([
      { role: "system", content: fullPrompt },
      {
        role: "user",
        content: "Generate the messaging now. Return only valid JSON.",
      },
    ]);

    // Parse LLM response
    const parsed = this.parseLLMResponse(response, request.type);

    return {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: request.type,
      context: request.context,
      content: parsed,
    };
  }

  /**
   * Parse LLM response into structured format
   */
  private parseLLMResponse(
    response: string,
    type: MessagingType,
  ): BrandMessage["content"] {
    // Try to extract JSON from response
    try {
      // Look for JSON block
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          en: parsed.en || parsed.english || "",
          ar: parsed.ar || parsed.arabic || "",
          transliteration: parsed.transliteration,
          backTranslation: parsed.backTranslation || parsed["back-translation"],
        };
      }
    } catch (error) {
      console.warn("JSON parsing failed, using text extraction:", error);
    }

    // Fallback: Extract from structured text
    const lines = response.split("\n").filter((l) => l.trim());

    let en = "";
    let ar = "";
    let transliteration = "";
    let backTranslation = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      const nextLine = lines[i + 1]?.trim() || "";

      if ((line.includes("english") || line.includes("en:")) && !en) {
        en = nextLine.replace(/^[-*"']|["']$/g, "").trim();
      } else if ((line.includes("arabic") || line.includes("ar:")) && !ar) {
        ar = nextLine.replace(/^[-*"']|["']$/g, "").trim();
      } else if (line.includes("transliteration") && !transliteration) {
        transliteration = nextLine.replace(/^[-*"']|["']$/g, "").trim();
      } else if (line.includes("back-translation") && !backTranslation) {
        backTranslation = nextLine.replace(/^[-*"']|["']$/g, "").trim();
      }
    }

    // Final fallback: use first meaningful lines
    if (!en && !ar) {
      const meaningfulLines = lines.filter((l) => {
        const trimmed = l.trim();
        return (
          trimmed.length > 10 &&
          !trimmed.toLowerCase().includes("generate") &&
          !trimmed.toLowerCase().includes("example") &&
          !trimmed.toLowerCase().includes("output") &&
          !trimmed.startsWith("#") &&
          !trimmed.startsWith("*")
        );
      });

      en =
        meaningfulLines[0]?.replace(/^[-*"']|["']$/g, "").trim() ||
        response.split("\n")[0]?.trim() ||
        "";
      ar = meaningfulLines[1]?.replace(/^[-*"']|["']$/g, "").trim() || "";
    }

    return {
      en: en || response.trim(),
      ar: ar || "",
      transliteration: transliteration || undefined,
      backTranslation: backTranslation || undefined,
    };
  }

  /**
   * Generate message using template (fallback)
   */
  private async generateWithTemplate(
    request: MessagingGenerationRequest,
  ): Promise<BrandMessage> {
    const templates = MESSAGE_TEMPLATES[request.type] || [];
    const template = templates[0] || {
      pattern: { en: "Message", ar: "رسالة" },
      variables: [],
    };

    // Replace variables in template
    let en = template.pattern.en;
    let ar = template.pattern.ar;

    // Replace context variables
    const replacements: Record<string, string> = {
      moduleName: request.context.moduleName || request.context.moduleId || "",
      featureName:
        request.context.featureName || request.context.featureId || "",
      action: request.context.action || "",
      purpose: request.context.metadata?.purpose || "",
      items: request.context.metadata?.items || "items",
      potential: request.context.metadata?.potential || "Potential",
      domain: request.context.metadata?.domain || "data",
      implication: request.context.metadata?.implication || "",
      issue: request.context.metadata?.issue || "An issue occurred",
      solution: request.context.metadata?.solution || "Please try again",
      title: request.context.metadata?.title || "Notification",
      body: request.context.metadata?.body || "Update available",
      object: request.context.metadata?.object || "item",
      description: request.context.metadata?.description || "Information",
      insight: request.context.metadata?.insight || "Insight",
      benefit: request.context.metadata?.benefit || "benefit",
      value: request.context.metadata?.value || "value",
      stepTitle: request.context.metadata?.stepTitle || "Step",
      description: request.context.metadata?.description || "Description",
      question: request.context.metadata?.question || "Are you sure?",
      consequence:
        request.context.metadata?.consequence || "This action cannot be undone",
      sectionName: request.context.metadata?.sectionName || "Section",
      greeting: request.context.metadata?.greeting || "Welcome",
      achievement: request.context.metadata?.achievement || "Complete",
      nextStep: request.context.metadata?.nextStep || "Continue",
    };

    for (const [key, value] of Object.entries(replacements)) {
      en = en.replace(new RegExp(`{{${key}}}`, "g"), value);
      ar = ar.replace(new RegExp(`{{${key}}}`, "g"), value);
    }

    return {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: request.type,
      context: request.context,
      content: { en, ar },
      metadata: {
        generatedBy: "template",
      },
    };
  }

  /**
   * Check message quality
   */
  private async checkQuality(message: BrandMessage): Promise<MessagingQuality> {
    const enText = message.content.en.toLowerCase();
    const arText = message.content.ar;

    // Voice check
    const avoidsBannedWords = !BLUEDXP_BRAND_VOICE.wordsToAvoid.some((word) =>
      enText.includes(word.toLowerCase()),
    );
    const usesPreferredWords = BLUEDXP_BRAND_VOICE.wordsToUse.some((word) =>
      enText.includes(word.toLowerCase()),
    );
    const quotable =
      message.content.en.length < 100 && message.content.en.length > 10;
    const voiceScore =
      (avoidsBannedWords ? 30 : 0) +
      (usesPreferredWords ? 20 : 0) +
      (quotable ? 20 : 0) +
      (message.content.en.length > 0 ? 30 : 0);

    // Clarity check
    const wordCount = message.content.en.split(" ").length;
    const minimumWords = wordCount >= 3;
    const notTooLong = wordCount <= 50;
    const clarityScore =
      (minimumWords ? 25 : 0) +
      (notTooLong ? 25 : 0) +
      (message.content.en.length > 0 ? 50 : 0);

    // Emotional check
    const hasPositiveTone =
      !enText.includes("sorry") && !enText.includes("unfortunately");
    const feelsHuman =
      !enText.includes("system") || enText.includes("intelligence");
    const emotionalScore =
      (hasPositiveTone ? 25 : 0) +
      (feelsHuman ? 25 : 0) +
      (message.content.en.length > 0 ? 50 : 0);

    // Cultural check
    const arabicFeelsNative =
      arText.length > 0 && arText.length >= message.content.en.length * 0.5;
    const culturalScore =
      (arabicFeelsNative ? 50 : 0) + (message.content.ar.length > 0 ? 50 : 0);

    const overallScore = Math.round(
      voiceScore * 0.3 +
        clarityScore * 0.25 +
        emotionalScore * 0.25 +
        culturalScore * 0.2,
    );

    const recommendations: string[] = [];
    if (!avoidsBannedWords) {
      recommendations.push("Remove banned words from messaging");
    }
    if (!arabicFeelsNative) {
      recommendations.push("Improve Arabic version to feel more native");
    }
    if (wordCount < 3) {
      recommendations.push("Add more context to the message");
    }

    return {
      voiceCheck: {
        soundsLikeBlueDXP: voiceScore > 50,
        confidentNotArrogant: hasPositiveTone,
        avoidsBannedWords,
        quotable,
        score: voiceScore,
      },
      clarityCheck: {
        firstTimeUserUnderstands: clarityScore > 50,
        specificToAction: true,
        avoidsJargon: true,
        minimumWords,
        score: clarityScore,
      },
      emotionalCheck: {
        respectsIntelligence: emotionalScore > 50,
        feelsHuman,
        maintainsDignity: hasPositiveTone,
        acknowledgesWork: true,
        score: emotionalScore,
      },
      culturalCheck: {
        worksForMENA: true,
        appropriateForBusiness: true,
        arabicFeelsNative,
        avoidsWesternAssumptions: true,
        score: culturalScore,
      },
      overallScore,
      recommendations: recommendations.length > 0 ? recommendations : undefined,
    };
  }

  /**
   * Improve prompt based on quality feedback
   */
  private improvePrompt(
    originalPrompt: string,
    quality: MessagingQuality,
  ): string {
    let improved = originalPrompt;

    if (!quality.voiceCheck.avoidsBannedWords) {
      improved +=
        "\n\nCRITICAL: Avoid these words: " +
        BLUEDXP_BRAND_VOICE.wordsToAvoid.join(", ");
    }

    if (!quality.culturalCheck.arabicFeelsNative) {
      improved +=
        "\n\nIMPORTANT: Arabic version must feel native, not translated. Use original Arabic composition that captures the same meaning and feeling.";
    }

    if (quality.overallScore < 50) {
      improved +=
        "\n\nIMPORTANT: Ensure the messaging sounds distinctly like BlueDXP brand voice. Be more philosophical and meaningful.";
    }

    return improved;
  }

  /**
   * Get cache key
   */
  private getCacheKey(type: MessagingType, context: MessagingContext): string {
    const keyParts = [
      type,
      context.moduleId || "",
      context.featureId || "",
      context.action || "",
      context.language || "en",
      JSON.stringify(context.metadata || {}),
    ];
    return keyParts.join("|");
  }

  /**
   * Cache message with size management
   */
  private cacheMessage(key: string, message: BrandMessage): void {
    // Remove oldest if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, message);
  }

  /**
   * Track message usage
   */
  private trackUsage(messageId: string, event: string): void {
    const analytics = this.analytics.get(messageId) || {
      views: 0,
      usageCount: 0,
      events: [],
    };
    analytics.usageCount++;
    analytics.events.push({ event, timestamp: new Date() });
    this.analytics.set(messageId, analytics);
  }

  /**
   * Batch generate messages
   */
  async batchGenerate(
    request: BatchGenerationRequest,
  ): Promise<BatchGenerationResult> {
    const startTime = Date.now();
    const messages: BrandMessage[] = [];
    const errors: Array<{ item: number; error: string }> = [];

    const generateItem = async (item: any, index: number) => {
      try {
        const message = await this.generateMessage({
          type: item.type,
          context: item.context,
        });
        return { index, message };
      } catch (error) {
        errors.push({
          item: index,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        return null;
      }
    };

    if (request.parallel) {
      // Parallel generation
      const results = await Promise.all(
        request.items.map((item, index) => generateItem(item, index)),
      );
      results.forEach((result) => {
        if (result) messages.push(result.message);
      });
    } else {
      // Sequential generation
      for (let i = 0; i < request.items.length; i++) {
        const result = await generateItem(request.items[i], i);
        if (result) messages.push(result.message);
      }
    }

    // Consistency check if requested
    let consistencyScore: number | undefined;
    if (request.consistencyCheck) {
      consistencyScore = this.checkConsistency(messages);
    }

    return {
      messages,
      consistencyScore,
      generationTime: Date.now() - startTime,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Check consistency across batch
   */
  private checkConsistency(messages: BrandMessage[]): number {
    if (messages.length < 2) return 100;

    // Check for repeated phrases
    const allTexts = messages.map((m) => m.content.en.toLowerCase());
    const uniqueTexts = new Set(allTexts);
    const uniquenessScore = (uniqueTexts.size / allTexts.length) * 100;

    // Check tone consistency
    const tones = messages.map((m) => m.context.tone || "practical");
    const toneVariety = new Set(tones).size;
    const toneScore = toneVariety > 1 ? 80 : 100;

    return Math.round((uniquenessScore + toneScore) / 2);
  }

  /**
   * Get message in current language
   */
  getMessageText(message: BrandMessage, language: "en" | "ar" = "en"): string {
    return language === "ar" ? message.content.ar : message.content.en;
  }

  /**
   * Get analytics for message
   */
  getAnalytics(messageId: string): any {
    return (
      this.analytics.get(messageId) || {
        views: 0,
        usageCount: 0,
        events: [],
      }
    );
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hitRate: 0, // Would calculate from analytics
    };
  }
}

// Singleton instance
export const brandMessagingService = new BrandMessagingService();
