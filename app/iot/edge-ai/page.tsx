/**
 * 🤖 Edge AI Deployment Page
 * Deploy AI models to IoT edge devices
 */

"use client";

import PageTemplate from "@/components/PageTemplate";
import EdgeAIDeploymentPanel from "@/components/iot/EdgeAIDeploymentPanel";

export default function EdgeAIPage() {
  return (
    <PageTemplate
      title="Edge AI Deployment"
      description="Deploy AI models to edge devices for real-time inference"
      icon="ri-brain-line"
    >
      <EdgeAIDeploymentPanel />
    </PageTemplate>
  );
}
