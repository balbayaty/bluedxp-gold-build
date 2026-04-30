/**
 * Document Vision OCR Service (server-side)
 *
 * Purpose:
 * - Extract raw text from an image using multimodal LLMs (OpenAI / Anthropic)
 * - Used as a fallback when classical OCR (Tesseract) is unavailable or low-confidence
 *
 * Security & multi-tenant:
 * - Accepts tenantId for cache keying and audit metadata.
 * - Does NOT persist raw images; callers control storage.
 */

import OpenAI from "openai";
import { Anthropic } from "@anthropic-ai/sdk";
import { visionResilienceService } from "@/lib/services/ai/vision/visionResilienceService";

export type DocumentVisionOCRProvider = "openai" | "anthropic" | "auto";

export interface DocumentVisionOCRConfig {
  tenantId: string;
  provider?: DocumentVisionOCRProvider;
  openaiKey?: string;
  anthropicKey?: string;
  mimeType?: string; // e.g. image/png
  maxTokens?: number;
}

export interface DocumentVisionOCRResult {
  text: string;
  provider: "openai" | "anthropic";
  model: string;
  confidence: number; // 0-100 (heuristic)
  warnings?: string[];
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function normalizeMimeType(mimeType?: string): string {
  const mt = (mimeType || "").toLowerCase();
  if (mt.startsWith("image/")) return mt;
  return "image/png";
}

function guessConfidence(text: string): number {
  // Heuristic confidence: longer text + more line structure => higher.
  const len = (text || "").trim().length;
  if (len <= 0) return 0;
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const hasManyLines = lines.length >= 8;
  const hasSectionLike =
    /section\s+\d+|hazards|first aid|handling|storage|transport/i.test(text);
  const base = clamp(Math.round(Math.min(100, (len / 1500) * 100)), 10, 95);
  return clamp(
    base + (hasManyLines ? 5 : 0) + (hasSectionLike ? 5 : 0),
    0,
    100,
  );
}

class DocumentVisionOCRService {
  private getOpenAIClient(openaiKey?: string): OpenAI | null {
    const key = (
      openaiKey ||
      process.env.OPENAI_API_KEY ||
      process.env.NEXT_PUBLIC_OPENAI_API_KEY ||
      ""
    ).trim();
    if (!key || key.length < 20) {
      console.warn(
        "[document-vision-ocr] ⚠️ OpenAI API key not provided or invalid",
      );
      return null;
    }
    console.log(
      "[document-vision-ocr] ✅ OpenAI client initialized with provided key",
    );
    return new OpenAI({ apiKey: key });
  }

  private getAnthropicClient(anthropicKey?: string): Anthropic | null {
    const key = (
      anthropicKey ||
      process.env.ANTHROPIC_API_KEY ||
      process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY ||
      ""
    ).trim();
    if (!key || key.length < 20) {
      console.warn(
        "[document-vision-ocr] ⚠️ Anthropic API key not provided or invalid",
      );
      return null;
    }
    console.log(
      "[document-vision-ocr] ✅ Anthropic client initialized with provided key",
    );
    return new Anthropic({ apiKey: key });
  }

  private buildOCRPrompt(): { system: string; user: string } {
    const system =
      "You are a document OCR engine. Your job is to transcribe text from images accurately. " +
      "Do not summarize. Do not invent. Preserve numbers, units, and hazard codes (Hxxx, Pxxx), CAS numbers, UN numbers. " +
      "If parts are unreadable, omit them rather than guessing.";

    const user =
      "Extract and return ONLY the raw text content from this document image.\n" +
      "- Keep line breaks where they help readability.\n" +
      "- Preserve tables as aligned text if possible.\n" +
      "- If you see SDS sections, include section headings.\n";

    return { system, user };
  }

  private async extractWithOpenAI(
    imageBase64: string,
    config: DocumentVisionOCRConfig,
  ): Promise<DocumentVisionOCRResult> {
    const client = this.getOpenAIClient(config.openaiKey);
    if (!client) {
      console.error(
        "[document-vision-ocr] ❌ OpenAI not configured - no valid API key provided",
      );
      throw new Error(
        "OpenAI not configured for document OCR. Please provide OPENAI_API_KEY or configure it in settings.",
      );
    }
    console.log(
      "[document-vision-ocr] 🔵 Using OpenAI GPT-4 Vision for OCR...",
    );

    const mimeType = normalizeMimeType(config.mimeType);
    const { system, user } = this.buildOCRPrompt();
    const model = "gpt-4o";

    const resp = await client.chat.completions.create({
      model,
      max_tokens: Math.max(
        300,
        Math.min(4000, Number(config.maxTokens || 2000)),
      ),
      temperature: 0,
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: [
            { type: "text", text: user },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${imageBase64}` },
            },
          ],
        },
      ],
    });

    const text = (resp.choices?.[0]?.message?.content || "").trim();
    return {
      text,
      provider: "openai",
      model,
      confidence: guessConfidence(text),
    };
  }

  private async extractWithAnthropic(
    imageBase64: string,
    config: DocumentVisionOCRConfig,
  ): Promise<DocumentVisionOCRResult> {
    const client = this.getAnthropicClient(config.anthropicKey);
    if (!client) {
      console.error(
        "[document-vision-ocr] ❌ Anthropic not configured - no valid API key provided",
      );
      throw new Error(
        "Anthropic not configured for document OCR. Please provide ANTHROPIC_API_KEY or configure it in settings.",
      );
    }
    console.log(
      "[document-vision-ocr] 🟣 Using Anthropic Claude Vision for OCR...",
    );

    const mimeType = normalizeMimeType(config.mimeType);
    const { system, user } = this.buildOCRPrompt();
    const model = "claude-3-5-sonnet-20241022";

    const resp = await client.messages.create({
      model,
      max_tokens: Math.max(
        300,
        Math.min(4000, Number(config.maxTokens || 2000)),
      ),
      temperature: 0,
      system,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType,
                data: imageBase64,
              },
            },
            { type: "text", text: user },
          ],
        },
      ],
    });

    const text = (
      resp.content.find((c) => c.type === "text")?.text || ""
    ).trim();
    return {
      text,
      provider: "anthropic",
      model,
      confidence: guessConfidence(text),
    };
  }

  async extractTextFromImageBase64(
    imageBase64: string,
    config: DocumentVisionOCRConfig,
  ): Promise<DocumentVisionOCRResult> {
    const provider = config.provider || "auto";
    const cacheKey = `doc-ocr:${config.tenantId}:${provider}:${imageBase64.substring(0, 48)}`;

    const openaiFn = () => this.extractWithOpenAI(imageBase64, config);
    const anthropicFn = () => this.extractWithAnthropic(imageBase64, config);

    if (provider === "openai") return openaiFn();
    if (provider === "anthropic") return anthropicFn();

    // auto (OpenAI -> Anthropic -> cached)
    return visionResilienceService.executeWithProviderFallback(
      openaiFn,
      anthropicFn,
      cacheKey,
    );
  }

  async extractTextFromImageBuffer(
    imageBuffer: Buffer,
    config: DocumentVisionOCRConfig,
  ): Promise<DocumentVisionOCRResult> {
    const base64 = imageBuffer.toString("base64");
    return this.extractTextFromImageBase64(base64, config);
  }
}

export const documentVisionOCRService = new DocumentVisionOCRService();
