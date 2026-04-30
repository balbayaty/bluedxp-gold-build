import { Metadata } from "next";
import PermissionSecurityScanner from "@/components/permissions/PermissionSecurityScanner";
import PageTemplate from "@/components/PageTemplate";

export const metadata: Metadata = {
  title: "Security Scanner | BlueDXP",
  description: "Scan permission configurations for security vulnerabilities",
};

export default function PermissionSecurityPage() {
  return (
    <PageTemplate
      title="Security Scanner"
      description="Scan permission configurations for security vulnerabilities and compliance issues"
    >
      <PermissionSecurityScanner />
    </PageTemplate>
  );
}
