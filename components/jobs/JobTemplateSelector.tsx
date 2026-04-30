/**
 * Job Template Selector Component
 *
 * Allows users to select from pre-configured job templates
 */

"use client";

import { useState } from "react";
import { useCreateJob } from "@/hooks/useJob";
import {
  jobTemplates,
  JobTemplate,
} from "@/lib/services/job-queue/handlers/jobTemplates";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PremiumNotification } from "@/components/PremiumNotificationEnhanced";

interface JobTemplateSelectorProps {
  onJobCreated?: (jobId: string) => void;
  context?: Record<string, any>; // Context data (e.g., selected shipment IDs)
}

export function JobTemplateSelector({
  onJobCreated,
  context = {},
}: JobTemplateSelectorProps) {
  const { create, loading } = useCreateJob();
  const [selectedTemplate, setSelectedTemplate] = useState<JobTemplate | null>(
    null,
  );

  const handleCreateFromTemplate = async (template: JobTemplate) => {
    try {
      // Merge context into template parameters
      const request = template.createRequest({
        ...context,
        shipmentIds: context.shipmentIds || [],
        filters: context.filters || {},
      });

      const job = await create(request);

      PremiumNotification.success(
        "Job Created",
        `${template.name} has been queued successfully`,
      );

      if (onJobCreated) {
        onJobCreated(job.id);
      }

      setSelectedTemplate(null);
    } catch (error) {
      PremiumNotification.error(
        "Failed to Create Job",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  };

  const categories = ["export", "processing", "report", "sync"] as const;
  const templatesByCategory = categories.map((cat) => ({
    category: cat,
    templates: jobTemplates.filter((t) => t.category === cat),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Templates</CardTitle>
        <CardDescription>
          Select a pre-configured job template to quickly create background jobs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
            <TabsTrigger value="report">Reports</TabsTrigger>
            <TabsTrigger value="sync">Sync</TabsTrigger>
          </TabsList>

          {templatesByCategory.map(({ category, templates }) => (
            <TabsContent key={category} value={category} className="space-y-2">
              {templates.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No templates available in this category
                </p>
              ) : (
                templates.map((template) => (
                  <Card
                    key={template.id}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                    onClick={() => handleCreateFromTemplate(template)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="text-2xl">{template.icon}</span>
                          <div className="flex-1">
                            <h4 className="font-medium">{template.name}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {template.description}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateFromTemplate(template);
                          }}
                          disabled={loading}
                        >
                          Use Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
