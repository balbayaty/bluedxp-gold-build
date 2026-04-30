/**
 * Email Service Initialization
 *
 * Initializes the Email Service Module and sets up event bus integration
 * Called during platform startup
 */

import { initializeEmailEventIntegration } from "./integration/eventIntegration";
import { emailService } from "./emailService";

/**
 * Initialize Email Service Module
 */
export async function initializeEmailService(): Promise<void> {
  console.log("📧 Initializing Email Service Module...");

  try {
    // Initialize event bus integration
    // This sets up listeners for email.send events from all modules
    initializeEmailEventIntegration();

    // Log registered providers
    const providers = emailService.listProviders();
    if (providers.length > 0) {
      console.log(
        `✅ Email Service initialized with ${providers.length} provider(s):`,
      );
      providers.forEach((provider) => {
        console.log(`   - ${provider.name} (${provider.provider})`);
      });
    } else {
      console.warn("⚠️  Email Service initialized but no providers configured");
      console.warn(
        "   Configure SMTP_HOST, SENDGRID_API_KEY, or AWS_SES_REGION environment variables",
      );
    }

    console.log("✅ Email Service Module initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing Email Service Module:", error);
    throw error;
  }
}
