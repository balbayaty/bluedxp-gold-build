/**
 * MSDS Email Report Service
 * Generates professional email reports for MSDS approvals, rejections, and reviews
 */

import { MSDSSubmission } from "@/types/msds";

export interface EmailReportOptions {
  submission: MSDSSubmission;
  action: "approved" | "rejected" | "reviewed";
  reason?: string;
  reviewerName?: string;
  reviewerEmail?: string;
  customerEmail?: string;
  customerName?: string;
  subCustomerName?: string;
  includeDetails?: boolean;
  includeRecommendations?: boolean;
}

export class MSDSEmailReportService {
  /**
   * Generate email report HTML
   */
  generateEmailReport(options: EmailReportOptions): {
    subject: string;
    html: string;
    text: string;
  } {
    const {
      submission,
      action,
      reason,
      reviewerName,
      customerName,
      subCustomerName,
    } = options;
    const data = submission.extractedData;

    // Generate subject
    const subject = this.generateSubject(submission, action, customerName);

    // Generate HTML email
    const html = this.generateHTMLReport(options);

    // Generate plain text version
    const text = this.generateTextReport(options);

    return { subject, html, text };
  }

  /**
   * Generate email subject
   */
  private generateSubject(
    submission: MSDSSubmission,
    action: string,
    customerName?: string,
  ): string {
    const productName =
      submission.extractedData?.productName || "MSDS Document";
    const actionText =
      action === "approved"
        ? "Approved"
        : action === "rejected"
          ? "Rejected"
          : "Under Review";
    const customerText = customerName ? ` - ${customerName}` : "";

    return `MSDS ${actionText}: ${productName}${customerText}`;
  }

  /**
   * Generate HTML email report
   */
  private generateHTMLReport(options: EmailReportOptions): string {
    const {
      submission,
      action,
      reason,
      reviewerName,
      customerName,
      subCustomerName,
      includeDetails = true,
      includeRecommendations = true,
    } = options;
    const data = submission.extractedData;

    const actionColor =
      action === "approved"
        ? "#10b981"
        : action === "rejected"
          ? "#ef4444"
          : "#f59e0b";
    const actionIcon =
      action === "approved" ? "✓" : action === "rejected" ? "✗" : "⏳";
    const actionText =
      action === "approved"
        ? "APPROVED"
        : action === "rejected"
          ? "REJECTED"
          : "UNDER REVIEW";

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MSDS ${actionText}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">BlueDXP MSDS Management</h1>
              <p style="margin: 10px 0 0 0; color: #e0f2fe; font-size: 14px;">Material Safety Data Sheet Review</p>
            </td>
          </tr>
          
          <!-- Status Banner -->
          <tr>
            <td style="background-color: ${actionColor}; padding: 25px 30px; text-align: center;">
              <div style="font-size: 48px; color: #ffffff; margin-bottom: 10px;">${actionIcon}</div>
              <h2 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; text-transform: uppercase;">${actionText}</h2>
              ${reason ? `<p style="margin: 15px 0 0 0; color: #ffffff; font-size: 14px; opacity: 0.9;">${reason}</p>` : ""}
            </td>
          </tr>
          
          <!-- Customer Information -->
          ${
            customerName
              ? `
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom: 10px;">
                    <strong style="color: #374151; font-size: 14px;">Customer Information</strong>
                  </td>
                </tr>
                <tr>
                  <td style="color: #6b7280; font-size: 14px;">
                    <strong>Customer:</strong> ${customerName}<br>
                    ${subCustomerName ? `<strong>Sub-Customer:</strong> ${subCustomerName}<br>` : ""}
                    ${reviewerName ? `<strong>Reviewed By:</strong> ${reviewerName}` : ""}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          `
              : ""
          }
          
          <!-- Product Details -->
          <tr>
            <td style="padding: 30px;">
              <h3 style="margin: 0 0 20px 0; color: #111827; font-size: 18px; font-weight: 600;">Product Information</h3>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 20px;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #374151; font-size: 13px; width: 150px; display: inline-block;">Product Name:</strong>
                    <span style="color: #111827; font-size: 13px;">${data?.productName || "Unknown Product"}</span>
                  </td>
                </tr>
                ${
                  data?.casNumber && data.casNumber !== "CAS not found"
                    ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #374151; font-size: 13px; width: 150px; display: inline-block;">CAS Number:</strong>
                    <span style="color: #06b6d4; font-size: 13px; font-family: monospace; font-weight: 600;">${data.casNumber}</span>
                  </td>
                </tr>
                `
                    : ""
                }
                ${
                  data?.ecNumber
                    ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #374151; font-size: 13px; width: 150px; display: inline-block;">EC Number:</strong>
                    <span style="color: #111827; font-size: 13px; font-family: monospace;">${data.ecNumber}</span>
                  </td>
                </tr>
                `
                    : ""
                }
                ${
                  data?.molecularFormula
                    ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #374151; font-size: 13px; width: 150px; display: inline-block;">Molecular Formula:</strong>
                    <span style="color: #111827; font-size: 13px; font-family: monospace;">${data.molecularFormula}</span>
                  </td>
                </tr>
                `
                    : ""
                }
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #374151; font-size: 13px; width: 150px; display: inline-block;">Manufacturer:</strong>
                    <span style="color: #111827; font-size: 13px;">${data?.manufacturer || "Not specified"}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #374151; font-size: 13px; width: 150px; display: inline-block;">Hazard Level:</strong>
                    <span style="color: ${data?.hazardLevel === "High" ? "#ef4444" : data?.hazardLevel === "Medium" ? "#f59e0b" : "#10b981"}; font-size: 13px; font-weight: 600;">
                      ${data?.hazardLevel || "Medium"}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <strong style="color: #374151; font-size: 13px; width: 150px; display: inline-block;">Submitted Date:</strong>
                    <span style="color: #111827; font-size: 13px;">${submission.submittedDate.toLocaleDateString()}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          ${
            includeDetails && data
              ? `
          <!-- Additional Details -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h3 style="margin: 0 0 20px 0; color: #111827; font-size: 18px; font-weight: 600;">Safety Information</h3>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 20px;">
                ${
                  data.hazardClass
                    ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #374151; font-size: 13px;">Hazard Class:</strong>
                    <span style="color: #111827; font-size: 13px; margin-left: 10px;">${data.hazardClass}</span>
                  </td>
                </tr>
                `
                    : ""
                }
                ${
                  data.physicalState
                    ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #374151; font-size: 13px;">Physical State:</strong>
                    <span style="color: #111827; font-size: 13px; margin-left: 10px;">${data.physicalState}</span>
                  </td>
                </tr>
                `
                    : ""
                }
                ${
                  data.flashPoint
                    ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #374151; font-size: 13px;">Flash Point:</strong>
                    <span style="color: #111827; font-size: 13px; margin-left: 10px;">${data.flashPoint}</span>
                  </td>
                </tr>
                `
                    : ""
                }
                ${
                  data.unNumber && data.unNumber !== "UN not specified"
                    ? `
                <tr>
                  <td style="padding: 8px 0;">
                    <strong style="color: #374151; font-size: 13px;">UN Number:</strong>
                    <span style="color: #111827; font-size: 13px; margin-left: 10px; font-family: monospace;">${data.unNumber}</span>
                  </td>
                </tr>
                `
                    : ""
                }
              </table>
            </td>
          </tr>
          `
              : ""
          }
          
          ${
            includeRecommendations && action === "approved"
              ? `
          <!-- Recommendations -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; border-radius: 8px;">
                <h4 style="margin: 0 0 10px 0; color: #065f46; font-size: 16px; font-weight: 600;">✓ Next Steps</h4>
                <ul style="margin: 0; padding-left: 20px; color: #047857; font-size: 14px; line-height: 1.8;">
                  <li>This MSDS has been approved and saved to your account</li>
                  <li>You can now use this product in your operations</li>
                  <li>Ensure all safety protocols are followed as per the MSDS</li>
                  <li>Keep this document for your records</li>
                </ul>
              </div>
            </td>
          </tr>
          `
              : ""
          }
          
          ${
            includeRecommendations && action === "rejected"
              ? `
          <!-- Rejection Information -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; border-radius: 8px;">
                <h4 style="margin: 0 0 10px 0; color: #991b1b; font-size: 16px; font-weight: 600;">⚠ Action Required</h4>
                <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.8;">
                  ${reason || "This MSDS requires revision. Please review the feedback and resubmit with the necessary corrections."}
                </p>
              </div>
            </td>
          </tr>
          `
              : ""
          }
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px;">
                This is an automated notification from BlueDXP MSDS Management System
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                © ${new Date().getFullYear()} BlueDXP Platform. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    return html;
  }

  /**
   * Generate plain text email report
   */
  private generateTextReport(options: EmailReportOptions): string {
    const {
      submission,
      action,
      reason,
      reviewerName,
      customerName,
      subCustomerName,
    } = options;
    const data = submission.extractedData;

    const actionText =
      action === "approved"
        ? "APPROVED"
        : action === "rejected"
          ? "REJECTED"
          : "UNDER REVIEW";

    let text = `
BlueDXP MSDS Management
Material Safety Data Sheet Review

========================================
STATUS: ${actionText}
========================================

${reason ? `Reason: ${reason}\n` : ""}

${customerName ? `Customer: ${customerName}\n${subCustomerName ? `Sub-Customer: ${subCustomerName}\n` : ""}` : ""}
${reviewerName ? `Reviewed By: ${reviewerName}\n` : ""}

Product Information:
-------------------
Product Name: ${data?.productName || "Unknown Product"}
${data?.casNumber && data.casNumber !== "CAS not found" ? `CAS Number: ${data.casNumber}\n` : ""}
${data?.ecNumber ? `EC Number: ${data.ecNumber}\n` : ""}
${data?.molecularFormula ? `Molecular Formula: ${data.molecularFormula}\n` : ""}
Manufacturer: ${data?.manufacturer || "Not specified"}
Hazard Level: ${data?.hazardLevel || "Medium"}
Submitted Date: ${submission.submittedDate.toLocaleDateString()}

${data?.hazardClass ? `Hazard Class: ${data.hazardClass}\n` : ""}
${data?.physicalState ? `Physical State: ${data.physicalState}\n` : ""}
${data?.flashPoint ? `Flash Point: ${data.flashPoint}\n` : ""}
${data?.unNumber && data.unNumber !== "UN not specified" ? `UN Number: ${data.unNumber}\n` : ""}

${
  action === "approved"
    ? `
Next Steps:
- This MSDS has been approved and saved to your account
- You can now use this product in your operations
- Ensure all safety protocols are followed as per the MSDS
`
    : action === "rejected"
      ? `
Action Required:
${reason || "This MSDS requires revision. Please review the feedback and resubmit with the necessary corrections."}
`
      : ""
}

---
This is an automated notification from BlueDXP MSDS Management System
© ${new Date().getFullYear()} BlueDXP Platform. All rights reserved.
    `;

    return text.trim();
  }
}

export const msdsEmailReportService = new MSDSEmailReportService();
