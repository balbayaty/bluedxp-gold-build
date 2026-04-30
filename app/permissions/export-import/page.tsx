import { Metadata } from "next";
import PermissionExportImport from "@/components/permissions/PermissionExportImport";
import PageTemplate from "@/components/PageTemplate";

export const metadata: Metadata = {
  title: "Permission Export/Import | BlueDXP",
  description: "Export and import permission configurations",
};

export default function PermissionExportImportPage() {
  return (
    <PageTemplate
      title="Permission Export/Import"
      description="Export and import permission configurations in JSON or CSV format"
    >
      <PermissionExportImport />
    </PageTemplate>
  );
}
