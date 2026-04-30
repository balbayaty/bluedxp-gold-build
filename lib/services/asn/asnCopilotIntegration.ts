/**
 * ASN Copilot Integration
 * Provides context-aware AI assistance for ASN operations
 * Integrates with HazalyzeCopilot
 */

import { contextService } from "@/lib/services/copilot/contextService";
import { asnService } from "./asnService";
import { asnAIService } from "./asnAIService";
import type { ASNData } from "@/types/asn";

export interface ASNCopilotContext {
  module: "asn";
  currentASN?: ASNData;
  viewMode?: "list" | "detail" | "analytics";
  filters?: Record<string, any>;
  insights?: any[];
}

class ASNCopilotIntegration {
  /**
   * Set ASN context for Copilot
   */
  async setASNContext(context: ASNCopilotContext): Promise<void> {
    contextService.setContext({
      module: "asn",
      page: context.viewMode || "list",
      entityId: context.currentASN?.id,
      ...context,
    });

    // If ASN is provided, load insights
    if (context.currentASN) {
      try {
        const insights = await asnAIService.getASNInsights(
          context.currentASN.id,
        );
        contextService.updateContext({
          insights,
        });
      } catch (error) {
        console.error("[asn-copilot] Error loading insights:", error);
      }
    }
  }

  /**
   * Get Copilot suggestions based on current context
   */
  async getCopilotSuggestions(context: ASNCopilotContext): Promise<
    Array<{
      question: string;
      action: string;
      category:
        | "status"
        | "analytics"
        | "optimization"
        | "troubleshooting"
        | "general";
    }>
  > {
    const suggestions: Array<{
      question: string;
      action: string;
      category:
        | "status"
        | "analytics"
        | "optimization"
        | "troubleshooting"
        | "general";
    }> = [];

    if (context.currentASN) {
      // ASN-specific suggestions
      const asn = context.currentASN;

      // Status-based suggestions
      if (asn.status === "CREATED") {
        suggestions.push({
          question: "How do I validate this ASN?",
          action: "validate_asn",
          category: "status",
        });
        suggestions.push({
          question: "What are the next steps for this ASN?",
          action: "next_steps",
          category: "status",
        });
      }

      if (asn.status === "IN_TRANSIT") {
        suggestions.push({
          question: "Where is this shipment currently?",
          action: "track_shipment",
          category: "status",
        });
        suggestions.push({
          question: "When will this shipment arrive?",
          action: "estimated_arrival",
          category: "status",
        });
      }

      if (asn.status === "BLOCKED" || asn.status === "ON_HOLD") {
        suggestions.push({
          question: "Why is this ASN blocked?",
          action: "block_reason",
          category: "troubleshooting",
        });
        suggestions.push({
          question: "How do I unblock this ASN?",
          action: "unblock_asn",
          category: "troubleshooting",
        });
      }

      // Analytics suggestions
      suggestions.push({
        question: "What are the AI insights for this ASN?",
        action: "get_insights",
        category: "analytics",
      });
      suggestions.push({
        question: "What is the SLA compliance status?",
        action: "sla_status",
        category: "analytics",
      });

      // Optimization suggestions
      if (asn.processType === "INBOUND") {
        suggestions.push({
          question: "How can I optimize the receiving process?",
          action: "optimize_receiving",
          category: "optimization",
        });
      }

      if (asn.processType === "OUTBOUND") {
        suggestions.push({
          question: "How can I optimize the picking process?",
          action: "optimize_picking",
          category: "optimization",
        });
      }
    } else {
      // General suggestions for list view
      suggestions.push({
        question: "Show me ASNs that need attention",
        action: "filter_attention_needed",
        category: "general",
      });
      suggestions.push({
        question: "What are the current bottlenecks?",
        action: "bottleneck_analysis",
        category: "analytics",
      });
      suggestions.push({
        question: "Show me ASNs with SLA breaches",
        action: "filter_sla_breaches",
        category: "analytics",
      });
      suggestions.push({
        question: "What are the predictive analytics?",
        action: "predictive_analytics",
        category: "analytics",
      });
    }

    return suggestions;
  }

  /**
   * Build system prompt for ASN context
   */
  buildSystemPrompt(context: ASNCopilotContext): string {
    let prompt = `You are HazalyzeCopilot, an AI assistant for the BlueDXP platform's ASN (Advanced Shipping Notice) module.

Current Context:
- Module: ASN Management
- View: ${context.viewMode || "list"}
`;

    if (context.currentASN) {
      const asn = context.currentASN;
      prompt += `
Current ASN:
- Document Number: ${asn.documentNumber}
- Status: ${asn.status}
- Process Type: ${asn.processType}
- Vendor: ${asn.vendorName} (${asn.vendorNumber})
- Expected Delivery: ${asn.expectedDeliveryDate}
- Destination: ${asn.destination}
`;

      if (asn.slaComplianceStatus) {
        prompt += `- SLA Compliance: ${asn.slaComplianceStatus}\n`;
      }

      if (context.insights && context.insights.length > 0) {
        prompt += `\nAI Insights Available:\n`;
        context.insights.slice(0, 3).forEach((insight, i) => {
          prompt += `${i + 1}. ${insight.title}: ${insight.description}\n`;
        });
      }
    }

    prompt += `
Capabilities:
- Answer questions about ASN status, lifecycle, and processes
- Provide insights and recommendations
- Help troubleshoot issues
- Suggest optimizations
- Explain SLA compliance and metrics
- Guide users through ASN workflows

Always be helpful, concise, and actionable. If you need more information, ask clarifying questions.
`;

    return prompt;
  }

  /**
   * Handle Copilot actions
   */
  async handleCopilotAction(
    action: string,
    context: ASNCopilotContext,
  ): Promise<{
    response: string;
    data?: any;
    actionUrl?: string;
  }> {
    switch (action) {
      case "validate_asn":
        if (context.currentASN) {
          return {
            response: `To validate ASN ${context.currentASN.documentNumber}, you need to check all required fields are complete and accurate. Would you like me to check the validation status?`,
            actionUrl: `/process-lifecycle/lifecycle/ASN/${context.currentASN.id}`,
          };
        }
        break;

      case "get_insights":
        if (context.currentASN) {
          const insights = await asnAIService.getASNInsights(
            context.currentASN.id,
          );
          return {
            response: `I found ${insights.length} AI insights for this ASN. The most critical is: ${insights[0]?.title || "No critical insights"}.`,
            data: insights,
            actionUrl: `/process-lifecycle/lifecycle/ASN/${context.currentASN.id}`,
          };
        }
        break;

      case "sla_status":
        if (context.currentASN) {
          const asn = context.currentASN;
          return {
            response: `SLA Compliance Status: ${asn.slaComplianceStatus || "NOT_APPLICABLE"}. ${asn.slaBreachReason ? `Reason: ${asn.slaBreachReason}` : "All SLAs are being met."}`,
            data: {
              slaComplianceStatus: asn.slaComplianceStatus,
              slaBreachReason: asn.slaBreachReason,
              slaCompliancePercentage: asn.slaCompliancePercentage,
            },
          };
        }
        break;

      case "predictive_analytics":
        const analytics = await asnAIService.getPredictiveAnalytics(
          context.filters,
        );
        return {
          response: `Predictive Analytics: ${analytics.predictedDelays} out of ${analytics.totalASNs} ASNs are predicted to have delays. Overall risk score: ${analytics.riskScore}/100.`,
          data: analytics,
          actionUrl: `/process-lifecycle/analytics/ASN`,
        };

      case "bottleneck_analysis":
        return {
          response:
            "I can analyze bottlenecks in the ASN process. This requires analyzing process mining data. Would you like me to run the analysis?",
          actionUrl: `/process-lifecycle/process-mining/ASN`,
        };

      default:
        return {
          response: `I understand you want to ${action}. Let me help you with that.`,
        };
    }

    return {
      response:
        "I need more context to help with that action. Could you provide more details?",
    };
  }
}

export const asnCopilotIntegration = new ASNCopilotIntegration();
