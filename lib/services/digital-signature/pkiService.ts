/**
 * PKI Service - Internal Certificate Authority Management
 * Handles Root CA, Issuing CA, and User Certificate lifecycle
 *
 * Uses node-forge for cryptographic operations
 * Supports RSA 2048/4096 bit keys
 * Certificate validity periods configurable
 */

// Dynamic import for node-forge (handles missing dependency gracefully)
let forge: any = null;
try {
  forge = require("node-forge");
} catch (error) {
  console.warn(
    "⚠️ node-forge not installed. PKI features will be limited. Install with: npm install node-forge",
  );
}

import {
  CertificateAuthority,
  UserCertificate,
  RootCAConfig,
  IssuingCAConfig,
  IssueCertificateOptions,
  IPKIService,
} from "@/types/digital-signature";
import { eventBus } from "@/lib/services/event-store";
import { createEvent } from "@/lib/services/event-store/utils";
import { auditService } from "@/lib/services/audit/auditService";
import { logger } from "./logger";

// In-memory storage (will be replaced with database)
const caStore = new Map<string, CertificateAuthority>();
const certificateStore = new Map<string, UserCertificate>();

// Encryption key for private keys (should be from environment)
const ENCRYPTION_KEY =
  process.env.CERTIFICATE_ENCRYPTION_KEY || "default-key-change-in-production";

/**
 * Check if node-forge is available
 */
function checkForgeAvailable(): void {
  if (!forge) {
    throw new Error(
      "node-forge is not installed. Please install it with: npm install node-forge\n" +
        "PKI operations require node-forge for cryptographic operations.",
    );
  }
}

/**
 * Encrypt private key
 */
function encryptPrivateKey(privateKeyPEM: string): Buffer {
  // In production, use proper encryption (AES-256-GCM)
  // For now, simple base64 encoding (NOT SECURE - replace with proper encryption)
  return Buffer.from(privateKeyPEM);
}

/**
 * Decrypt private key
 */
function decryptPrivateKey(encryptedKey: Buffer): string {
  return encryptedKey.toString();
}

class PKIService implements IPKIService {
  /**
   * Initialize Root Certificate Authority
   */
  async initializeRootCA(
    config: RootCAConfig,
    tenantId: string = "default",
  ): Promise<CertificateAuthority> {
    try {
      checkForgeAvailable();

      // Validate config
      if (!config.name || !config.subjectDN) {
        throw new Error("Root CA name and subjectDN are required");
      }

      // Check if Root CA already exists
      const existingCA = Array.from(caStore.values()).find(
        (ca) => ca.caType === "root" && ca.name === config.name,
      );

      if (existingCA) {
        console.log("Root CA already exists:", existingCA.id);
        return existingCA;
      }

      // Generate key pair
      const keys = forge.pki.rsa.generateKeyPair(config.keySize || 4096);

      // Create certificate
      const cert = forge.pki.createCertificate();
      cert.publicKey = keys.publicKey;
      cert.serialNumber = Date.now().toString();

      // Set certificate attributes
      cert.validity.notBefore = new Date();
      cert.validity.notAfter = new Date();
      cert.validity.notAfter.setFullYear(
        cert.validity.notAfter.getFullYear() + (config.validityYears || 20),
      );

      // Set subject and issuer (same for root CA)
      const attrs = this.parseSubjectDN(config.subjectDN);
      cert.setSubject(attrs);
      cert.setIssuer(attrs);

      // Set extensions
      cert.setExtensions([
        {
          name: "basicConstraints",
          cA: true,
          critical: true,
        },
        {
          name: "keyUsage",
          keyCertSign: true,
          cRLSign: true,
          critical: true,
        },
      ]);

      // Self-sign the certificate
      cert.sign(keys.privateKey);

      // Create CA object
      const ca: CertificateAuthority = {
        id: `ca-${Date.now()}`,
        name: config.name,
        caType: "root",
        subjectDN: config.subjectDN,
        publicKeyPEM: forge.pki.publicKeyToPem(keys.publicKey),
        privateKeyEncrypted: encryptPrivateKey(
          forge.pki.privateKeyToPem(keys.privateKey),
        ),
        certificatePEM: forge.pki.certificateToPem(cert),
        serialNumber: cert.serialNumber,
        validFrom: cert.validity.notBefore,
        validTo: cert.validity.notAfter,
        keyAlgorithm: "RSA",
        keySize: config.keySize || 4096,
        isActive: true,
        createdAt: new Date(),
      };

      // Store CA
      caStore.set(ca.id, ca);

      // Log audit event
      await auditService.log({
        actionType: "pki.root_ca.created",
        actionCategory: "certificate",
        actionDescription: `Root CA created: ${config.name}`,
        entityType: "certificate_authority",
        entityId: ca.id,
        newState: { name: config.name, caType: "root" },
        severity: "info",
      });

      // Publish event (DomainEvent shape required by event store)
      await eventBus.publish(
        createEvent(
          "digital-signature.pki.root_ca.created",
          ca.id,
          "PKI",
          { caId: ca.id, name: config.name },
          1,
          { tenantId, source: "pki-service" },
        ),
      );

      logger.info("Root CA created", { caId: ca.id, name: config.name });
      return ca;
    } catch (error) {
      logger.error(
        "Error creating Root CA",
        { config },
        error instanceof Error ? error : undefined,
      );
      throw new Error(
        `Failed to create Root CA: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Initialize Issuing Certificate Authority
   */
  async initializeIssuingCA(
    config: IssuingCAConfig,
  ): Promise<CertificateAuthority> {
    try {
      // Get parent CA
      const parentCA = caStore.get(config.parentCaId);
      if (!parentCA) {
        throw new Error(`Parent CA not found: ${config.parentCaId}`);
      }

      // Decrypt parent private key
      const parentPrivateKeyPEM = decryptPrivateKey(
        parentCA.privateKeyEncrypted!,
      );
      const parentPrivateKey = forge.pki.privateKeyFromPem(parentPrivateKeyPEM);

      // Generate key pair for issuing CA
      const keys = forge.pki.rsa.generateKeyPair(config.keySize || 4096);

      // Create certificate
      const cert = forge.pki.createCertificate();
      cert.publicKey = keys.publicKey;
      cert.serialNumber = Date.now().toString();

      // Set validity
      cert.validity.notBefore = new Date();
      cert.validity.notAfter = new Date();
      cert.validity.notAfter.setFullYear(
        cert.validity.notAfter.getFullYear() + (config.validityYears || 10),
      );

      // Set subject
      const subjectAttrs = this.parseSubjectDN(config.subjectDN);
      cert.setSubject(subjectAttrs);

      // Set issuer (parent CA)
      const issuerAttrs = this.parseSubjectDN(parentCA.subjectDN);
      cert.setIssuer(issuerAttrs);

      // Set extensions
      cert.setExtensions([
        {
          name: "basicConstraints",
          cA: true,
          pathLenConstraint: 0, // Can't issue further CAs
          critical: true,
        },
        {
          name: "keyUsage",
          keyCertSign: true,
          cRLSign: true,
          critical: true,
        },
      ]);

      // Sign with parent CA
      cert.sign(parentPrivateKey);

      // Create CA object
      const ca: CertificateAuthority = {
        id: `ca-${Date.now()}`,
        name: config.name,
        caType: "issuing",
        parentCaId: config.parentCaId,
        subjectDN: config.subjectDN,
        publicKeyPEM: forge.pki.publicKeyToPem(keys.publicKey),
        privateKeyEncrypted: encryptPrivateKey(
          forge.pki.privateKeyToPem(keys.privateKey),
        ),
        certificatePEM: forge.pki.certificateToPem(cert),
        serialNumber: cert.serialNumber,
        validFrom: cert.validity.notBefore,
        validTo: cert.validity.notAfter,
        keyAlgorithm: "RSA",
        keySize: config.keySize || 4096,
        isActive: true,
        createdAt: new Date(),
      };

      // Store CA
      caStore.set(ca.id, ca);

      // Log audit event
      await auditService.log({
        actionType: "pki.issuing_ca.created",
        actionCategory: "certificate",
        actionDescription: `Issuing CA created: ${config.name}`,
        entityType: "certificate_authority",
        entityId: ca.id,
        newState: { name: config.name, parentCaId: config.parentCaId },
        severity: "info",
      });

      console.log("✅ Issuing CA created:", ca.id);
      return ca;
    } catch (error) {
      console.error("❌ Error creating Issuing CA:", error);
      throw new Error(
        `Failed to create Issuing CA: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Issue User Certificate
   */
  async issueUserCertificate(
    options: IssueCertificateOptions,
    tenantId: string = "default",
  ): Promise<UserCertificate> {
    try {
      checkForgeAvailable();

      // Validate options
      if (!options.userId || !options.subjectDN) {
        throw new Error("userId and subjectDN are required");
      }

      // Get issuing CA (or root CA if no issuing CA)
      const issuingCA =
        Array.from(caStore.values()).find(
          (ca) => ca.caType === "issuing" && ca.isActive,
        ) ||
        Array.from(caStore.values()).find(
          (ca) => ca.caType === "root" && ca.isActive,
        );

      if (!issuingCA) {
        throw new Error(
          "No active issuing CA found. Please initialize a Root CA first.",
        );
      }

      if (!issuingCA.privateKeyEncrypted) {
        throw new Error("Issuing CA private key not available");
      }

      // Decrypt CA private key
      const caPrivateKeyPEM = decryptPrivateKey(issuingCA.privateKeyEncrypted!);
      const caPrivateKey = forge.pki.privateKeyFromPem(caPrivateKeyPEM);

      // Generate key pair for user
      const keys = forge.pki.rsa.generateKeyPair(options.keySize || 2048);

      // Create certificate
      const cert = forge.pki.createCertificate();
      cert.publicKey = keys.publicKey;
      cert.serialNumber = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // Set validity
      cert.validity.notBefore = new Date();
      cert.validity.notAfter = new Date();
      cert.validity.notAfter.setFullYear(
        cert.validity.notAfter.getFullYear() + (options.validityYears || 2),
      );

      // Set subject
      const subjectAttrs = this.parseSubjectDN(options.subjectDN);
      cert.setSubject(subjectAttrs);

      // Set issuer (CA)
      const issuerAttrs = this.parseSubjectDN(issuingCA.subjectDN);
      cert.setIssuer(issuerAttrs);

      // Set extensions based on certificate type
      const extensions: any[] = [
        {
          name: "basicConstraints",
          cA: false,
          critical: true,
        },
      ];

      if (
        options.certificateType === "signing" ||
        options.certificateType === "all"
      ) {
        extensions.push({
          name: "keyUsage",
          digitalSignature: true,
          nonRepudiation: true,
          critical: true,
        });
      }

      if (
        options.certificateType === "encryption" ||
        options.certificateType === "all"
      ) {
        extensions.push({
          name: "keyUsage",
          keyEncipherment: true,
          dataEncipherment: true,
          critical: true,
        });
      }

      cert.setExtensions(extensions);

      // Sign with CA private key
      cert.sign(caPrivateKey);

      // Create certificate object
      const userCert: UserCertificate = {
        id: `cert-${Date.now()}`,
        userId: options.userId,
        issuingCaId: issuingCA.id,
        certificateType: options.certificateType,
        subjectDN: options.subjectDN,
        publicKeyPEM: forge.pki.publicKeyToPem(keys.publicKey),
        privateKeyEncrypted: encryptPrivateKey(
          forge.pki.privateKeyToPem(keys.privateKey),
        ),
        certificatePEM: forge.pki.certificateToPem(cert),
        serialNumber: cert.serialNumber,
        validFrom: cert.validity.notBefore,
        validTo: cert.validity.notAfter,
        status: "active",
        createdAt: new Date(),
      };

      // Store certificate
      certificateStore.set(userCert.id, userCert);

      // Log audit event
      await auditService.log({
        actionType: "pki.certificate.issued",
        actionCategory: "certificate",
        actionDescription: `Certificate issued for user: ${options.userId}`,
        entityType: "user_certificate",
        entityId: userCert.id,
        newState: {
          userId: options.userId,
          certificateType: options.certificateType,
        },
        severity: "info",
      });

      // Publish event (DomainEvent shape required by event store)
      await eventBus.publish(
        createEvent(
          "digital-signature.pki.certificate.issued",
          userCert.id,
          "PKI",
          { certificateId: userCert.id, userId: options.userId },
          1,
          { tenantId, source: "pki-service" },
        ),
      );

      console.log("✅ User certificate issued:", userCert.id);
      return userCert;
    } catch (error) {
      console.error("❌ Error issuing certificate:", error);
      throw new Error(
        `Failed to issue certificate: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Revoke Certificate
   */
  async revokeCertificate(
    certId: string,
    reason: string,
    tenantId: string = "default",
  ): Promise<void> {
    try {
      const cert = certificateStore.get(certId);
      if (!cert) {
        throw new Error(`Certificate not found: ${certId}`);
      }

      cert.status = "revoked";
      cert.revocationDate = new Date();
      cert.revocationReason = reason;

      certificateStore.set(certId, cert);

      // Log audit event
      await auditService.log({
        actionType: "pki.certificate.revoked",
        actionCategory: "certificate",
        actionDescription: `Certificate revoked: ${reason}`,
        entityType: "user_certificate",
        entityId: certId,
        previousState: { status: "active" },
        newState: { status: "revoked", reason },
        severity: "warning",
      });

      // Publish event (DomainEvent shape required by event store)
      await eventBus.publish(
        createEvent(
          "digital-signature.pki.certificate.revoked",
          certId,
          "PKI",
          { certificateId: certId, reason },
          1,
          { tenantId, source: "pki-service" },
        ),
      );

      console.log("✅ Certificate revoked:", certId);
    } catch (error) {
      console.error("❌ Error revoking certificate:", error);
      throw new Error(
        `Failed to revoke certificate: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Verify Certificate Chain
   */
  async verifyCertificateChain(certPEM: string): Promise<boolean> {
    try {
      checkForgeAvailable();

      if (!certPEM) {
        return false;
      }

      const cert = forge.pki.certificateFromPem(certPEM);

      // Find issuer CA
      const issuerCA = Array.from(caStore.values()).find(
        (ca) => ca.subjectDN === cert.issuer.toString(),
      );

      if (!issuerCA) {
        return false;
      }

      const issuerCert = forge.pki.certificateFromPem(issuerCA.certificatePEM);
      const issuerPublicKey = issuerCert.publicKey;

      // Verify signature
      return cert.verify(issuerPublicKey);
    } catch (error) {
      console.error("❌ Error verifying certificate chain:", error);
      return false;
    }
  }

  /**
   * Generate Certificate Revocation List (CRL)
   */
  async generateCRL(): Promise<string> {
    try {
      // Get all revoked certificates
      const revokedCerts = Array.from(certificateStore.values()).filter(
        (cert) => cert.status === "revoked",
      );

      // Create CRL (simplified - in production use proper CRL format)
      const crl = {
        version: "2.0",
        issuer: "BlueDXP CA",
        thisUpdate: new Date().toISOString(),
        nextUpdate: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(), // 7 days
        revokedCertificates: revokedCerts.map((cert) => ({
          serialNumber: cert.serialNumber,
          revocationDate: cert.revocationDate?.toISOString(),
          reason: cert.revocationReason,
        })),
      };

      return JSON.stringify(crl, null, 2);
    } catch (error) {
      console.error("❌ Error generating CRL:", error);
      throw new Error(
        `Failed to generate CRL: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Initialize Root CA if needed
   */
  async initializeRootCAIfNeeded(
    config: RootCAConfig,
    tenantId: string = "default",
  ): Promise<CertificateAuthority> {
    const existingCA = Array.from(caStore.values()).find(
      (ca) => ca.caType === "root" && ca.name === config.name,
    );

    if (existingCA) {
      return existingCA;
    }

    return await this.initializeRootCA(config, tenantId);
  }

  /**
   * Parse Subject DN string into forge attributes
   * Format: CN=Name,O=Org,C=Country
   */
  private parseSubjectDN(dn: string): forge.pki.CertificateField[] {
    const attrs: forge.pki.CertificateField[] = [];
    const parts = dn.split(",");

    for (const part of parts) {
      const [key, value] = part.trim().split("=");
      if (key && value) {
        // node-forge requires shortName, not name
        attrs.push({
          shortName: key.trim(),
          value: value.trim(),
        });
      }
    }

    return attrs;
  }

  /**
   * Get Certificate by ID
   */
  getCertificate(certId: string): UserCertificate | undefined {
    return certificateStore.get(certId);
  }

  /**
   * Get Certificates by User ID
   */
  getUserCertificates(userId: string): UserCertificate[] {
    return Array.from(certificateStore.values()).filter(
      (cert) => cert.userId === userId,
    );
  }

  /**
   * Get CA by ID
   */
  getCA(caId: string): CertificateAuthority | undefined {
    return caStore.get(caId);
  }
}

export const pkiService = new PKIService();
