/**
 * Edit Declaration Page
 * Redirects to detail page with edit mode
 */

"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditDeclarationPage() {
  const params = useParams();
  const router = useRouter();
  const declarationId = params.id as string;

  useEffect(() => {
    // Redirect to detail page - edit mode handled there
    router.push(`/customs/declarations/${declarationId}`);
  }, [declarationId, router]);

  return null;
}
