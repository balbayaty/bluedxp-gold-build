/**
 * Digital Signatures Main Page
 * Redirects to dashboard
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DigitalSignaturesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/digital-signatures/dashboard");
  }, [router]);

  return (
    <div className="container mx-auto p-6">
      <p>Redirecting to dashboard...</p>
    </div>
  );
}
