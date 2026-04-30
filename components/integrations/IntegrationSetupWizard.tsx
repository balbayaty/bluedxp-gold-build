/**
 * Integration Setup Wizard
 * User-friendly step-by-step guide for setting up integrations
 * Makes it easy for non-technical users to configure integrations
 */

"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCheck,
  FiArrowRight,
  FiArrowLeft,
  FiHelpCircle,
  FiExternalLink,
  FiLinkedin,
  FiMessageCircle,
  FiRss,
  FiGlobe,
  FiLock,
} from "react-icons/fi";
import type { IntegrationType } from "@/types/external-integrations";

interface SetupWizardProps {
  type: IntegrationType;
  onComplete: (config: Record<string, any>) => void;
  onCancel: () => void;
}

interface SetupStep {
  id: string;
  title: string;
  description: string;
  fields: SetupField[];
  helpText?: string;
  helpLink?: string;
}

interface SetupField {
  key: string;
  label: string;
  type: "text" | "password" | "url" | "number";
  placeholder: string;
  required: boolean;
  helpText?: string;
  validation?: (value: string) => string | null;
}

const SETUP_GUIDES: Record<IntegrationType, SetupStep[]> = {
  LINKEDIN: [
    {
      id: "credentials",
      title: "LinkedIn App Credentials",
      description:
        "Enter your LinkedIn App credentials. Don't have an app? We'll help you create one.",
      fields: [
        {
          key: "clientId",
          label: "Client ID",
          type: "text",
          placeholder: "Enter your LinkedIn Client ID",
          required: true,
          helpText: 'Found in your LinkedIn App settings under "Auth" tab',
          validation: (value) => {
            if (!value || value.length < 10) {
              return "Client ID must be at least 10 characters";
            }
            return null;
          },
        },
        {
          key: "clientSecret",
          label: "Client Secret",
          type: "password",
          placeholder: "Enter your LinkedIn Client Secret",
          required: true,
          helpText: "Keep this secret - it will be stored securely",
          validation: (value) => {
            if (!value || value.length < 10) {
              return "Client Secret must be at least 10 characters";
            }
            return null;
          },
        },
      ],
      helpText: "Need help creating a LinkedIn App?",
      helpLink: "https://www.linkedin.com/developers/apps",
    },
    {
      id: "redirect",
      title: "Redirect URI Setup",
      description: "Add this redirect URI to your LinkedIn App settings.",
      fields: [
        {
          key: "redirectUri",
          label: "Redirect URI",
          type: "url",
          placeholder: "Auto-filled",
          required: true,
          helpText:
            "Copy this URL and add it to your LinkedIn App's authorized redirect URIs",
        },
      ],
      helpText: "How to add redirect URI in LinkedIn App",
    },
  ],
  TELEGRAM: [
    {
      id: "bot",
      title: "Telegram Bot Setup",
      description:
        "Create a bot with @BotFather on Telegram and get your bot token.",
      fields: [
        {
          key: "botToken",
          label: "Bot Token",
          type: "password",
          placeholder: "123456789:ABCdefGHIjklMNOpqrsTUVwxyz",
          required: true,
          helpText: "Get this from @BotFather on Telegram",
          validation: (value) => {
            if (!value || !value.includes(":")) {
              return "Bot token should be in format: number:letters";
            }
            return null;
          },
        },
      ],
      helpText: "How to create a Telegram bot",
      helpLink: "https://core.telegram.org/bots/tutorial",
    },
  ],
  WHATSAPP: [
    {
      id: "provider",
      title: "WhatsApp Provider Setup",
      description: "Choose your WhatsApp provider and enter credentials.",
      fields: [
        {
          key: "provider",
          label: "Provider",
          type: "text",
          placeholder: "WHATSAPP_BUSINESS",
          required: true,
          helpText: "Choose: WHATSAPP_BUSINESS, TWILIO, or META_CLOUD_API",
        },
        {
          key: "apiKey",
          label: "API Key / Access Token",
          type: "password",
          placeholder: "Enter your API key",
          required: true,
        },
        {
          key: "phoneNumberId",
          label: "Phone Number ID",
          type: "text",
          placeholder: "Enter phone number ID",
          required: false,
        },
      ],
    },
  ],
  NEWS_SITE: [
    {
      id: "feed",
      title: "News Feed Setup",
      description: "Enter the RSS feed URL you want to connect.",
      fields: [
        {
          key: "feedUrl",
          label: "RSS Feed URL",
          type: "url",
          placeholder: "https://example.com/rss",
          required: true,
          helpText: "Most news sites have RSS feeds at /rss or /feed",
          validation: (value) => {
            try {
              new URL(value);
              return null;
            } catch {
              return "Please enter a valid URL";
            }
          },
        },
        {
          key: "refreshInterval",
          label: "Refresh Interval (seconds)",
          type: "number",
          placeholder: "3600",
          required: false,
          helpText: "How often to check for new articles (default: 1 hour)",
        },
      ],
    },
  ],
  RSS_FEED: [
    {
      id: "feed",
      title: "RSS Feed Setup",
      description: "Enter the RSS feed URL you want to connect.",
      fields: [
        {
          key: "feedUrl",
          label: "RSS Feed URL",
          type: "url",
          placeholder: "https://example.com/rss",
          required: true,
          validation: (value) => {
            try {
              new URL(value);
              return null;
            } catch {
              return "Please enter a valid URL";
            }
          },
        },
      ],
    },
  ],
  GENERIC_SITE: [
    {
      id: "site",
      title: "Website Setup",
      description: "Enter the website URL you want to integrate.",
      fields: [
        {
          key: "url",
          label: "Website URL",
          type: "url",
          placeholder: "https://example.com",
          required: true,
          validation: (value) => {
            try {
              new URL(value);
              return null;
            } catch {
              return "Please enter a valid URL";
            }
          },
        },
        {
          key: "mode",
          label: "Integration Mode",
          type: "text",
          placeholder: "IFRAME",
          required: true,
          helpText:
            "Choose: IFRAME (embed), API (connect to API), or SCRAPING (extract content)",
        },
      ],
    },
  ],
  IFRAME_EMBED: [
    {
      id: "embed",
      title: "Embed Website",
      description: "Enter the website URL to embed in your dashboard.",
      fields: [
        {
          key: "url",
          label: "Website URL",
          type: "url",
          placeholder: "https://example.com",
          required: true,
        },
      ],
    },
  ],
  API_INTEGRATION: [
    {
      id: "api",
      title: "API Integration Setup",
      description: "Connect to an external API.",
      fields: [
        {
          key: "url",
          label: "API Base URL",
          type: "url",
          placeholder: "https://api.example.com",
          required: true,
        },
        {
          key: "apiKey",
          label: "API Key",
          type: "password",
          placeholder: "Enter your API key",
          required: false,
        },
        {
          key: "authType",
          label: "Authentication Type",
          type: "text",
          placeholder: "API_KEY, BEARER, or BASIC",
          required: false,
        },
      ],
    },
  ],
};

export default function IntegrationSetupWizard({
  type,
  onComplete,
  onCancel,
}: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [config, setConfig] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const steps = SETUP_GUIDES[type] || [];

  const updateField = (key: string, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    // Clear error for this field
    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const validateStep = (step: SetupStep): boolean => {
    const newErrors: Record<string, string> = {};

    step.fields.forEach((field) => {
      const value = config[field.key] || "";

      if (field.required && !value) {
        newErrors[field.key] = `${field.label} is required`;
      } else if (field.validation && value) {
        const error = field.validation(value);
        if (error) {
          newErrors[field.key] = error;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      if (validateStep(steps[currentStep])) {
        setCurrentStep((prev) => prev + 1);
      }
    } else {
      // Last step - complete
      if (validateStep(steps[currentStep])) {
        onComplete(config);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  if (steps.length === 0) {
    return (
      <div className="p-6 text-center text-gray-400">
        <p>Setup guide not available for this integration type.</p>
      </div>
    );
  }

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  // Auto-fill redirect URI for LinkedIn
  if (
    type === "LINKEDIN" &&
    currentStepData.id === "redirect" &&
    !config.redirectUri
  ) {
    if (typeof window !== "undefined") {
      updateField(
        "redirectUri",
        `${window.location.origin}/integrations/callback`,
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-6">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  index < currentStep
                    ? "bg-green-500 text-white"
                    : index === currentStep
                      ? "bg-blue-500 text-white"
                      : "bg-gray-700 text-gray-400"
                }`}
              >
                {index < currentStep ? <FiCheck /> : index + 1}
              </div>
              <span
                className={`ml-2 text-sm ${
                  index <= currentStep ? "text-white" : "text-gray-400"
                }`}
              >
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-4 ${
                  index < currentStep ? "bg-green-500" : "bg-gray-700"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-6"
        >
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {currentStepData.title}
            </h3>
            <p className="text-gray-400">{currentStepData.description}</p>
          </div>

          {/* Help Link */}
          {currentStepData.helpLink && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FiHelpCircle className="text-blue-400 text-xl mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-blue-300 mb-2">
                    {currentStepData.helpText}
                  </p>
                  <a
                    href={currentStepData.helpLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    Learn more <FiExternalLink className="text-xs" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4">
            {currentStepData.fields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {field.label}
                  {field.required && (
                    <span className="text-red-400 ml-1">*</span>
                  )}
                </label>
                {field.key === "redirectUri" ? (
                  <input
                    type={field.type}
                    value={config[field.key] || ""}
                    readOnly
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 cursor-not-allowed"
                  />
                ) : (
                  <input
                    type={field.type}
                    value={config[field.key] || ""}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className={`w-full px-4 py-2 bg-white/5 border rounded-lg text-white placeholder-gray-500 focus:outline-none ${
                      errors[field.key]
                        ? "border-red-500 focus:border-red-500"
                        : "border-white/10 focus:border-blue-500"
                    }`}
                    required={field.required}
                  />
                )}
                {errors[field.key] && (
                  <p className="text-xs text-red-400 mt-1">
                    {errors[field.key]}
                  </p>
                )}
                {field.helpText && !errors[field.key] && (
                  <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-white/10">
        <button
          onClick={currentStep > 0 ? handleBack : onCancel}
          className="px-4 py-2 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
        >
          <FiArrowLeft />
          {currentStep > 0 ? "Back" : "Cancel"}
        </button>
        <button
          onClick={handleNext}
          disabled={Object.keys(errors).length > 0}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLastStep ? "Complete Setup" : "Next"}
          {!isLastStep && <FiArrowRight />}
        </button>
      </div>
    </div>
  );
}
