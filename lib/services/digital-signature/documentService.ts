/**
 * Document Service - Document Management for Digital Signatures
 * Handles document upload, storage, preparation, and signing
 */

import {
  Document,
  DocumentMetadata,
  SignatureField,
  IDocumentService,
  DocumentType,
  DocumentStatus,
} from "@/types/digital-signature";
import { eventBus } from "@/lib/services/event-store";
import { auditService } from "@/lib/services/audit/auditService";
import { v4 as uuidv4 } from "uuid";
import * as crypto from "crypto";

// In-memory storage (will be replaced with database and MinIO/S3)
const documentStore = new Map<string, Document>();

class DocumentService implements IDocumentService {
  /**
   * Upload Document
   */
  async uploadDocument(
    file: File | Buffer,
    metadata: DocumentMetadata,
  ): Promise<Document> {
    try {
      // Convert File to Buffer if needed
      let buffer: Buffer;
      if (file instanceof File) {
        const arrayBuffer = await file.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      } else {
        buffer = file;
      }

      // Generate document hash
      const hash = crypto.createHash("sha256").update(buffer).digest("hex");

      // Create document
      const document: Document = {
        id: uuidv4(),
        organizationId: metadata.organizationId,
        createdByUserId: metadata.createdByUserId,
        documentType: metadata.documentType || "contract",
        title: metadata.title,
        titleAr: metadata.titleAr,
        fileName: metadata.fileName || "document.pdf",
        fileSize: buffer.length,
        mimeType: metadata.mimeType || "application/pdf",
        hash,
        status: "draft",
        storagePath: `documents/${metadata.organizationId}/${uuidv4()}.pdf`, // TODO: Store in MinIO/S3
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      documentStore.set(document.id, document);

      // Log audit event
      await auditService.log({
        actionType: "document.uploaded",
        actionCategory: "document",
        actionDescription: `Document uploaded: ${metadata.title}`,
        entityType: "document",
        entityId: document.id,
        newState: {
          fileName: document.fileName,
          documentType: document.documentType,
          fileSize: document.fileSize,
        },
      });

      // Publish event
      await eventBus.publish("digital-signature.document.uploaded", {
        documentId: document.id,
        organizationId: document.organizationId,
        createdByUserId: document.createdByUserId,
      });

      return document;
    } catch (error) {
      throw new Error(
        `Failed to upload document: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Prepare Document for Signing
   */
  async prepareForSigning(
    documentId: string,
    fields: SignatureField[],
  ): Promise<Document> {
    const document = documentStore.get(documentId);
    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }

    document.status = "ready_for_signing";
    document.signatureFields = fields;
    document.updatedAt = new Date();

    // Log audit event
    await auditService.log({
      actionType: "document.prepared_for_signing",
      actionCategory: "document",
      actionDescription: `Document prepared for signing: ${document.title}`,
      entityType: "document",
      entityId: document.id,
    });

    return document;
  }

  /**
   * Apply Signed Document
   */
  async applySignedDocument(
    documentId: string,
    signedBuffer: Buffer,
  ): Promise<Document> {
    const document = documentStore.get(documentId);
    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }

    // Generate new hash for signed document
    const signedHash = crypto
      .createHash("sha256")
      .update(signedBuffer)
      .digest("hex");

    document.status = "signed";
    document.signedHash = signedHash;
    document.signedAt = new Date();
    document.updatedAt = new Date();
    document.signedStoragePath = `documents/${document.organizationId}/signed/${document.id}.pdf`; // TODO: Store in MinIO/S3

    // Log audit event
    await auditService.log({
      actionType: "document.signed",
      actionCategory: "document",
      actionDescription: `Document signed: ${document.title}`,
      entityType: "document",
      entityId: document.id,
    });

    // Publish event
    await eventBus.publish("digital-signature.document.signed", {
      documentId: document.id,
      organizationId: document.organizationId,
    });

    return document;
  }

  /**
   * Generate Download URL
   */
  async generateDownloadUrl(
    documentId: string,
    signed: boolean = false,
  ): Promise<string> {
    const document = documentStore.get(documentId);
    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }

    // TODO: Generate presigned URL from MinIO/S3
    const path =
      signed && document.signedStoragePath
        ? document.signedStoragePath
        : document.storagePath;

    return `/api/v1/signatures/documents/${documentId}/download${signed ? "?signed=true" : ""}`;
  }

  /**
   * Get Document
   */
  getDocument(documentId: string): Document | undefined {
    return documentStore.get(documentId);
  }

  /**
   * Get Organization Documents
   */
  getOrganizationDocuments(organizationId: string): Document[] {
    return Array.from(documentStore.values()).filter(
      (doc) => doc.organizationId === organizationId,
    );
  }

  /**
   * Update Document Status
   */
  updateDocumentStatus(documentId: string, status: DocumentStatus): void {
    const document = documentStore.get(documentId);
    if (document) {
      document.status = status;
      document.updatedAt = new Date();
    }
  }
}

export const documentService = new DocumentService();
