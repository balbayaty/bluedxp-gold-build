/**
 * 👥 UNIFIED CUSTOMER CENTER COMPONENT
 * Consolidated customer intelligence and relationship management
 * Full implementation with multi-language support
 */

"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { unifiedCustomerCenterService } from "@/lib/services/unified/unifiedCustomerCenterService";
import type {
  UnifiedCustomerModule,
  CustomerJourney,
  CustomerInsight,
} from "@/lib/services/unified/unifiedCustomerCenterService";

export default function UnifiedCustomerCenter() {
  const [language, setLanguage] = useState<"en" | "ar" | "ur">("en");
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  unifiedCustomerCenterService.setLanguage(language);
  const dashboard = unifiedCustomerCenterService.getUnifiedDashboard();

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
          <TabsTrigger value="journeys">Customer Journeys</TabsTrigger>
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
                  <Badge>{module.automationLevel}% Automated</Badge>
                </div>
              </CardHeader>
              {selectedModule === module.id && (
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Capabilities:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {module.capabilities.map((capability) => (
                          <div
                            key={capability.id}
                            className="p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">
                                {getText(capability.name)}
                              </h4>
                              {capability.aiPowered && (
                                <Badge variant="outline">AI</Badge>
                              )}
                              {capability.realTime && (
                                <Badge variant="outline">Real-time</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {getText(capability.description)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Impact: {capability.businessImpact}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium">Business Value</p>
                      <p className="text-sm text-muted-foreground">
                        {module.businessValue}
                      </p>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="journeys" className="space-y-4">
          {dashboard.journeys.map((journey) => (
            <Card key={journey.id}>
              <CardHeader>
                <CardTitle>{getText(journey.name)}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {getText(journey.description)}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {journey.stages.map((stage) => (
                    <div key={stage.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{getText(stage.name)}</h4>
                          <p className="text-sm text-muted-foreground">
                            {getText(stage.description)}
                          </p>
                        </div>
                        <Badge variant="outline">{stage.timeEstimate}</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-sm">
                        <div>
                          <p className="font-medium mb-1">AI Assistance:</p>
                          <ul className="list-disc list-inside text-muted-foreground">
                            {stage.aiAssistance.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="font-medium mb-1">Automated Actions:</p>
                          <ul className="list-disc list-inside text-muted-foreground">
                            {stage.automatedActions.map((action, i) => (
                              <li key={i}>{action}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {dashboard.insights.map((insight) => (
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
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-2">
                      Recommended Actions:
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                      {insight.actionRecommendations.map((action, i) => (
                        <li key={i}>{action}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Confidence: {(insight.confidence * 100).toFixed(0)}%
                    </span>
                    <span className="font-medium">
                      {insight.businessImpact}
                    </span>
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
