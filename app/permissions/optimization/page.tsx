import { Metadata } from "next";
import PermissionOptimizationEngine from "@/components/permissions/PermissionOptimizationEngine";
import PageTemplate from "@/components/PageTemplate";

export const metadata: Metadata = {
  title: "Permission Optimization | BlueDXP",
  description: "Analyze and optimize permission configurations",
};

export default function PermissionOptimizationPage() {
  return (
    <PageTemplate
      title="Permission Optimization"
      description="Analyze and optimize permission configurations for better performance and security"
    >
      <PermissionOptimizationEngine />
    </PageTemplate>
  );
}
