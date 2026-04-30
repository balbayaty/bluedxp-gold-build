"use client";

/**
 * Compatibility shim: keep legacy/duplicate route working.
 *
 * Runtime reachability:
 * - Next.js App Router will expose this file at `/ai-vision/history/history`.
 *
 * Canonical implementation:
 * - `app/ai-vision/history/page.tsx` (`/ai-vision/history`)
 */

export { default } from "../page";
