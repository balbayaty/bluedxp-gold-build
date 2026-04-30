/**
 * Minimal Test Page - No Dependencies
 * This page tests if the app can render at all
 */
"use client";

export default function TestPage() {
  return (
    <div style={{ padding: "2rem", color: "white", background: "#0a0a0f" }}>
      <h1>Test Page - If you see this, the app works!</h1>
      <p>This is a minimal page with no dependencies.</p>
      <p>Time: {new Date().toLocaleTimeString()}</p>
    </div>
  );
}
