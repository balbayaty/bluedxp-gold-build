/**
 * Workspace Categories Page
 *
 * Advanced category display with mind-blowing UI/UX
 */

"use client";

import { useState, useEffect } from "react";
import { AdvancedCategoryDisplay } from "@/components/workspace/AdvancedCategoryDisplay";
import { apiFetch } from "@/utils/apiFetch";
import type { WidgetCategory } from "@/types/workspace";

export default function WorkspaceCategoriesPage() {
  const [categories, setCategories] = useState<WidgetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetch("/api/v1/workspace/categories");

      if (!response.ok) {
        throw new Error("Failed to load categories");
      }

      const data = await response.json();
      setCategories(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error loading categories:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (category: WidgetCategory) => {
    // Navigate to workspace with category filter
    window.location.href = `/workspace?category=${category.slug || category.id}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e14] via-[#0f172a] to-[#1a1f2e] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-sm">Loading categories...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e14] via-[#0f172a] to-[#1a1f2e] flex items-center justify-center">
        <div className="text-center text-white max-w-md px-4">
          <div className="mb-6">
            <svg
              className="w-16 h-16 mx-auto text-red-500 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-xl font-semibold mb-2">
              Failed to load categories
            </p>
            <p className="text-sm text-gray-400 mb-4">{error}</p>
          </div>
          <button
            onClick={loadCategories}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <AdvancedCategoryDisplay
      categories={categories}
      onCategorySelect={handleCategorySelect}
    />
  );
}
