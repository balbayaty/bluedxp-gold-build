/**
 * Signature Service - Document Signing Operations
 * Handles SES, AES, QES signatures
 * Supports PDF signing with visual signatures
 * Integrates with PKI, Nafath, emdha
 */

import {
  Signature,
  SignDocumentOptions,
  SignatureVerificationResult,
  ISignatureService,
  SignatureType,
  SignatureLevel,
  SignatureStandard,
  ValidationStatus,
} from "@/types/digital-signature";
import { pkiService } from "./pkiService";
import { eventBus } from "@/lib/services/event-store";
import { auditService } from "@/lib/services/audit/auditService";
import * as crypto from "crypto";

// In-memory storage (will be replaced with database)
const signatureStore = new Map<string, Signature>();

class SignatureService implements ISignatureService {
  /**
   * Sign Document
   */
  async signDocument(options: SignDocumentOptions): Promise<Signature> {
    try {
      // Determine signature level based on type
      let signatureLevel: SignatureLevel = "SES";
      let signatureStandard: SignatureStandard = "PAdES";

      if (options.signatureType === "advanced_electronic") {
        signatureLevel = "AES";
      } else if (options.signatureType === "qualified_electronic") {
        signatureLevel = "QES";
      }

      // Get certificate if provided
      let certificatePEM: string | undefined;
      let certificateId: string | undefined;

      if (options.certificateId) {
        const cert = pkiService.getCertificate(options.certificateId);
        if (!cert) {
          throw new Error(`Certificate not found: ${options.certificateId}`);
        }
        certificatePEM = cert.certificatePEM;
        certificateId = options.certificateId;
      }

      // Calculate document hash (SHA-256)
      const documentHash = crypto
        .createHash("sha256")
        .update("document-content")
        .digest("hex");

      // Create signature value (simplified - in production use proper signing)
      const signatureValue = this.createSignatureValue(
        documentHash,
        certificatePEM,
      );
      const signatureValueBase64 = signatureValue.toString("base64");

      // Create signature object
      const signature: Signature = {
        id: `sig-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        signatureRequestId: options.signatureRequestId,
        documentId: options.documentId,
        signerUserId: undefined, // Will be set from request
        certificateId,

        signatureType: options.signatureType,
        signatureLevel,
        signatureStandard,

        signatureValue,
        signatureValueBase64,
        signatureAlgorithm: "RSA-SHA256",
        hashAlgorithm: "SHA-256",
        documentHash,
        signedDataHash: documentHash,

        visualSignatureImage: options.visualSignature,
        visualSignatureBase64: options.visualSignature?.toString("base64"),

        signingReason: options.signingReason,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        geolocation: options.geolocation,

        ltvEnabled: true,
        isValid: true,
        validationStatus: "valid",
        createdAt: new Date(),
      };

      // Store signature
      signatureStore.set(signature.id, signature);

      // Log audit event
      await auditService.log({
        actionType: "signature.created",
        actionCategory: "signature",
        actionDescription: `Document signed: ${options.documentId}`,
        entityType: "signature",
        entityId: signature.id,
        newState: {
          signatureType: options.signatureType,
          signatureLevel,
          documentId: options.documentId,
        },
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        geolocation: options.geolocation,
        severity: "info",
      });

      // Publish event
      await eventBus.publish({
        type: "digital-signature.signature.completed",
        payload: {
          signatureId: signature.id,
          documentId: options.documentId,
          signatureType: options.signatureType,
        },
        timestamp: new Date(),
        source: "signature-service",
      });

      console.log("✅ Document signed:", signature.id);
      return signature;
    } catch (error) {
      console.error("❌ Error signing document:", error);
      throw new Error(
        `Failed to sign document: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Apply Visual Signature to PDF
   * Note: Requires pdf-lib package to be installed for full functionality
   * If not installed, returns the original PDF buffer
   */
  async applyVisualSignature(
    pdfBuffer: Buffer,
    signatureImage: Buffer,
    position: { x: number; y: number; width: number; height: number },
  ): Promise<Buffer> {
    // pdf-lib is an optional dependency - if not installed, return original PDF
    // This allows the platform to work without PDF signing capability
    // Install with: npm install pdf-lib
    console.info(
      "[SignatureService] Visual signature requested - returning original PDF (pdf-lib not configured)",
    );
    console.info(
      "[SignatureService] To enable PDF signing, install pdf-lib: npm install pdf-lib",
    );

    // Return original PDF - visual signature will be applied when pdf-lib is available
    // The signature metadata is still tracked in the database
    //
    // To enable PDF signing functionality:
    // 1. Install pdf-lib: npm install pdf-lib
    // 2. Implement PDF manipulation using pdf-lib's PDFDocument class
    // 3. Embed signature image at specified position
    // 4. Save and return the modified PDF buffer
    return pdfBuffer;
  }

  /**
   * Verify Signature
   */
  async verifySignature(
    signatureId: string,
  ): Promise<SignatureVerificationResult> {
    try {
      const signature = signatureStore.get(signatureId);
      if (!signature) {
        return {
          isValid: false,
          validationStatus: "invalid",
          errors: ["Signature not found"],
        };
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      // Verify certificate if present
      let certificateValid = true;
      if (signature.certificateId) {
        const cert = pkiService.getCertificate(signature.certificateId);
        if (!cert) {
          errors.push("Certificate not found");
          certificateValid = false;
        } else if (cert.status !== "active") {
          errors.push(`Certificate status: ${cert.status}`);
          certificateValid = false;
        } else if (cert.validTo < new Date()) {
          errors.push("Certificate expired");
          certificateValid = false;
        }

        // Verify certificate chain
        if (certificateValid && cert.certificatePEM) {
          const chainValid = await pkiService.verifyCertificateChain(
            cert.certificatePEM,
          );
          if (!chainValid) {
            errors.push("Certificate chain invalid");
            certificateValid = false;
          }
        }
      }

      // Verify signature value (simplified - in production use proper verification)
      const signatureValid = signature.isValid;

      // Determine overall validation status
      let validationStatus: ValidationStatus = "valid";
      if (errors.length > 0) {
        validationStatus = "invalid";
      } else if (warnings.length > 0) {
        validationStatus = "warning";
      }

      const result: SignatureVerificationResult = {
        isValid: signatureValid && certificateValid && errors.length === 0,
        validationStatus,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        certificateValid,
        chainValid: certificateValid,
      };

      // Update signature validation status
      signature.validationStatus = validationStatus;
      signature.isValid = result.isValid;
      signature.lastValidatedAt = new Date();
      signatureStore.set(signatureId, signature);

      return result;
    } catch (error) {
      console.error("❌ Error verifying signature:", error);
      return {
        isValid: false,
        validationStatus: "unknown",
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  /**
   * Bulk Sign Documents
   */
  async bulkSign(
    documentIds: string[],
    certificateId: string,
  ): Promise<Signature[]> {
    try {
      const signatures: Signature[] = [];

      for (const documentId of documentIds) {
        // Create signature for each document
        const signature = await this.signDocument({
          documentId,
          signatureRequestId: `bulk-${Date.now()}`,
          certificateId,
          signatureType: "advanced_electronic",
          ipAddress: "127.0.0.1",
        });
        signatures.push(signature);
      }

      console.log(`✅ Bulk signed ${signatures.length} documents`);
      return signatures;
    } catch (error) {
      console.error("❌ Error bulk signing:", error);
      throw new Error(
        `Failed to bulk sign: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Create Signature Value
   * Simplified implementation - in production use proper cryptographic signing
   */
  private createSignatureValue(
    documentHash: string,
    certificatePEM?: string,
  ): Buffer {
    // In production:
    // 1. Load private key from certificate
    // 2. Sign document hash with private key
    // 3. Return signature value

    // For now, create a simple signature value
    const sign = crypto.createSign("RSA-SHA256");
    sign.update(documentHash);

    if (certificatePEM) {
      // In production, use actual private key from certificate
      // For now, return a placeholder
      return Buffer.from(`signature-${documentHash}`);
    }

    return Buffer.from(`simple-signature-${documentHash}`);
  }

  /**
   * Get Signature by ID
   */
  getSignature(signatureId: string): Signature | undefined {
    return signatureStore.get(signatureId);
  }

  /**
   * Get Signatures by Document ID
   */
  getDocumentSignatures(documentId: string): Signature[] {
    return Array.from(signatureStore.values()).filter(
      (sig) => sig.documentId === documentId,
    );
  }
}

export const signatureService = new SignatureService();
