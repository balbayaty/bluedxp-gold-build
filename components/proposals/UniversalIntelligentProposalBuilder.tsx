/**
 * Universal Intelligent Proposal Builder
 *
 * Works across ALL modules (WMS, TMS, Marketplace, etc.)
 * Features:
 * - AI-powered insights with real-time recommendations
 * - Cross-module data integration
 * - Win probability calculation
 * - Beautiful, modern UI matching world-class standards
 * - Real-time collaboration
 * - Intelligent content suggestions
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import ProposalHelpTooltip from "./ProposalHelpTooltip";
import ProposalTemplateSelector from "./ProposalTemplateSelector";
import type {
  UnifiedProposalConfig,
  AIProposalInsight,
  ProposalWinStrategy,
} from "@/lib/services/proposals/unifiedProposalService";

interface UniversalIntelligentProposalBuilderProps {
  moduleId?: string;
  proposalType?: string;
  customerId?: string;
  customerName?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  templateId?: string;
  onProposalGenerated?: (proposalId: string) => void;
}

export default function UniversalIntelligentProposalBuilder({
  moduleId = "proposals-rfq",
  proposalType,
  customerId,
  customerName,
  relatedEntityId,
  relatedEntityType,
  templateId,
  onProposalGenerated,
}: UniversalIntelligentProposalBuilderProps) {
  const router = useRouter();

  // State
  const [activeTab, setActiveTab] = useState<
    | "setup"
    | "preview"
    | "content"
    | "media"
    | "interactive"
    | "team"
    | "ab-test"
  >("setup");

  // Preview state - stores what the proposal will look like
  const [previewSections, setPreviewSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Template state
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [templateLoading, setTemplateLoading] = useState(false);

  // Rate Card & Service Category state
  const [selectedRateCard, setSelectedRateCard] = useState<any>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [availableRateCards, setAvailableRateCards] = useState<any[]>([]);
  const [availableServiceCategories, setAvailableServiceCategories] = useState<
    any[]
  >([]);

  // Proposal Data
  const [proposalData, setProposalData] = useState({
    title: "",
    customer: customerName || "",
    customerId: customerId || "",
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    moduleId: moduleId,
    proposalType: proposalType || "CUSTOM",
    templateId: templateId || undefined,
    rateCardId: undefined as string | undefined,
    serviceCategoryIds: [] as string[],
  });

  // AI Insights
  const [aiInsights, setAiInsights] = useState<AIProposalInsight[]>([]);
  const [winStrategy, setWinStrategy] = useState<ProposalWinStrategy | null>(
    null,
  );
  const [winProbability, setWinProbability] = useState<number | null>(null);

  // Proposal Stats
  const [stats, setStats] = useState({
    sections: 1,
    contentBlocks: 0,
    mediaItems: 0,
  });

  // Generate AI Insights
  const generateInsights = useCallback(async () => {
    if (!proposalData.title && !proposalData.customer) return;

    setLoading(true);
    try {
      const response = await fetch(
        "/api/proposals/universal/generate-insights",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            moduleId: proposalData.moduleId,
            proposalType: proposalData.proposalType,
            customerId: proposalData.customerId,
            customerName: proposalData.customer,
            context: {
              title: proposalData.title,
              validUntil: proposalData.validUntil,
            },
            tenantId: "default", // Would get from auth context
            userId: "current-user", // Would get from auth context
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        setAiInsights(data.insights || []);
        setWinStrategy(data.winStrategy || null);
        setWinProbability(data.winStrategy?.winProbability || null);
      }
    } catch (error) {
      console.error("Error generating insights:", error);
    } finally {
      setLoading(false);
    }
  }, [proposalData]);

  // Auto-generate insights when data changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (proposalData.title || proposalData.customer) {
        generateInsights();
      }
    }, 1000); // Debounce

    return () => clearTimeout(timer);
  }, [proposalData.title, proposalData.customer, generateInsights]);

  // Load template function
  const loadTemplate = useCallback(async (id: string) => {
    setTemplateLoading(true);
    try {
      // Try to get template from API or data
      const { getTemplateById } = await import("@/data/proposals/templates");
      const template = getTemplateById(id);

      if (template) {
        setSelectedTemplate(template);
        // Pre-fill proposal data with template defaults
        setProposalData((prev) => ({
          ...prev,
          title: prev.title || template.name,
          proposalType: template.type || prev.proposalType,
        }));
        console.log("[Proposal Builder] ✅ Template loaded:", template.name);
      } else {
        console.warn("[Proposal Builder] Template not found:", id);
      }
    } catch (error) {
      console.error("[Proposal Builder] Error loading template:", error);
    } finally {
      setTemplateLoading(false);
    }
  }, []);

  // Load template if templateId provided
  useEffect(() => {
    if (templateId) {
      loadTemplate(templateId);
    }
  }, [templateId, loadTemplate]);

  // Generate preview sections based on current selections
  const generatePreview = useCallback(() => {
    const preview: any[] = [];

    // Cover section
    preview.push({
      id: "preview-cover",
      type: "HEADER",
      title: "Cover Page",
      content: proposalData.title || "Proposal Title",
      order: 1,
    });

    // Executive Summary
    preview.push({
      id: "preview-executive",
      type: "TEXT",
      title: "Executive Summary",
      content: `This proposal outlines our comprehensive services for ${proposalData.customer || "Customer Name"}. We are committed to delivering exceptional value and meeting your business objectives.`,
      order: 2,
    });

    // Template sections (if template selected)
    if (selectedTemplate && selectedTemplate.sections) {
      selectedTemplate.sections.forEach((section: any, index: number) => {
        if (section.id !== "cover" && section.id !== "executive-summary") {
          preview.push({
            id: `preview-${section.id}`,
            type: section.type || "TEXT",
            title: section.title,
            content: section.defaultContent || section.content || "",
            order: 3 + index,
          });
        }
      });
    }

    // Services section (if services selected)
    if (selectedServices.length > 0) {
      let servicesContent = `## Services Offered\n\n`;
      servicesContent += `Selected service categories will be included:\n`;
      selectedServices.forEach((catId: string) => {
        const cat = availableServiceCategories.find((c: any) => c.id === catId);
        if (cat) {
          servicesContent += `- **${cat.name}**: Services from this category will be detailed\n`;
        }
      });
      preview.push({
        id: "preview-services",
        type: "TEXT",
        title: "Services & Capabilities",
        content: servicesContent,
        order: preview.length + 1,
      });
    }

    // Pricing section (if rate card selected)
    if (selectedRateCard) {
      let pricingContent = `## Pricing Structure\n\n`;
      pricingContent += `**Rate Card:** ${selectedRateCard.name} (${selectedRateCard.code})\n\n`;
      if (selectedRateCard.rates && selectedRateCard.rates.length > 0) {
        pricingContent += `### Service Rates\n\n`;
        pricingContent += `| Service | Unit | Base Rate |\n|---------|------|-----------|\n`;
        selectedRateCard.rates.slice(0, 5).forEach((rate: any) => {
          pricingContent += `| ${rate.service} | ${rate.unit} | ${selectedRateCard.currency} ${rate.baseRate?.toLocaleString() || 0} |\n`;
        });
        if (selectedRateCard.rates.length > 5) {
          pricingContent += `\n*+ ${selectedRateCard.rates.length - 5} more rates*\n`;
        }
      }
      if (
        selectedRateCard.volumeDiscounts &&
        selectedRateCard.volumeDiscounts.length > 0
      ) {
        pricingContent += `\n### Volume Discounts Available\n\n`;
        selectedRateCard.volumeDiscounts.forEach((discount: any) => {
          pricingContent += `- **${discount.minVolume}${discount.maxVolume ? `-${discount.maxVolume}` : "+"} ${discount.unit}**: ${discount.discountPercent}% discount\n`;
        });
      }
      preview.push({
        id: "preview-pricing",
        type: "PRICING",
        title: "Pricing Structure",
        content: pricingContent,
        order: preview.length + 1,
      });
    }

    // Default sections if nothing selected
    if (preview.length <= 2) {
      preview.push({
        id: "preview-approach",
        type: "TEXT",
        title: "Our Approach",
        content:
          "We take a collaborative approach to understanding your requirements and delivering solutions that drive results.",
        order: preview.length + 1,
      });
    }

    setPreviewSections(preview.sort((a, b) => a.order - b.order));
  }, [
    proposalData,
    selectedTemplate,
    selectedServices,
    selectedRateCard,
    availableServiceCategories,
  ]);

  // Load rate cards and services on mount
  useEffect(() => {
    loadRateCards();
    loadServiceCategories();
  }, []);

  // Update preview when selections change
  useEffect(() => {
    if (activeTab === "preview") {
      generatePreview();
    }
  }, [
    activeTab,
    proposalData,
    selectedTemplate,
    selectedServices,
    selectedRateCard,
    generatePreview,
  ]);

  const loadRateCards = async () => {
    try {
      const res = await fetch("/api/proposals/rate-cards?status=ACTIVE");
      const data = await res.json();
      if (data.success) {
        setAvailableRateCards(data.data || []);
      }
    } catch (error) {
      console.error("[Proposal Builder] Error loading rate cards:", error);
    }
  };

  const loadServiceCategories = async () => {
    try {
      const res = await fetch("/api/proposals/services");
      const data = await res.json();
      if (data.success) {
        setAvailableServiceCategories(data.categories || []);
      }
    } catch (error) {
      console.error("[Proposal Builder] Error loading services:", error);
    }
  };

  // Generate Full Proposal
  const generateProposal = async () => {
    if (!proposalData.title || !proposalData.customer) {
      alert("Please fill in title and customer");
      return;
    }

    setGenerating(true);

    // VISIBLE FEEDBACK - Show what's happening
    const statusDiv = document.createElement("div");
    statusDiv.id = "proposal-status";
    statusDiv.style.cssText =
      "position: fixed; top: 20px; right: 20px; background: #3b82f6; color: white; padding: 16px 24px; border-radius: 8px; z-index: 10000; box-shadow: 0 4px 12px rgba(0,0,0,0.3); font-weight: 500; max-width: 400px;";
    statusDiv.innerHTML =
      '<div style="display: flex; align-items: center; gap: 8px;"><i class="ri-loader-4-line animate-spin"></i> <span>Starting proposal generation...</span></div>';
    document.body.appendChild(statusDiv);

    const updateStatus = (message: string, isError = false) => {
      statusDiv.style.background = isError ? "#ef4444" : "#3b82f6";
      statusDiv.innerHTML = `<div style="display: flex; align-items: center; gap: 8px;"><i class="${isError ? "ri-error-warning-line" : "ri-loader-4-line animate-spin"}"></i> <span>${message}</span></div>`;
    };

    console.log("[Proposal Builder] Starting proposal generation...", {
      moduleId: proposalData.moduleId,
      proposalType: proposalData.proposalType,
      customer: proposalData.customer,
      title: proposalData.title,
    });

    try {
      updateStatus("Preparing request...");

      const requestBody = {
        title: proposalData.title,
        customerName: proposalData.customer,
        customerEmail: "",
        description: "",
        proposalType: proposalData.proposalType || "CUSTOM",
        tenantId: "default",
        userId: "current-user",
        validUntil: proposalData.validUntil,
        templateId: proposalData.templateId || selectedTemplate?.id, // Pass template ID
        rateCardId: proposalData.rateCardId || selectedRateCard?.id, // Pass rate card ID
        serviceCategoryIds:
          proposalData.serviceCategoryIds.length > 0
            ? proposalData.serviceCategoryIds
            : selectedServices, // Pass service categories
      };

      console.log(
        "[Proposal Builder] Sending request to /api/proposals/simple-create:",
        requestBody,
      );
      updateStatus("Sending request to server...");

      const requestStartTime = Date.now();

      // USE SIMPLE ENDPOINT (optimized - returns immediately after database save)
      let response: Response;
      try {
        updateStatus("Sending request to server...");

        // Create AbortController for timeout (45 seconds - should be enough for database operation)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000);

        response = await fetch("/api/proposals/simple-create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        console.error("[Proposal Builder] ❌ Fetch error:", fetchError);

        if (
          fetchError.name === "AbortError" ||
          fetchError.name === "TimeoutError"
        ) {
          updateStatus(
            "❌ Request timeout - server took too long to respond",
            true,
          );
          setTimeout(() => statusDiv.remove(), 10000);
          setGenerating(false);
          throw new Error(
            "Request timeout - please try again. If this persists, the server may be experiencing high load.",
          );
        } else if (
          fetchError.name === "TypeError" &&
          fetchError.message.includes("Failed to fetch")
        ) {
          updateStatus(
            "❌ Network error - cannot reach server. Check if server is running.",
            true,
          );
          setTimeout(() => statusDiv.remove(), 10000);
          setGenerating(false);
          throw new Error(
            "Network error - cannot reach server. Please check your connection and ensure the server is running.",
          );
        }
        throw fetchError;
      }

      const requestDuration = Date.now() - requestStartTime;
      console.log(
        "[Proposal Builder] ✅ Request completed in:",
        requestDuration + "ms",
      );
      if (requestDuration > 5000) {
        console.warn(
          "[Proposal Builder] ⚠️ Slow request detected:",
          requestDuration + "ms",
        );
      }

      console.log(
        "[Proposal Builder] Response status:",
        response.status,
        response.statusText,
      );
      updateStatus(
        `✅ Server responded: ${response.status} ${response.statusText}`,
      );

      // Get response text
      updateStatus("Processing server response...");
      let responseText = await response.text();
      console.log(
        "[Proposal Builder] Response body length:",
        responseText.length,
      );

      // If simple endpoint fails, try universal endpoint
      if (!response.ok) {
        console.warn(
          "[Proposal Builder] Simple endpoint failed, trying universal endpoint...",
        );
        updateStatus("Simple endpoint failed, trying alternative...");

        const fallbackRequest = {
          moduleId: proposalData.moduleId,
          proposalType: proposalData.proposalType,
          customerId: proposalData.customerId,
          customerName: proposalData.customer,
          relatedEntityId,
          relatedEntityType,
          context: {
            title: proposalData.title,
            validUntil: proposalData.validUntil,
          },
          tenantId: "default",
          userId: "current-user",
        };

        response = await fetch("/api/proposals/universal/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fallbackRequest),
        });
        console.log(
          "[Proposal Builder] Universal endpoint response status:",
          response.status,
          response.statusText,
        );
        responseText = await response.text();

        if (!response.ok) {
          let errorData: any;
          try {
            errorData = JSON.parse(responseText);
          } catch {
            errorData = {
              error: `HTTP ${response.status}: ${response.statusText}`,
              details: responseText.substring(0, 500),
            };
          }
          console.error("[Proposal Builder] Both endpoints failed");
          console.error("[Proposal Builder] Error data:", errorData);
          console.error("[Proposal Builder] Error code:", errorData.errorCode);
          console.error("[Proposal Builder] Error type:", errorData.errorType);

          // Build detailed error message
          let errorMessage =
            errorData.error ||
            errorData.message ||
            `HTTP ${response.status}: ${response.statusText}`;
          if (errorData.errorCode) {
            errorMessage += ` (Code: ${errorData.errorCode})`;
          }
          if (errorData.details?.message) {
            errorMessage += ` - ${errorData.details.message}`;
          }

          updateStatus(`❌ Error: ${errorMessage}`, true);
          setTimeout(() => statusDiv.remove(), 10000);
          throw new Error(errorMessage);
        }
      }

      updateStatus("Parsing response...");
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error(
          "[Proposal Builder] Failed to parse response:",
          parseError,
        );
        console.error("[Proposal Builder] Response text:", responseText);
        updateStatus("❌ Error: Invalid response format", true);
        setTimeout(() => statusDiv.remove(), 8000);
        throw new Error(
          "Invalid response from server. Check console for details.",
        );
      }
      console.log("[Proposal Builder] Response data:", data);

      if (!data.success) {
        console.error("[Proposal Builder] API returned success=false:", data);
        updateStatus(
          `❌ Error: ${data.error || data.message || "Failed to generate proposal"}`,
          true,
        );
        setTimeout(() => statusDiv.remove(), 8000);
        throw new Error(
          data.error || data.message || "Failed to generate proposal",
        );
      }

      if (!data.proposal) {
        console.error("[Proposal Builder] No proposal in response:", data);
        updateStatus("❌ Error: No proposal data returned", true);
        setTimeout(() => statusDiv.remove(), 8000);
        throw new Error(
          "Proposal generation succeeded but no proposal data returned",
        );
      }

      console.log(
        "[Proposal Builder] ✅ Proposal generated successfully:",
        data.proposal.id,
      );
      updateStatus("✅ Proposal created successfully!");

      // For simple endpoint, ensure proposal has required fields
      if (!data.proposal.sections) {
        data.proposal.sections = [];
      }
      if (!data.insights) {
        data.insights = [];
      }
      if (!data.winStrategy) {
        data.winStrategy = {
          winProbability: 50,
          keyStrengths: [],
          recommendedActions: [],
          competitiveAdvantages: [],
          risks: [],
        };
      }

      // Update stats
      setStats({
        sections: data.proposal.sections?.length || 1,
        contentBlocks: 0,
        mediaItems: 0,
      });

      // Update insights and strategy
      if (data.insights) setAiInsights(data.insights);
      if (data.winStrategy) {
        setWinStrategy(data.winStrategy);
        setWinProbability(data.winStrategy.winProbability);
      }

      // Navigate to proposal or call callback
      const proposalId = data.proposal.id;
      console.log("[Proposal Builder] Navigating to proposal:", proposalId);
      updateStatus(`Navigating to proposal ${proposalId}...`);

      // Wait a moment so user sees success message
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (onProposalGenerated) {
        onProposalGenerated(proposalId);
      } else {
        router.push(`/proposals/${proposalId}`);
      }

      // Remove status after navigation
      setTimeout(() => statusDiv.remove(), 2000);
    } catch (error: any) {
      console.error("[Proposal Builder] ❌ Error generating proposal:", error);
      console.error("[Proposal Builder] Error details:", {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      });
      const errorMessage =
        error?.message ||
        "Error generating proposal. Please check the console for details and try again.";

      // Show error in status div
      updateStatus(`❌ Error: ${errorMessage}`, true);
      setTimeout(() => statusDiv.remove(), 8000);

      // Also show alert
      alert(
        `Error: ${errorMessage}\n\nCheck browser console (F12) for details.`,
      );
    } finally {
      setGenerating(false);
    }
  };

  // Get insight icon
  const getInsightIcon = (type: AIProposalInsight["type"]) => {
    switch (type) {
      case "WIN_RATE":
        return "ri-line-chart-line";
      case "CONTENT":
        return "ri-file-text-line";
      case "PRICING":
        return "ri-price-tag-3-line";
      case "TIMING":
        return "ri-time-line";
      case "COMPETITIVE":
        return "ri-trophy-line";
      case "RISK":
        return "ri-alert-line";
      case "OPPORTUNITY":
        return "ri-lightbulb-line";
      default:
        return "ri-information-line";
    }
  };

  // Get priority color
  const getPriorityColor = (priority: AIProposalInsight["priority"]) => {
    switch (priority) {
      case "CRITICAL":
        return "text-red-500";
      case "HIGH":
        return "text-orange-500";
      case "MEDIUM":
        return "text-yellow-500";
      case "LOW":
        return "text-blue-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
            Create Proposal
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Build world-class proposals with AI-powered insights.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2">
            <i className="ri-team-line" />
            Collaborate
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("[Proposal Builder] Generate button clicked!", {
                title: proposalData.title,
                customer: proposalData.customer,
                generating,
              });
              if (!proposalData.title || !proposalData.customer) {
                alert(
                  "Please fill in both Title and Customer fields before generating.",
                );
                return;
              }
              generateProposal();
            }}
            disabled={
              generating || !proposalData.title || !proposalData.customer
            }
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            title={
              !proposalData.title || !proposalData.customer
                ? "Please fill in Title and Customer"
                : "Generate Proposal"
            }
          >
            {generating ? (
              <>
                <i className="ri-loader-4-line animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <i className="ri-magic-line" />
                Generate Proposal
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI-Powered Insights */}
            {aiInsights.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white"
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">💡</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="text-xl font-bold">AI-Powered Insights</h3>
                      <ProposalHelpTooltip helpKey="ai-insights" />
                    </div>
                    <div className="space-y-3">
                      {aiInsights.slice(0, 4).map((insight, idx) => (
                        <motion.div
                          key={insight.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3"
                        >
                          <i
                            className={`${getInsightIcon(insight.type)} text-xl mt-1`}
                          />
                          <div className="flex-1">
                            <div className="font-semibold">{insight.title}</div>
                            {insight.impact?.winRateIncrease && (
                              <div className="text-sm opacity-90">
                                Increases win rate by{" "}
                                {insight.impact.winRateIncrease}%
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Proposal Navigation Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex overflow-x-auto">
                  {[
                    { id: "setup", label: "Setup", icon: "ri-settings-3-line" },
                    { id: "preview", label: "Preview", icon: "ri-eye-line" },
                    {
                      id: "content",
                      label: "Content",
                      icon: "ri-file-text-line",
                    },
                    { id: "media", label: "Media", icon: "ri-image-line" },
                    {
                      id: "interactive",
                      label: "Interactive",
                      icon: "ri-magic-line",
                    },
                    { id: "team", label: "Team", icon: "ri-team-line" },
                    {
                      id: "ab-test",
                      label: "A/B Test",
                      icon: "ri-test-tube-line",
                    },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-6 py-4 flex items-center gap-2 border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
                          : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      }`}
                    >
                      <i className={tab.icon} />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {/* Template Info Banner */}
                {selectedTemplate && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <i className="ri-file-text-line text-2xl text-blue-600 dark:text-blue-400" />
                      <div className="flex-1">
                        <p className="font-semibold text-blue-900 dark:text-blue-100">
                          Using Template: {selectedTemplate.name}
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          {selectedTemplate.description}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          {selectedTemplate.sections?.length || 0} sections will
                          be included
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedTemplate(null);
                          setProposalData((prev) => ({
                            ...prev,
                            templateId: undefined,
                          }));
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                        title="Remove template"
                      >
                        <i className="ri-close-line text-xl" />
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === "setup" && (
                  <div className="space-y-6">
                    {/* Template Selector */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <i className="ri-layout-4-line" />
                        Select Template (Optional - Quick Start)
                        <ProposalHelpTooltip helpKey="proposal-template" />
                      </label>
                      <ProposalTemplateSelector
                        moduleId={proposalData.moduleId}
                        proposalType={proposalData.proposalType}
                        onSelectTemplate={(template) => {
                          setSelectedTemplate(template);
                          // Pre-fill proposal data from template
                          if (template.proposalType) {
                            setProposalData((prev) => ({
                              ...prev,
                              proposalType: template.proposalType,
                              templateId: template.id,
                            }));
                          }
                        }}
                        onCustomize={(template) => {
                          setSelectedTemplate(template);
                          setProposalData((prev) => ({
                            ...prev,
                            proposalType: template.proposalType,
                            templateId: template.id,
                          }));
                          // Could open a customization modal here
                          console.log("Customize template:", template);
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        Proposal Title
                        <ProposalHelpTooltip helpKey="proposal-title" />
                      </label>
                      <input
                        type="text"
                        value={proposalData.title}
                        onChange={(e) =>
                          setProposalData({
                            ...proposalData,
                            title: e.target.value,
                          })
                        }
                        placeholder="Enter proposal title"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        Customer
                        <ProposalHelpTooltip helpKey="customer-name" />
                      </label>
                      <input
                        type="text"
                        value={proposalData.customer}
                        onChange={(e) =>
                          setProposalData({
                            ...proposalData,
                            customer: e.target.value,
                          })
                        }
                        placeholder="Enter customer name"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Rate Card Selection - Intelligent */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <i className="ri-price-tag-3-line" />
                        Rate Card (Optional - Auto-pricing)
                        <ProposalHelpTooltip helpKey="rate-card" />
                      </label>
                      {availableRateCards.length === 0 ? (
                        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm text-gray-500 dark:text-gray-400">
                          <i className="ri-loader-4-line animate-spin mr-2" />
                          Loading rate cards...
                        </div>
                      ) : (
                        <>
                          <select
                            value={selectedRateCard?.id || ""}
                            onChange={(e) => {
                              const card = availableRateCards.find(
                                (rc: any) => rc.id === e.target.value,
                              );
                              setSelectedRateCard(card || null);
                              setProposalData({
                                ...proposalData,
                                rateCardId: card?.id,
                              });
                            }}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">
                              No Rate Card (Manual Pricing)
                            </option>
                            {availableRateCards.map((rc: any) => (
                              <option key={rc.id} value={rc.id}>
                                {rc.name} ({rc.code}) - {rc.category} •{" "}
                                {rc.rates?.length || 0} rates
                              </option>
                            ))}
                          </select>
                          {selectedRateCard && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                                    <i className="ri-checkbox-circle-fill text-blue-600" />
                                    {selectedRateCard.name}
                                  </p>
                                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                    {selectedRateCard.code} •{" "}
                                    {selectedRateCard.rates?.length || 0} rates
                                    • {selectedRateCard.currency}
                                  </p>
                                </div>
                                <button
                                  onClick={() => {
                                    setSelectedRateCard(null);
                                    setProposalData({
                                      ...proposalData,
                                      rateCardId: undefined,
                                    });
                                  }}
                                  className="p-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded text-blue-600 dark:text-blue-400"
                                >
                                  <i className="ri-close-line" />
                                </button>
                              </div>
                              {selectedRateCard.rates &&
                                selectedRateCard.rates.length > 0 && (
                                  <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                                    <p className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-1">
                                      Sample Rates:
                                    </p>
                                    <div className="space-y-1">
                                      {selectedRateCard.rates
                                        .slice(0, 3)
                                        .map((rate: any) => (
                                          <div
                                            key={rate.id}
                                            className="flex justify-between text-xs text-blue-700 dark:text-blue-400"
                                          >
                                            <span>{rate.service}</span>
                                            <span className="font-medium">
                                              {selectedRateCard.currency}{" "}
                                              {rate.baseRate?.toLocaleString()}/
                                              {rate.unit}
                                            </span>
                                          </div>
                                        ))}
                                      {selectedRateCard.rates.length > 3 && (
                                        <p className="text-xs text-blue-600 dark:text-blue-500 italic">
                                          +{selectedRateCard.rates.length - 3}{" "}
                                          more rates
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              {selectedRateCard.volumeDiscounts &&
                                selectedRateCard.volumeDiscounts.length > 0 && (
                                  <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                                    <p className="text-xs font-medium text-green-700 dark:text-green-400 flex items-center gap-1">
                                      <i className="ri-discount-percent-line" />
                                      Volume Discounts Available
                                    </p>
                                  </div>
                                )}
                            </motion.div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Service Categories Selection - Intelligent */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <i className="ri-service-line" />
                        Service Categories (Optional - Auto-sections)
                        <ProposalHelpTooltip helpKey="service-categories" />
                      </label>
                      {availableServiceCategories.length === 0 ? (
                        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm text-gray-500 dark:text-gray-400">
                          <i className="ri-loader-4-line animate-spin mr-2" />
                          Loading service categories...
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                            {availableServiceCategories.map((cat: any) => (
                              <motion.button
                                key={cat.id}
                                type="button"
                                onClick={() => {
                                  const isSelected = selectedServices.includes(
                                    cat.id,
                                  );
                                  if (isSelected) {
                                    setSelectedServices((prev) =>
                                      prev.filter(
                                        (id: string) => id !== cat.id,
                                      ),
                                    );
                                    setProposalData((prev) => ({
                                      ...prev,
                                      serviceCategoryIds:
                                        prev.serviceCategoryIds.filter(
                                          (id: string) => id !== cat.id,
                                        ),
                                    }));
                                  } else {
                                    setSelectedServices((prev) => [
                                      ...prev,
                                      cat.id,
                                    ]);
                                    setProposalData((prev) => ({
                                      ...prev,
                                      serviceCategoryIds: [
                                        ...prev.serviceCategoryIds,
                                        cat.id,
                                      ],
                                    }));
                                  }
                                }}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                className={`p-4 rounded-xl border-2 transition-all text-left bg-white dark:bg-gray-800 ${
                                  selectedServices.includes(cat.id)
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md ring-2 ring-blue-200 dark:ring-blue-800"
                                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md"
                                }`}
                              >
                                <div className="flex flex-col gap-2">
                                  {/* Icon and Name Row */}
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`w-10 h-10 ${cat.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}
                                    >
                                      <i
                                        className={`${cat.icon} text-white text-base`}
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                          {cat.name}
                                        </span>
                                        {selectedServices.includes(cat.id) && (
                                          <i className="ri-checkbox-circle-fill text-blue-500 text-lg flex-shrink-0" />
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Service Count - Properly Aligned */}
                                  {cat.count && (
                                    <div className="flex items-center gap-3 pl-[2.75rem]">
                                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                        {cat.count}{" "}
                                        {cat.count === 1
                                          ? "service"
                                          : "services"}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </motion.button>
                            ))}
                          </div>
                          {selectedServices.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                            >
                              <p className="text-sm font-medium text-green-900 dark:text-green-100 flex items-center gap-2">
                                <i className="ri-checkbox-circle-fill text-green-600" />
                                {selectedServices.length} categor
                                {selectedServices.length === 1
                                  ? "y"
                                  : "ies"}{" "}
                                selected
                              </p>
                              <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                                Services will be automatically added to your
                                proposal sections
                              </p>
                            </motion.div>
                          )}
                        </>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        Valid Until
                        <ProposalHelpTooltip helpKey="valid-until" />
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          value={proposalData.validUntil}
                          onChange={(e) =>
                            setProposalData({
                              ...proposalData,
                              validUntil: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <i className="ri-calendar-line absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "preview" && (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Live Preview
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          See how your proposal will look
                        </p>
                      </div>
                      <button
                        onClick={generatePreview}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
                      >
                        <i className="ri-refresh-line" />
                        Refresh Preview
                      </button>
                    </div>

                    {/* Preview Container */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-lg p-8 min-h-[600px]">
                      {/* Proposal Header */}
                      <div className="text-center mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                          {proposalData.title || "Proposal Title"}
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                          Prepared for{" "}
                          {proposalData.customer || "Customer Name"}
                        </p>
                        {proposalData.validUntil && (
                          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                            Valid until:{" "}
                            {new Date(
                              proposalData.validUntil,
                            ).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      {/* Preview Sections */}
                      <div className="space-y-8">
                        {previewSections.length === 0 ? (
                          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <i className="ri-file-text-line text-4xl mb-3 opacity-50" />
                            <p>
                              Select a template, rate card, or services to see
                              preview
                            </p>
                            <p className="text-xs mt-2">
                              Or fill in the title and customer name
                            </p>
                          </div>
                        ) : (
                          previewSections.map((section, index) => (
                            <motion.div
                              key={section.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="prose dark:prose-invert max-w-none"
                            >
                              {section.type === "HEADER" ? (
                                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg p-6 mb-4">
                                  <h2 className="text-2xl font-bold text-white m-0">
                                    {section.title}
                                  </h2>
                                  {section.content && (
                                    <p className="text-white/90 mt-2 m-0">
                                      {section.content}
                                    </p>
                                  )}
                                </div>
                              ) : section.type === "PRICING" ? (
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
                                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                    {section.title}
                                  </h2>
                                  <div className="prose dark:prose-invert max-w-none">
                                    <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                                      {section.content
                                        .split("\n")
                                        .map((line: string, idx: number) => {
                                          // Simple markdown-like rendering
                                          if (line.startsWith("## ")) {
                                            return (
                                              <h3
                                                key={idx}
                                                className="text-xl font-bold mt-4 mb-2"
                                              >
                                                {line.replace("## ", "")}
                                              </h3>
                                            );
                                          }
                                          if (line.startsWith("### ")) {
                                            return (
                                              <h4
                                                key={idx}
                                                className="text-lg font-semibold mt-3 mb-2"
                                              >
                                                {line.replace("### ", "")}
                                              </h4>
                                            );
                                          }
                                          if (
                                            line.startsWith("|") &&
                                            line.endsWith("|")
                                          ) {
                                            const cells = line
                                              .split("|")
                                              .filter((c: string) => c.trim());
                                            if (cells[0]?.includes("---")) {
                                              return (
                                                <hr
                                                  key={idx}
                                                  className="my-2 border-gray-300 dark:border-gray-600"
                                                />
                                              );
                                            }
                                            return (
                                              <div
                                                key={idx}
                                                className="flex gap-2 my-1"
                                              >
                                                {cells.map(
                                                  (
                                                    cell: string,
                                                    cellIdx: number,
                                                  ) => (
                                                    <div
                                                      key={cellIdx}
                                                      className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm"
                                                    >
                                                      {cell.trim()}
                                                    </div>
                                                  ),
                                                )}
                                              </div>
                                            );
                                          }
                                          if (line.startsWith("- ")) {
                                            return (
                                              <li key={idx} className="ml-4">
                                                {line.replace("- ", "")}
                                              </li>
                                            );
                                          }
                                          if (
                                            line.startsWith("**") &&
                                            line.endsWith("**")
                                          ) {
                                            return (
                                              <p key={idx}>
                                                <strong>
                                                  {line.replace(/\*\*/g, "")}
                                                </strong>
                                              </p>
                                            );
                                          }
                                          return (
                                            <p key={idx}>{line || <br />}</p>
                                          );
                                        })}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                    {section.title}
                                  </h2>
                                  <div className="prose dark:prose-invert max-w-none">
                                    <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                                      {section.content
                                        .split("\n")
                                        .map((line: string, idx: number) => {
                                          if (line.startsWith("## ")) {
                                            return (
                                              <h3
                                                key={idx}
                                                className="text-xl font-bold mt-4 mb-2"
                                              >
                                                {line.replace("## ", "")}
                                              </h3>
                                            );
                                          }
                                          if (line.startsWith("### ")) {
                                            return (
                                              <h4
                                                key={idx}
                                                className="text-lg font-semibold mt-3 mb-2"
                                              >
                                                {line.replace("### ", "")}
                                              </h4>
                                            );
                                          }
                                          if (line.startsWith("- ")) {
                                            return (
                                              <li key={idx} className="ml-4">
                                                {line.replace("- ", "")}
                                              </li>
                                            );
                                          }
                                          if (line.includes("**")) {
                                            const parts = line.split("**");
                                            return (
                                              <p key={idx}>
                                                {parts.map(
                                                  (
                                                    part: string,
                                                    partIdx: number,
                                                  ) =>
                                                    partIdx % 2 === 1 ? (
                                                      <strong key={partIdx}>
                                                        {part}
                                                      </strong>
                                                    ) : (
                                                      part
                                                    ),
                                                )}
                                              </p>
                                            );
                                          }
                                          return (
                                            <p key={idx}>{line || <br />}</p>
                                          );
                                        })}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          ))
                        )}
                      </div>

                      {/* Preview Footer */}
                      {previewSections.length > 0 && (
                        <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-400">
                          <p>
                            This is a preview. Generate the proposal to create
                            the final version.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Preview Info */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <i className="ri-information-line text-blue-600 dark:text-blue-400 text-xl mt-1" />
                        <div>
                          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                            Preview Information
                          </h4>
                          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                            {selectedTemplate && (
                              <p>
                                ✅ Using template:{" "}
                                <strong>{selectedTemplate.name}</strong> (
                                {selectedTemplate.sections?.length || 0}{" "}
                                sections)
                              </p>
                            )}
                            {selectedRateCard && (
                              <p>
                                ✅ Using rate card:{" "}
                                <strong>{selectedRateCard.name}</strong> (
                                {selectedRateCard.rates?.length || 0} rates)
                              </p>
                            )}
                            {selectedServices.length > 0 && (
                              <p>
                                ✅ Selected {selectedServices.length} service
                                categor
                                {selectedServices.length === 1 ? "y" : "ies"}
                              </p>
                            )}
                            {!selectedTemplate &&
                              !selectedRateCard &&
                              selectedServices.length === 0 && (
                                <p>
                                  ℹ️ Select a template, rate card, or services
                                  to see them in the preview
                                </p>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "content" && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <i className="ri-information-line text-blue-600 dark:text-blue-400 text-xl mt-1" />
                        <div>
                          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                            How It Works
                          </h4>
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            Click <strong>"Generate Proposal"</strong> to create
                            a proposal with content. After generation, you'll be
                            taken to the proposal detail page where you can view
                            and edit all sections.
                          </p>
                          <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                            The proposal will include: Cover, Executive Summary,
                            Services & Capabilities, and more sections
                            automatically.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <i className="ri-file-text-line text-4xl mb-3 opacity-50" />
                      <p>
                        Content editor will be available on the proposal detail
                        page
                      </p>
                      <p className="text-xs mt-2">
                        Generate a proposal first to see the content
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === "media" && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <i className="ri-image-line text-4xl mb-3 opacity-50" />
                    <p>
                      Media upload will be available on the proposal detail page
                    </p>
                    <p className="text-xs mt-2">
                      Generate a proposal first to add media
                    </p>
                  </div>
                )}

                {activeTab === "interactive" && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <i className="ri-magic-line text-4xl mb-3 opacity-50" />
                    <p>
                      Interactive features will be available on the proposal
                      detail page
                    </p>
                    <p className="text-xs mt-2">
                      Generate a proposal first to add interactive elements
                    </p>
                  </div>
                )}

                {activeTab === "team" && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <i className="ri-team-line text-4xl mb-3 opacity-50" />
                    <p>
                      Team collaboration will be available on the proposal
                      detail page
                    </p>
                    <p className="text-xs mt-2">
                      Generate a proposal first to invite team members
                    </p>
                  </div>
                )}

                {activeTab === "ab-test" && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <i className="ri-test-tube-line text-4xl mb-3 opacity-50" />
                    <p>
                      A/B testing will be available on the proposal detail page
                    </p>
                    <p className="text-xs mt-2">
                      Generate a proposal first to create variations
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/30 transition-colors flex items-center gap-2">
                  <i className="ri-star-line" />
                  AI Enhance
                </button>
                <button className="w-full px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors flex items-center gap-2">
                  <i className="ri-save-line" />
                  Save Draft
                </button>
                <button className="w-full px-4 py-2 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/30 transition-colors flex items-center gap-2">
                  <i className="ri-test-tube-line" />
                  Create A/B Test
                </button>
              </div>
            </div>

            {/* Proposal Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Proposal Stats
                  </h3>
                  <ProposalHelpTooltip helpKey="win-probability" />
                </div>
                <i className="ri-grid-line text-gray-400" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    Sections:
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {stats.sections}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    Content Blocks:
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {stats.contentBlocks}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    Media Items:
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {stats.mediaItems}
                  </span>
                </div>
                {winProbability !== null && (
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 dark:text-gray-400">
                        Win Probability:
                      </span>
                      <span
                        className={`font-bold text-lg ${
                          winProbability >= 70
                            ? "text-green-600"
                            : winProbability >= 50
                              ? "text-yellow-600"
                              : "text-red-600"
                        }`}
                      >
                        {winProbability}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          winProbability >= 70
                            ? "bg-green-600"
                            : winProbability >= 50
                              ? "bg-yellow-600"
                              : "bg-red-600"
                        }`}
                        style={{ width: `${winProbability}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Win Strategy (if available) */}
            {winStrategy && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Winning Strategy
                </h3>
                <div className="space-y-3">
                  {winStrategy.keyStrengths.slice(0, 3).map((strength, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <i className="ri-checkbox-circle-line text-green-500 mt-1" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {strength}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
