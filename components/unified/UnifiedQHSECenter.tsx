/**
 * 🎯 UNIFIED QHSE CENTER COMPONENT
 * Consolidated QHSE intelligence and management
 * Full implementation with multi-language support
 */

"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { unifiedQHSECenterService } from "@/lib/services/unified/unifiedQHSECenterService";
import type {
  UnifiedQHSEModule,
  QHSEFeature,
} from "@/lib/services/unified/unifiedQHSECenterService";

export default function UnifiedQHSECenter() {
  const [language, setLanguage] = useState<"en" | "ar" | "ur">("en");
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  unifiedQHSECenterService.setLanguage(language);
  const dashboard = unifiedQHSECenterService.getUnifiedDashboard();

  const getText = <T extends Record<"en" | "ar" | "ur", string>>(
    text: T,
  ): string => {
    return text[language];
  };

  return (
    <div className="space-y-6">
      {/* Language Selector */}
      <div className="flex justify-end gap-2">
        <Button
          variant={language === "en" ? "default" : "outline"}
          size="sm"
          onClick={() => setLanguage("en")}
        >
          English
        </Button>
        <Button
          variant={language === "ar" ? "default" : "outline"}
          size="sm"
          onClick={() => setLanguage("ar")}
        >
          العربية
        </Button>
        <Button
          variant={language === "ur" ? "default" : "outline"}
          size="sm"
          onClick={() => setLanguage("ur")}
        >
          اردو
        </Button>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Modules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard.overview.totalModules}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Active Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard.overview.activeFeatures}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Automation Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard.overview.automationLevel}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Customer Satisfaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard.overview.customerSatisfactionScore}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modules */}
      <Tabs defaultValue="modules">
        <TabsList>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="journey">Customer Journey</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="space-y-4">
          {dashboard.modules.map((module) => (
            <Card
              key={module.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() =>
                setSelectedModule(
                  selectedModule === module.id ? null : module.id,
                )
              }
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{getText(module.name)}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getText(module.description)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        module.status === "CRITICAL"
                          ? "destructive"
                          : module.status === "ALERT"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {module.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              {selectedModule === module.id && (
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Features:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {module.features.map((feature) => (
                          <div
                            key={feature.id}
                            className="p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">
                                {getText(feature.name)}
                              </h4>
                              <Badge variant="outline">
                                {feature.automationLevel}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {getText(
                                feature.description || {
                                  en: "",
                                  ar: "",
                                  ur: "",
                                },
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Impact: {feature.businessImpact}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="journey" className="space-y-4">
          {dashboard.customerJourney.map((step) => (
            <Card key={step.id}>
              <CardHeader>
                <CardTitle>{getText(step.name)}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {getText(step.description)}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium mb-1">Time Estimate:</p>
                    <p className="text-muted-foreground">{step.timeEstimate}</p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Tools:</p>
                    <div className="flex flex-wrap gap-1">
                      {step.tools.map((tool, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {tool}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Automated Actions:</p>
                    <ul className="list-disc list-inside text-muted-foreground">
                      {step.automatedActions.map((action, i) => (
                        <li key={i}>{action}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Expected Outcomes:</p>
                    <ul className="list-disc list-inside text-muted-foreground">
                      {step.outcomes.map((outcome, i) => (
                        <li key={i}>{outcome}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {dashboard.automatedInsights.map((insight) => (
            <Card key={insight.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{getText(insight.title)}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getText(insight.description)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      insight.priority === "CRITICAL"
                        ? "destructive"
                        : insight.priority === "HIGH"
                          ? "default"
                          : "secondary"
                    }
                  >
                    {insight.priority}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Confidence: {(insight.confidence * 100).toFixed(0)}%
                  </span>
                  <div className="flex gap-2">
                    {insight.actions.map((action, i) => (
                      <Button key={i} variant="outline" size="sm">
                        {action}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
