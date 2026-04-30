/**
 * Smart Field Suggestions Component
 * AI-powered field suggestions based on user history and context
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Check, Lightbulb } from "lucide-react";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";

interface SmartFieldSuggestionsProps {
  category: string;
  currentFields: Record<string, any>;
  onSuggestionAccept: (field: string, value: any) => void;
}

export default function SmartFieldSuggestions({
  category,
  currentFields,
  onSuggestionAccept,
}: SmartFieldSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<
    Array<{
      field: string;
      value: any;
      reason: string;
      confidence: number;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSuggestions();
  }, [category, currentFields]);

  const loadSuggestions = async () => {
    setIsLoading(true);
    try {
      // Use knowledge base to get suggestions based on similar requirements
      const similarRequirements = await knowledgeBaseService.search({
        query: `requirements for ${category} service`,
        limit: 5,
      });

      // Generate suggestions based on common patterns
      const generatedSuggestions = generateSuggestions(
        similarRequirements,
        currentFields,
      );
      setSuggestions(generatedSuggestions);
    } catch (error) {
      console.error("Failed to load suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSuggestions = (
    similar: any[],
    current: Record<string, any>,
  ) => {
    const suggestions: Array<{
      field: string;
      value: any;
      reason: string;
      confidence: number;
    }> = [];

    // Analyze common patterns
    const commonValues: Record<string, any> = {};

    similar.forEach((item) => {
      Object.keys(item).forEach((key) => {
        if (!current[key] && item[key]) {
          if (!commonValues[key]) {
            commonValues[key] = { value: item[key], count: 1 };
          } else {
            commonValues[key].count++;
          }
        }
      });
    });

    // Generate suggestions for most common values
    Object.entries(commonValues).forEach(([field, data]: [string, any]) => {
      if (data.count >= 2) {
        suggestions.push({
          field,
          value: data.value,
          reason: `Commonly used in similar ${category} requirements`,
          confidence: Math.min(90, data.count * 20),
        });
      }
    });

    return suggestions.slice(0, 5); // Top 5 suggestions
  };

  const handleAccept = (suggestion: (typeof suggestions)[0]) => {
    onSuggestionAccept(suggestion.field, suggestion.value);
    setSuggestions((prev) => prev.filter((s) => s.field !== suggestion.field));
  };

  const handleDismiss = (field: string) => {
    setSuggestions((prev) => prev.filter((s) => s.field !== field));
  };

  if (suggestions.length === 0 && !isLoading) {
    return null;
  }

  return (
    <AnimatePresence>
      {suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
        >
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h4 className="font-semibold text-slate-800 dark:text-slate-200">
              Smart Suggestions
            </h4>
            <Sparkles className="w-4 h-4 text-blue-500" />
          </div>

          <div className="space-y-2">
            {suggestions.map((suggestion) => (
              <motion.div
                key={suggestion.field}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-3 bg-white dark:bg-slate-700 rounded-lg border border-blue-100 dark:border-blue-900/50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200 capitalize">
                      {suggestion.field.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {suggestion.confidence}% confidence
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {suggestion.reason}
                  </p>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-1">
                    {typeof suggestion.value === "object"
                      ? JSON.stringify(suggestion.value)
                      : String(suggestion.value)}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleAccept(suggestion)}
                    className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                    title="Accept suggestion"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDismiss(suggestion.field)}
                    className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600 rounded"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
