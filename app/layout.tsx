import type { Metadata, Viewport } from "next";
import "./globals.css";
import dynamic from "next/dynamic";
import Layout from "@/components/Layout";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
import { CustomerProvider } from "@/contexts/CustomerContext";
import { ProcessLifecycleProvider } from "@/app/providers/ProcessLifecycleProvider";
import { ISOIMSProvider } from "@/app/providers/ISOIMSProvider";
import PWARegistration from "@/components/PWARegistration";
import { PremiumNotificationProvider } from "@/components/PremiumNotificationEnhanced";
import NavigationProgress from "@/components/NavigationProgress";

// Lazy load heavy components that don't need to block initial render
// These will load after the page is interactive
const GlobalJobMonitor = dynamic(
  () =>
    import("@/components/jobs/GlobalJobMonitor").then((mod) => ({
      default: mod.GlobalJobMonitor,
    })),
  {
    ssr: false,
    loading: () => null, // Don't show loading state
  },
);

const NotificationManager = dynamic(
  () =>
    import("@/components/motivation/NotificationManager").then((mod) => ({
      default: mod.NotificationManager,
    })),
  {
    ssr: false,
    loading: () => null, // Don't show loading state
  },
);

const WidgetDock = dynamic(
  () =>
    import("@/components/widgets/WidgetDock").then((mod) => ({
      default: mod.WidgetDock,
    })),
  {
    ssr: false,
    loading: () => null, // Don't show loading state
  },
);
// LAZY-INIT GUARD: Skip all heavy module initialization unless INIT_SERVICES=1
// This makes dev navigation extremely fast. To enable full background services,
// run with `INIT_SERVICES=1 next dev` (or set the env var in .env.local).
const SHOULD_INIT_SERVICES =
  typeof process !== "undefined" && process.env.INIT_SERVICES === "1";

if (typeof window === "undefined" && SHOULD_INIT_SERVICES) {
  setImmediate(() => {
    import("@/lib/services/job-queue/registerHandlers").catch(() => {});
  });

  const initServices = async () => {
    try {
      await Promise.all([
        import("@/lib/modules").catch(() => {}),
        import("@/lib/services/integration/serviceInitializer").catch(() => {}),
        import("@/lib/services/ai/vision/initialization")
          .then((m) => m.initializeVisionModule().catch(() => {}))
          .catch(() => {}),
        import("@/lib/services/sla-kpi/initialization")
          .then((m) =>
            m
              .initializeUnifiedSlaKpi("default", { autoMigrate: true })
              .catch(() => {}),
          )
          .catch(() => {}),
      ]);
    } catch (error) {
      console.warn("Service initialization skipped:", error);
    }
  };

  if (typeof setImmediate !== "undefined") {
    setImmediate(initServices);
  } else {
    setTimeout(initServices, 0);
  }
} else if (typeof window !== "undefined") {
  if (typeof requestIdleCallback !== "undefined") {
    requestIdleCallback(() => {
      import("@/lib/services/job-queue/registerHandlers").catch(() => {});
    });
  } else {
    setTimeout(() => {
      import("@/lib/services/job-queue/registerHandlers").catch(() => {});
    }, 0);
  }
}

// Use system fonts to avoid network issues during build
// Font is defined in globals.css using system font stack

export const metadata: Metadata = {
  title: "BlueDXP Platform",
  description:
    "Enterprise Logistics & Compliance Management Platform - AI-Powered Accessibility",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ErrorBoundary>
          <AuthProvider>
            <CurrencyProvider>
              <AccessibilityProvider>
                <CustomerProvider>
                  <ProcessLifecycleProvider>
                    <ISOIMSProvider>
                      <PremiumNotificationProvider>
                        <NavigationProgress />
                        <PWARegistration />
                        <Layout>{children}</Layout>
                        <GlobalJobMonitor />
                        <NotificationManager />
                        <WidgetDock position="bottom" />
                      </PremiumNotificationProvider>
                    </ISOIMSProvider>
                  </ProcessLifecycleProvider>
                </CustomerProvider>
              </AccessibilityProvider>
            </CurrencyProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
