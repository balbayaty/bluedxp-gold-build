/**
 * ASN Processing Page
 * Detailed view for processing a specific ASN
 */

import { AsnProcessingInterface } from "@/components/asn/AsnProcessingInterface";
import { notFound } from "next/navigation";

interface PageProps {
  params: {
    id: string;
  };
}

export default function AsnProcessingPage({ params }: PageProps) {
  if (!params.id) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Process ASN</h1>
        <p className="text-muted-foreground mt-2">
          Review and process Advanced Shipping Notice
        </p>
      </div>

      <AsnProcessingInterface asnId={params.id} />
    </div>
  );
}
