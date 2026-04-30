/**
 * Intelligent Form Field Component
 * AI-powered field with auto-completion and suggestions
 * Much more comprehensive than source apps
 */

"use client";

import { useState, useEffect, useRef } from "react";
import type {
  FormField,
  FieldSuggestion,
  FormRecommendation,
} from "@/lib/services/forms/intelligentFormService";
import { intelligentFormService } from "@/lib/services/forms/intelligentFormService";

interface IntelligentFormFieldProps {
  field: FormField;
  formId: string;
  suggestion?: FieldSuggestion;
  recommendation?: FormRecommendation;
  onValueChange: (fieldId: string, value: any) => void;
  onAutoFill?: (fieldId: string) => void;
  isDark?: boolean;
}

export default function IntelligentFormField({
  field,
  formId,
  suggestion,
  recommendation,
  onValueChange,
  onAutoFill,
  isDark = false,
}: IntelligentFormFieldProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState(field.value || "");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setInputValue(field.value || "");
  }, [field.value]);

  const handleChange = (value: any) => {
    setInputValue(value);
    onValueChange(field.id, value);
  };

  const handleAutoFill = () => {
    if (suggestion && onAutoFill) {
      onAutoFill(field.id);
      setInputValue(suggestion.suggestedValue);
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && suggestion && showSuggestions) {
      e.preventDefault();
      handleAutoFill();
    }
    if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const baseClasses = isDark
    ? "bg-gray-800 text-white border-gray-700 focus:border-purple-500"
    : "bg-white text-gray-900 border-gray-300 focus:border-blue-500";

  return (
    <div className="relative">
      <label
        className={`block text-sm font-semibold mb-2 ${isDark ? "text-gray-200" : "text-gray-700"}`}
      >
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
        {suggestion && suggestion.confidence >= 70 && (
          <span className="ml-2 text-xs text-blue-500 flex items-center gap-1">
            <i className="ri-lightbulb-line"></i>
            AI Suggestion Available
          </span>
        )}
      </label>

      {/* Input Field */}
      {field.type === "textarea" ? (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={inputValue}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            if (suggestion) setShowSuggestions(true);
          }}
          onBlur={() => {
            setTimeout(() => setIsFocused(false), 200);
          }}
          onKeyDown={handleKeyDown}
          required={field.required}
          placeholder={field.placeholder}
          rows={4}
          className={`w-full px-4 py-3 rounded-lg border-2 focus:outline-none transition-colors ${baseClasses}`}
        />
      ) : field.type === "select" ? (
        <select
          value={inputValue}
          onChange={(e) => handleChange(e.target.value)}
          required={field.required}
          className={`w-full px-4 py-3 rounded-lg border-2 focus:outline-none ${baseClasses}`}
        >
          <option value="">{field.placeholder || "Select..."}</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type={field.type}
          value={inputValue}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            if (suggestion) setShowSuggestions(true);
          }}
          onBlur={() => {
            setTimeout(() => setIsFocused(false), 200);
          }}
          onKeyDown={handleKeyDown}
          required={field.required}
          placeholder={field.placeholder}
          className={`w-full px-4 py-3 rounded-lg border-2 focus:outline-none transition-colors ${baseClasses}`}
        />
      )}

      {/* AI Suggestion Banner */}
      {suggestion && suggestion.confidence >= 70 && !field.value && (
        <div
          className={`mt-2 p-3 rounded-lg border ${
            isDark
              ? "bg-purple-900/20 border-purple-700 text-purple-300"
              : "bg-purple-50 border-purple-200 text-purple-800"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">
                <i className="ri-magic-line mr-1"></i>
                AI Suggestion ({suggestion.confidence}% confidence)
              </p>
              <p className="text-xs opacity-90 mb-2">{suggestion.reasoning}</p>
              {suggestion.alternatives &&
                suggestion.alternatives.length > 0 && (
                  <div className="text-xs opacity-75">
                    Alternatives:{" "}
                    {suggestion.alternatives
                      .slice(0, 2)
                      .map((a) => a.value)
                      .join(", ")}
                  </div>
                )}
            </div>
            <button
              onClick={handleAutoFill}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                isDark
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "bg-purple-600 hover:bg-purple-700 text-white"
              }`}
            >
              Use Suggestion
            </button>
          </div>
        </div>
      )}

      {/* Recommendation Banner */}
      {recommendation && recommendation.type === "COMPLETION_TIP" && (
        <div
          className={`mt-2 p-2 rounded text-xs ${
            isDark
              ? "bg-yellow-900/20 border-yellow-700 text-yellow-300"
              : "bg-yellow-50 border-yellow-200 text-yellow-800"
          }`}
        >
          <i className="ri-information-line mr-1"></i>
          {recommendation.message}
        </div>
      )}

      {/* Related Field Suggestion */}
      {recommendation && recommendation.type === "RELATED_FIELD" && (
        <div
          className={`mt-2 p-2 rounded text-xs ${
            isDark
              ? "bg-blue-900/20 border-blue-700 text-blue-300"
              : "bg-blue-50 border-blue-200 text-blue-800"
          }`}
        >
          <i className="ri-links-line mr-1"></i>
          {recommendation.message}
        </div>
      )}
    </div>
  );
}
