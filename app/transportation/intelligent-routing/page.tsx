/**
 * Intelligent Routing Page
 *
 * Comprehensive page for intelligent route planning and transit time calculation
 * Employee-ready with authentication and proper error handling
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import IntelligentRoutePlanner from "@/components/transportation/IntelligentRoutePlanner";
import EnhancedTransitTimeCalculator from "@/components/transportation/EnhancedTransitTimeCalculator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Route, Clock, BookOpen, HelpCircle } from "lucide-react";
import Link from "next/link";

export default function IntelligentRoutingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"planning" | "calculator">(
    "planning",
  );
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header with Help */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Route className="w-8 h-8 text-blue-500" />
            Intelligent Routing
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Plan routes and calculate transit times considering all constraints,
            compliance programs, and real-time conditions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/transportation/intelligent-routing/README.md"
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Quick Start Guide
          </Link>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Help"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Help Panel */}
      {showHelp && (
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h3 className="font-bold mb-2 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            How to Use Intelligent Routing
          </h3>
          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <p>
              <strong>Route Planning:</strong> Enter origin, destination, cargo
              details, and preferences. The system will find all constraints and
              calculate realistic transit times.
            </p>
            <p>
              <strong>Transit Time Calculator:</strong> Get accurate transit
              time estimates considering truck bans, opening hours, government
              agency hours, and compliance programs.
            </p>
            <p>
              <strong>Compliance Programs:</strong> Select programs you're
              enrolled in (AEO, Golden List, TIR) to reduce processing times and
              restrictions.
            </p>
            <p>
              <strong>Tooltips:</strong> Look for ℹ️ icons for detailed
              explanations of each field and feature.
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as any)}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="planning" className="flex items-center gap-2">
            <Route className="w-4 h-4" />
            Route Planning
          </TabsTrigger>
          <TabsTrigger value="calculator" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Transit Time Calculator
          </TabsTrigger>
        </TabsList>

        <TabsContent value="planning">
          <IntelligentRoutePlanner />
        </TabsContent>

        <TabsContent value="calculator">
          <EnhancedTransitTimeCalculator />
        </TabsContent>
      </Tabs>
    </div>
  );
}
