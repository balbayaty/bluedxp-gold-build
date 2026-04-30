/**
 * ASN Error Boundary
 * Catches errors in ASN components and displays user-friendly error messages
 */

"use client";

import React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RiAlertLine, RiRefreshLine } from "react-icons/ri";

interface AsnErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
}

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <RiAlertLine className="h-5 w-5 text-red-600" />
          <CardTitle className="text-red-900">ASN Module Error</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-red-800 mb-1">
              Something went wrong in the ASN module
            </p>
            <p className="text-xs text-red-600">
              {error.message || "An unexpected error occurred"}
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={resetErrorBoundary} variant="outline" size="sm">
              <RiRefreshLine className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              size="sm"
            >
              Reload Page
            </Button>
          </div>

          {process.env.NODE_ENV === "development" && (
            <details className="mt-4">
              <summary className="text-xs text-red-600 cursor-pointer">
                Technical Details (Development Only)
              </summary>
              <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">
                {error.stack}
              </pre>
            </details>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function AsnErrorBoundary({
  children,
  fallback,
}: AsnErrorBoundaryProps) {
  return (
    <ErrorBoundary
      FallbackComponent={fallback || ErrorFallback}
      onError={(error, errorInfo) => {
        // Log error to monitoring service
        console.error("ASN Module Error:", error, errorInfo);

        // In production, send to error tracking service
        if (process.env.NODE_ENV === "production") {
          // Example: Sentry.captureException(error, { contexts: { react: errorInfo } })
        }
      }}
      onReset={() => {
        // Reset any error state
        window.location.hash = "";
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
