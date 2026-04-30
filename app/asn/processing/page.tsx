/**
 * ASN Processing List Page
 * List all ASNs for processing
 */

import { AsnList } from "@/components/asn/AsnList";

export default function AsnProcessingListPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">ASN Processing</h1>
        <p className="text-muted-foreground mt-2">
          Manage and process Advanced Shipping Notices
        </p>
      </div>

      <AsnList />
    </div>
  );
}
