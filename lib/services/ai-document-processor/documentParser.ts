/**
 * Universal Document Parser
 * Extracts text and structure from various document formats
 * Supports: PDF, Word, Excel, PowerPoint, Images (OCR), Text, Markdown
 */

import * as pdfParse from "pdf-parse";
import * as XLSX from "xlsx";
import Tesseract from "tesseract.js";

export interface ParsedDocument {
  id: string;
  filename: string;
  type: DocumentType;
  content: {
    text: string;
    structured?: {
      sections?: DocumentSection[];
      tables?: Table[];
      images?: ImageReference[];
      metadata?: Record<string, any>;
    };
  };
  metadata: {
    pageCount?: number;
    wordCount?: number;
    language?: string;
    createdAt: string;
    extractedAt: string;
  };
}

export type DocumentType =
  | "pdf"
  | "docx"
  | "xlsx"
  | "pptx"
  | "txt"
  | "md"
  | "html"
  | "image"; // PNG, JPG, etc. (uses OCR)

export interface DocumentSection {
  title: string;
  content: string;
  level: number;
  pageNumber?: number;
}

export interface Table {
  headers: string[];
  rows: string[][];
  pageNumber?: number;
}

export interface ImageReference {
  description?: string;
  pageNumber?: number;
  extractedText?: string; // OCR text if applicable
}

export class UniversalDocumentParser {
  /**
   * Parse any document type
   */
  async parseDocument(
    file: File | Buffer,
    filename: string,
  ): Promise<ParsedDocument> {
    const type = this.detectDocumentType(filename);
    const id = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    let content: ParsedDocument["content"];

    switch (type) {
      case "pdf":
        content = await this.parsePDF(file as Buffer);
        break;
      case "docx":
        content = await this.parseDOCX(file as Buffer);
        break;
      case "xlsx":
        content = await this.parseXLSX(file as Buffer);
        break;
      case "pptx":
        content = await this.parsePPTX(file as Buffer);
        break;
      case "txt":
      case "md":
      case "html":
        content = await this.parseText(file as Buffer);
        break;
      case "image":
        content = await this.parseImage(file as File | Buffer);
        break;
      default:
        throw new Error(`Unsupported document type: ${type}`);
    }

    return {
      id,
      filename,
      type,
      content,
      metadata: {
        wordCount: this.countWords(content.text),
        extractedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Detect document type from filename
   */
  private detectDocumentType(filename: string): DocumentType {
    const ext = filename.toLowerCase().split(".").pop() || "";

    if (["pdf"].includes(ext)) return "pdf";
    if (["doc", "docx"].includes(ext)) return "docx";
    if (["xls", "xlsx"].includes(ext)) return "xlsx";
    if (["ppt", "pptx"].includes(ext)) return "pptx";
    if (["txt"].includes(ext)) return "txt";
    if (["md", "markdown"].includes(ext)) return "md";
    if (["html", "htm"].includes(ext)) return "html";
    if (["png", "jpg", "jpeg", "gif", "bmp", "tiff"].includes(ext))
      return "image";

    return "txt"; // Default
  }

  /**
   * Parse PDF document
   */
  private async parsePDF(buffer: Buffer): Promise<ParsedDocument["content"]> {
    const data = await pdfParse(buffer);

    const text = data.text;
    const sections = this.extractSections(text);
    const tables = this.extractTablesFromText(text);

    return {
      text,
      structured: {
        sections,
        tables,
        metadata: {
          pageCount: data.numpages,
          info: data.info,
        },
      },
    };
  }

  /**
   * Parse DOCX document (simplified - would use mammoth or docx in production)
   */
  private async parseDOCX(buffer: Buffer): Promise<ParsedDocument["content"]> {
    // In production, use: import mammoth from 'mammoth'
    // For now, return text extraction
    const text = buffer.toString("utf-8");
    const sections = this.extractSections(text);

    return {
      text,
      structured: {
        sections,
      },
    };
  }

  /**
   * Parse XLSX document
   */
  private async parseXLSX(buffer: Buffer): Promise<ParsedDocument["content"]> {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    let fullText = "";
    const tables: Table[] = [];

    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
      }) as string[][];

      if (jsonData.length > 0) {
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as string[][];

        tables.push({
          headers,
          rows,
        });

        fullText += `Sheet: ${sheetName}\n`;
        fullText += headers.join(" | ") + "\n";
        rows.forEach((row) => {
          fullText += row.join(" | ") + "\n";
        });
        fullText += "\n";
      }
    });

    return {
      text: fullText,
      structured: {
        tables,
      },
    };
  }

  /**
   * Parse PPTX document (simplified)
   */
  private async parsePPTX(buffer: Buffer): Promise<ParsedDocument["content"]> {
    // In production, use: import PizZip from 'pizzip'
    // For now, return text extraction
    const text = buffer.toString("utf-8");
    const sections = this.extractSections(text);

    return {
      text,
      structured: {
        sections,
      },
    };
  }

  /**
   * Parse text document
   */
  private async parseText(buffer: Buffer): Promise<ParsedDocument["content"]> {
    const text = buffer.toString("utf-8");
    const sections = this.extractSections(text);

    return {
      text,
      structured: {
        sections,
      },
    };
  }

  /**
   * Parse image using OCR
   */
  private async parseImage(
    file: File | Buffer,
  ): Promise<ParsedDocument["content"]> {
    const imageBuffer =
      file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;

    // Use Tesseract.js for OCR
    const {
      data: { text },
    } = await Tesseract.recognize(imageBuffer, "eng", {
      logger: (m) => console.log(m), // Optional: log progress
    });

    return {
      text,
      structured: {
        images: [
          {
            extractedText: text,
          },
        ],
      },
    };
  }

  /**
   * Extract sections from text
   */
  private extractSections(text: string): DocumentSection[] {
    const sections: DocumentSection[] = [];
    const lines = text.split("\n");

    let currentSection: DocumentSection | null = null;
    let currentContent: string[] = [];

    lines.forEach((line, index) => {
      // Detect headings (lines that are short, uppercase, or have specific patterns)
      const isHeading = this.isLikelyHeading(line);

      if (isHeading && currentSection) {
        // Save previous section
        currentSection.content = currentContent.join("\n");
        sections.push(currentSection);

        // Start new section
        currentSection = {
          title: line.trim(),
          content: "",
          level: this.getHeadingLevel(line),
          pageNumber: Math.floor(index / 50) + 1, // Estimate page number
        };
        currentContent = [];
      } else if (isHeading && !currentSection) {
        // First section
        currentSection = {
          title: line.trim(),
          content: "",
          level: this.getHeadingLevel(line),
          pageNumber: 1,
        };
        currentContent = [];
      } else if (currentSection) {
        currentContent.push(line);
      }
    });

    // Save last section
    if (currentSection) {
      currentSection.content = currentContent.join("\n");
      sections.push(currentSection);
    }

    return sections;
  }

  /**
   * Check if line is likely a heading
   */
  private isLikelyHeading(line: string): boolean {
    const trimmed = line.trim();
    if (trimmed.length === 0) return false;

    // Check for common heading patterns
    const headingPatterns = [
      /^#{1,6}\s/, // Markdown headings
      /^[A-Z][A-Z\s]{2,50}$/, // All caps short lines
      /^\d+\.\s+[A-Z]/, // Numbered headings
      /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*:?$/, // Title case headings
    ];

    return (
      headingPatterns.some((pattern) => pattern.test(trimmed)) &&
      trimmed.length < 100
    ); // Headings are usually short
  }

  /**
   * Get heading level
   */
  private getHeadingLevel(line: string): number {
    const markdownMatch = line.match(/^(#{1,6})\s/);
    if (markdownMatch) {
      return markdownMatch[1].length;
    }
    return 1; // Default level
  }

  /**
   * Extract tables from text (simple pattern matching)
   */
  private extractTablesFromText(text: string): Table[] {
    const tables: Table[] = [];
    const lines = text.split("\n");

    // Look for table patterns (rows with | or tabs)
    let currentTable: string[][] = [];

    lines.forEach((line) => {
      if (line.includes("|") || line.includes("\t")) {
        const cells = line
          .split(/[|\t]/)
          .map((c) => c.trim())
          .filter((c) => c);
        if (cells.length > 1) {
          currentTable.push(cells);
        }
      } else if (currentTable.length > 0) {
        // End of table
        if (currentTable.length > 1) {
          tables.push({
            headers: currentTable[0],
            rows: currentTable.slice(1),
          });
        }
        currentTable = [];
      }
    });

    // Save last table
    if (currentTable.length > 1) {
      tables.push({
        headers: currentTable[0],
        rows: currentTable.slice(1),
      });
    }

    return tables;
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }
}

export const documentParser = new UniversalDocumentParser();
