/**
 * Email Adapters - Main Export
 *
 * Exports all email provider adapters
 */

export { EmailAdapterBase } from "./base/EmailAdapterBase";
export { SMTPAdapter, type SMTPConfig } from "./smtp/SMTPAdapter";
export {
  SendGridAdapter,
  type SendGridConfig,
} from "./sendgrid/SendGridAdapter";
export { AWSSESAdapter, type AWSSESConfig } from "./aws-ses/AWSSESAdapter";

export type { EmailAdapter } from "../../types";
