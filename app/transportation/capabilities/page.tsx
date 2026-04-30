/**
 * Transportation Capability Catalog
 *
 * Non-technical, single-glance view of what's REAL vs CONFIG REQUIRED vs SIMULATED.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageTemplate from "@/components/PageTemplate";
import { CapabilityBadge } from "@/components/CapabilityBadge";
import { transportationCapabilities } from "@/lib/services/capabilities/registry";
import type { CapabilityStatus } from "@/types/capabilities";

export default function TransportationCapabilitiesPage() {
  const [q, setQ] = useState("");
  const [resolvedById, setResolvedById] = useState<
    Record<string, CapabilityStatus>
  >({});

  // Load server-resolved statuses (auto-upgrades) without blocking render.
  // Important: this is a safety/clarity UX feature; it should never crash the page.
  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const res = await fetch("/api/transportation/capabilities/status", {
          method: "GET",
          headers: { Accept: "application/json" },
        });
        if (!res.ok) return;
        const json = (await res.json()) as {
          rows?: Array<{ path: string; status: CapabilityStatus }>;
        };
        const map: Record<string, CapabilityStatus> = {};
        for (const r of json.rows || []) map[r.status.id] = r.status;
        if (!cancelled) setResolvedById(map);
      } catch {
        // ignore
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const rows = transportationCapabilities.map((c) => ({
      path: c.path,
      status: resolvedById[c.status.id] || c.status,
    }));
    if (!query) return rows;
    return rows.filter((r) => {
      const hay =
        `${r.path} ${r.status.id} ${r.status.label} ${r.status.maturity} ${r.status.reason}`.toLowerCase();
      return hay.includes(query);
    });
  }, [q, resolvedById]);

  return (
    <PageTemplate
      title="Transportation Capability Catalog"
      description="Clear view of what is production-real vs simulated vs configuration-required across the Transportation module."
      icon="ri-radar-line"
      actions={
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search capabilities…"
            className="w-[260px] max-w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/40 outline-none focus:border-cyan-500/50"
          />
          <Link
            href="/transportation"
            className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm"
          >
            Back to Transportation
          </Link>
        </div>
      }
    >
      <div className="space-y-3">
        {filtered.map((row) => (
          <div
            key={row.status.id}
            className="flex items-start justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/40 transition"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <Link
                  href={row.path}
                  className="text-white font-semibold hover:underline"
                >
                  {row.status.label}
                </Link>
                <span className="text-xs text-white/50">{row.path}</span>
              </div>
              <div className="text-sm text-white/70 mt-1">
                {row.status.reason}
              </div>
              {row.status.howToFix && (
                <div className="text-sm text-cyan-300/90 mt-1">
                  How to make real: {row.status.howToFix}
                </div>
              )}
            </div>
            <div className="flex-shrink-0">
              <CapabilityBadge status={row.status} />
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-white/70">No matches.</div>
        )}
      </div>
    </PageTemplate>
  );
}
