/**
 * Base Email Adapter
 *
 * Abstract base class for all email provider adapters
 * Follows the adapter pattern used throughout BlueDXP platform
 */

import type {
  EmailAdapter,
  EmailMessage,
  EmailSendResult,
  EmailStatusUpdate,
} from "../../types";

export abstract class EmailAdapterBase implements EmailAdapter {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly provider: EmailAdapter["provider"];

  protected config: Record<string, any> = {};

  constructor(config?: Record<string, any>) {
    this.config = config || {};
  }

  /**
   * Test connection to email provider
   */
  abstract testConnection(): Promise<{ success: boolean; message: string }>;

  /**
   * Send email
   */
  abstract sendEmail(message: EmailMessage): Promise<EmailSendResult>;

  /**
   * Get email status (optional - not all providers support this)
   */
  async getEmailStatus?(messageId: string): Promise<EmailStatusUpdate | null> {
    return null;
  }

  /**
   * Validate email address (optional)
   */
  async validateEmail?(email: string): Promise<boolean> {
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get provider-specific configuration
   */
  getConfig(): Record<string, any> {
    return { ...this.config };
  }

  /**
   * Update provider-specific configuration
   */
  async updateConfig(config: Partial<Record<string, any>>): Promise<void> {
    this.config = { ...this.config, ...config };
  }

  /**
   * Normalize email addresses to array format
   */
  protected normalizeAddresses(
    addresses: EmailMessage["to"] | EmailMessage["cc"] | EmailMessage["bcc"],
  ): Array<{ email: string; name?: string }> {
    if (!addresses) return [];
    if (Array.isArray(addresses)) return addresses;
    return [addresses];
  }

  /**
   * Format email addresses for provider
   */
  protected formatAddresses(
    addresses: Array<{ email: string; name?: string }>,
  ): string {
    return addresses
      .map((addr) => (addr.name ? `${addr.name} <${addr.email}>` : addr.email))
      .join(", ");
  }
}
