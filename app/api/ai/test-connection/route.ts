/**
 * API Connection Test Endpoint
 * Tests if API keys are working by making a simple API call
 */

import { NextRequest, NextResponse } from "next/server";
import { apiAuthMiddleware } from "@/middleware/apiAuth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const auth = await apiAuthMiddleware(request);
    if (!auth.authorized || !auth.context) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { provider = "auto" } = body;

    // Get API keys from multiple sources
    const allowClientSuppliedKeys =
      process.env.NODE_ENV !== "production" ||
      (process.env.ALLOW_CLIENT_SUPPLIED_AI_KEYS || "").toLowerCase() ===
        "true";

    const openaiKey =
      process.env.OPENAI_API_KEY ||
      process.env.NEXT_PUBLIC_OPENAI_API_KEY ||
      (allowClientSuppliedKeys ? request.headers.get("x-openai-key") : null);

    const anthropicKey =
      process.env.ANTHROPIC_API_KEY ||
      process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY ||
      (allowClientSuppliedKeys ? request.headers.get("x-anthropic-key") : null);

    // Determine which provider to test
    let testProvider: "openai" | "anthropic" | null = null;
    let testKey: string | null = null;

    if (provider === "openai" || provider === "auto") {
      if (openaiKey) {
        testProvider = "openai";
        testKey = openaiKey;
      }
    }

    if (
      (provider === "anthropic" || (provider === "auto" && !testProvider)) &&
      anthropicKey
    ) {
      testProvider = "anthropic";
      testKey = anthropicKey;
    }

    if (!testProvider || !testKey) {
      return NextResponse.json(
        {
          success: false,
          error: "No API key found",
          details: {
            checkedOpenAI: !!openaiKey,
            checkedAnthropic: !!anthropicKey,
            provider,
            sources: {
              envOpenAI: !!process.env.OPENAI_API_KEY,
              envAnthropic: !!process.env.ANTHROPIC_API_KEY,
              clientOpenAI: !!request.headers.get("x-openai-key"),
              clientAnthropic: !!request.headers.get("x-anthropic-key"),
            },
          },
          suggestion:
            "Add your API key in Settings > AI & Agents or set OPENAI_API_KEY/ANTHROPIC_API_KEY in .env.local",
        },
        { status: 400 },
      );
    }

    // Validate key format
    if (
      testProvider === "openai" &&
      (!testKey.startsWith("sk-") || testKey.length < 20)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid OpenAI API key format",
          details:
            'OpenAI keys should start with "sk-" and be at least 20 characters',
        },
        { status: 400 },
      );
    }

    if (
      testProvider === "anthropic" &&
      (!testKey.startsWith("sk-ant-") || testKey.length < 20)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid Anthropic API key format",
          details:
            'Anthropic keys should start with "sk-ant-" and be at least 20 characters',
        },
        { status: 400 },
      );
    }

    // Make a test API call
    const testMessage = 'Say "API connection successful" if you can read this.';

    try {
      let response: Response;
      let result: any;

      if (testProvider === "openai") {
        response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${testKey}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: testMessage }],
            max_tokens: 50,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          return NextResponse.json(
            {
              success: false,
              error: "OpenAI API call failed",
              details: {
                status: response.status,
                statusText: response.statusText,
                error: errorData.error || errorData.message || "Unknown error",
              },
              provider: "openai",
            },
            { status: response.status },
          );
        }

        result = await response.json();
        const content = result.choices?.[0]?.message?.content || "No response";

        return NextResponse.json({
          success: true,
          provider: "openai",
          message: "API connection successful!",
          response: content,
          model: result.model,
          tokensUsed: result.usage?.total_tokens,
          details: {
            keyFormat: "valid",
            keyLength: testKey.length,
            apiStatus: "working",
          },
        });
      } else {
        // Anthropic
        response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": testKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-3-haiku-20240307",
            max_tokens: 50,
            messages: [{ role: "user", content: testMessage }],
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          return NextResponse.json(
            {
              success: false,
              error: "Anthropic API call failed",
              details: {
                status: response.status,
                statusText: response.statusText,
                error: errorData.error || errorData.message || "Unknown error",
              },
              provider: "anthropic",
            },
            { status: response.status },
          );
        }

        result = await response.json();
        const content = result.content?.[0]?.text || "No response";

        return NextResponse.json({
          success: true,
          provider: "anthropic",
          message: "API connection successful!",
          response: content,
          model: result.model,
          tokensUsed: result.usage
            ? result.usage.input_tokens + result.usage.output_tokens
            : undefined,
          details: {
            keyFormat: "valid",
            keyLength: testKey.length,
            apiStatus: "working",
          },
        });
      }
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          error: "Network or API error",
          details: {
            message: error.message,
            type: error.name,
          },
          provider: testProvider,
        },
        { status: 500 },
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
