"use client";

import {
  PremiumNotificationProvider,
  useNotificationHelpers,
  MOCK_NOTIFICATIONS,
} from "@/components/PremiumNotificationEnhanced";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

function NotificationDemo() {
  const notifications = useNotificationHelpers();
  const [showMockData, setShowMockData] = useState(true);

  // Show mock notifications on load (only once)
  useEffect(() => {
    if (showMockData) {
      // Show a few examples after a delay
      const timer = setTimeout(() => {
        notifications.success(
          MOCK_NOTIFICATIONS.workflowSaved.title,
          MOCK_NOTIFICATIONS.workflowSaved.message,
          { duration: 4000 },
        );
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []); // Only run once on mount

  const demos = [
    {
      title: "Success (Mock Data)",
      description: "Using predefined mock data",
      action: () =>
        notifications.success(
          MOCK_NOTIFICATIONS.workflowSaved.title,
          MOCK_NOTIFICATIONS.workflowSaved.message,
          MOCK_NOTIFICATIONS.workflowSaved,
        ),
      icon: "ri-checkbox-circle-line",
      color: "text-green-400",
      mock: true,
    },
    {
      title: "Error (Mock Data)",
      description: "Error with retry actions",
      action: () =>
        notifications.error(
          MOCK_NOTIFICATIONS.workflowError.title,
          MOCK_NOTIFICATIONS.workflowError.message,
          MOCK_NOTIFICATIONS.workflowError,
        ),
      icon: "ri-error-warning-line",
      color: "text-red-400",
      mock: true,
    },
    {
      title: "Warning (Mock Data)",
      description: "Storage warning with action",
      action: () =>
        notifications.warning(
          MOCK_NOTIFICATIONS.lowStorage.title,
          MOCK_NOTIFICATIONS.lowStorage.message,
          MOCK_NOTIFICATIONS.lowStorage,
        ),
      icon: "ri-alert-line",
      color: "text-amber-400",
      mock: true,
    },
    {
      title: "Info (Mock Data)",
      description: "Clickable notification",
      action: () =>
        notifications.info(
          MOCK_NOTIFICATIONS.newFeature.title,
          MOCK_NOTIFICATIONS.newFeature.message,
          MOCK_NOTIFICATIONS.newFeature,
        ),
      icon: "ri-information-line",
      color: "text-blue-400",
      mock: true,
    },
    {
      title: "Loading → Success",
      description: "Async operation flow",
      action: () => {
        const id = notifications.loading(
          MOCK_NOTIFICATIONS.processing.title,
          MOCK_NOTIFICATIONS.processing.message,
        );
        setTimeout(() => {
          notifications.removeNotification(id);
          notifications.success(
            MOCK_NOTIFICATIONS.workflowSaved.title,
            MOCK_NOTIFICATIONS.workflowSaved.message,
          );
        }, 3000);
      },
      icon: "ri-loader-4-line",
      color: "text-purple-400",
    },
    {
      title: "Auto-Dismiss Demo",
      description: "Watch the countdown timer",
      action: () =>
        notifications.success(
          "Auto-Dismissing Notification",
          "This will automatically disappear in 5 seconds. Hover to pause!",
          { duration: 5000, progress: true },
        ),
      icon: "ri-timer-line",
      color: "text-cyan-400",
    },
    {
      title: "Critical Priority",
      description: "High priority with pulse",
      action: () =>
        notifications.error(
          "Critical System Alert",
          "Immediate action required. System resources critically low.",
          { priority: "critical", duration: 10000 },
        ),
      icon: "ri-alarm-warning-line",
      color: "text-red-400",
    },
    {
      title: "Multiple Actions",
      description: "Rich interaction options",
      action: () =>
        notifications.info(
          "Action Required",
          "You have pending approvals. What would you like to do?",
          {
            actions: [
              {
                label: "Approve All",
                action: () => console.log("Approve"),
                variant: "primary" as const,
                icon: "ri-check-line",
              },
              {
                label: "Review",
                action: () => console.log("Review"),
                variant: "secondary" as const,
                icon: "ri-eye-line",
              },
              {
                label: "Dismiss",
                action: () => console.log("Dismiss"),
                variant: "secondary" as const,
                icon: "ri-close-line",
              },
            ],
          },
        ),
      icon: "ri-checkbox-multiple-line",
      color: "text-pink-400",
    },
    {
      title: "No Auto-Dismiss",
      description: "Stays until manually closed",
      action: () =>
        notifications.info(
          "Important Notice",
          "This notification will stay until you close it manually.",
          { duration: 0, dismissible: true },
        ),
      icon: "ri-notification-3-line",
      color: "text-indigo-400",
    },
    {
      title: "Grouped Notifications",
      description: "Similar notifications grouped",
      action: () => {
        notifications.success("Item 1 Saved", "First item processed", {
          groupId: "batch-save",
        });
        setTimeout(() => {
          notifications.success("Item 2 Saved", "Second item processed", {
            groupId: "batch-save",
          });
        }, 500);
        setTimeout(() => {
          notifications.success("Item 3 Saved", "Third item processed", {
            groupId: "batch-save",
          });
        }, 1000);
      },
      icon: "ri-stack-line",
      color: "text-violet-400",
    },
    {
      title: "Different Positions",
      description: "Try all positions",
      action: () => {
        const positions: Array<
          | "top-left"
          | "top-center"
          | "bottom-left"
          | "bottom-center"
          | "bottom-right"
        > = [
          "top-left",
          "top-center",
          "bottom-left",
          "bottom-center",
          "bottom-right",
        ];
        positions.forEach((pos, idx) => {
          setTimeout(() => {
            notifications.info(
              `Position: ${pos}`,
              `This notification appears in the ${pos} position.`,
              { position: pos, duration: 4000 },
            );
          }, idx * 300);
        });
      },
      icon: "ri-layout-grid-line",
      color: "text-teal-400",
    },
    {
      title: "Brand Messaging (Demo)",
      description: "AI-powered brand messaging",
      action: () => {
        // This would use brand messaging service in production
        notifications.success(
          "Intelligence Applied",
          "Your workflow has been processed with precision and clarity.",
          {
            useBrandMessaging: true,
            messagingType: "success_message" as any,
            messagingContext: {
              moduleId: "wms",
              language: "en" as const,
              action: "save_workflow",
            },
          },
        );
      },
      icon: "ri-magic-line",
      color: "text-yellow-400",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#111827] to-[#0f172a] p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Premium Notification System
              </h1>
              <p className="text-white/60 text-lg">
                Experience intelligent, brand-aligned notifications with
                auto-dismiss, smart grouping, and beautiful animations.
              </p>
            </div>
            <motion.button
              onClick={() => setShowMockData(!showMockData)}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {showMockData ? "Hide" : "Show"} Mock Data
            </motion.button>
          </div>

          {/* Mock Data Display */}
          {showMockData && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6"
            >
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <i className="ri-database-2-line text-cyan-400"></i>
                Mock Data Examples (Visible)
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(MOCK_NOTIFICATIONS).map(([key, value]) => (
                  <div
                    key={key}
                    className="bg-white/5 rounded-lg p-4 border border-white/10"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          value.type === "success"
                            ? "bg-green-500/20 text-green-400"
                            : value.type === "error"
                              ? "bg-red-500/20 text-red-400"
                              : value.type === "warning"
                                ? "bg-amber-500/20 text-amber-400"
                                : "bg-blue-500/20 text-blue-400"
                        }`}
                      >
                        <i
                          className={`ri-${value.type === "success" ? "check" : value.type === "error" ? "error-warning" : value.type === "warning" ? "alert" : "information"}-line`}
                        ></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium text-sm mb-1">
                          {value.title}
                        </div>
                        <div className="text-white/60 text-xs line-clamp-2">
                          {value.message}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-white/40">
                            Duration: {value.duration || 0}ms
                          </span>
                          {value.priority && (
                            <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/60">
                              {value.priority}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Demo Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {demos.map((demo, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={demo.action}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-left hover:border-cyan-500/50 hover:bg-white/10 transition-all group relative overflow-hidden"
            >
              {/* Mock Badge */}
              {demo.mock && (
                <div className="absolute top-2 right-2 px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs font-medium rounded-lg border border-cyan-500/30">
                  Mock Data
                </div>
              )}

              <div className="flex items-start gap-4 mb-4">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center group-hover:scale-110 transition-transform ${demo.color}`}
                >
                  <i className={`${demo.icon} text-2xl`}></i>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg mb-1">
                    {demo.title}
                  </h3>
                  <p className="text-white/60 text-sm">{demo.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-cyan-400 text-sm font-medium">
                <span>Try it now</span>
                <i className="ri-arrow-right-line group-hover:translate-x-1 transition-transform"></i>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Enhanced Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <i className="ri-sparkling-2-line text-cyan-400"></i>
            Enhanced Features
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: "ri-timer-2-line",
                title: "Smart Auto-Dismiss",
                desc: "Progress bar with countdown, pause on hover, smooth animations",
              },
              {
                icon: "ri-sound-module-line",
                title: "Sound Effects",
                desc: "Context-aware audio feedback based on type and priority",
              },
              {
                icon: "ri-stack-line",
                title: "Smart Grouping",
                desc: "Similar notifications automatically grouped together",
              },
              {
                icon: "ri-pulse-line",
                title: "Priority System",
                desc: "Critical, high, medium, low priorities with visual indicators",
              },
              {
                icon: "ri-magic-line",
                title: "Brand Messaging",
                desc: "AI-powered, on-brand messaging integration",
              },
              {
                icon: "ri-layout-grid-line",
                title: "6 Positions",
                desc: "Top/bottom, left/right/center positioning options",
              },
              {
                icon: "ri-mouse-line",
                title: "Hover to Pause",
                desc: "Auto-dismiss pauses when hovering over notification",
              },
              {
                icon: "ri-focus-3-line",
                title: "Action Buttons",
                desc: "Multiple action buttons with icons and variants",
              },
              {
                icon: "ri-palette-line",
                title: "Type-Based Styling",
                desc: "Distinct colors, icons, and glows for each type",
              },
              {
                icon: "ri-bar-chart-box-line",
                title: "Analytics Ready",
                desc: "Built-in analytics tracking for user behavior",
              },
              {
                icon: "ri-translate-2",
                title: "Bilingual Support",
                desc: "Integrated with brand messaging for Arabic/English",
              },
              {
                icon: "ri-settings-3-line",
                title: "Fully Customizable",
                desc: "Duration, position, actions, sounds, and more",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.05 }}
                className="flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <i className={`${feature.icon} text-cyan-400 text-lg`}></i>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-white/60 text-sm">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Usage Examples */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <i className="ri-code-s-slash-line text-cyan-400"></i>
            Usage Examples
          </h2>
          <div className="space-y-4">
            <div className="bg-[#111827] rounded-xl p-4 border border-white/10">
              <div className="text-white/60 text-xs mb-2">Simple Success</div>
              <code className="text-cyan-400 text-sm">
                notifications.success('Workflow Saved', 'Your workflow has been
                saved successfully.')
              </code>
            </div>
            <div className="bg-[#111827] rounded-xl p-4 border border-white/10">
              <div className="text-white/60 text-xs mb-2">With Actions</div>
              <code className="text-cyan-400 text-sm">
                {`notifications.error('Save Failed', 'Please try again.', {
  actions: [
    { label: 'Retry', action: () => retry(), variant: 'primary' },
    { label: 'Report', action: () => report(), variant: 'danger' }
  ]
})`}
              </code>
            </div>
            <div className="bg-[#111827] rounded-xl p-4 border border-white/10">
              <div className="text-white/60 text-xs mb-2">
                Brand Messaging Integration
              </div>
              <code className="text-cyan-400 text-sm">
                {`notifications.brandSuccess('success_message', {
  moduleId: 'wms',
  action: 'save_workflow',
  language: 'en'
})`}
              </code>
            </div>
            <div className="bg-[#111827] rounded-xl p-4 border border-white/10">
              <div className="text-white/60 text-xs mb-2">Using Mock Data</div>
              <code className="text-cyan-400 text-sm">
                notifications.success( MOCK_NOTIFICATIONS.workflowSaved.title,
                MOCK_NOTIFICATIONS.workflowSaved.message,
                MOCK_NOTIFICATIONS.workflowSaved )
              </code>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function NotificationDemoPage() {
  return (
    <PremiumNotificationProvider>
      <NotificationDemo />
    </PremiumNotificationProvider>
  );
}
