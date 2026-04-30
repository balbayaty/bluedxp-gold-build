/**
 * InboundDetail - Temporary Stub
 * The full component has been temporarily disabled due to a webpack parser bug.
 * This stub allows the build to complete while the issue is resolved.
 */

"use client";

import { ASNData } from "@/types/asn";

interface InboundDetailProps {
  asn: ASNData;
  onClose: () => void;
}

export default function InboundDetail({ asn, onClose }: InboundDetailProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-8 max-w-2xl">
        <h2 className="text-2xl font-bold mb-4">
          Inbound Detail (Temporarily Unavailable)
        </h2>
        <p className="mb-4">ASN: {asn.documentNumber}</p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Close
        </button>
      </div>
    </div>
  );
}
