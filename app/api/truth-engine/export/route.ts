/**
 * Truth Engine Export API
 * Export timelines in various formats
 */

import { NextRequest, NextResponse } from "next/server";
import { TruthTimeline } from "@/types/truth-engine";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { format, timeline } = body;

    if (!format || !timeline) {
      return NextResponse.json(
        { success: false, error: "format and timeline are required" },
        { status: 400 },
      );
    }

    let content: string;
    let contentType: string;
    let filename: string;

    switch (format) {
      case "json":
        content = JSON.stringify(timeline, null, 2);
        contentType = "application/json";
        filename = `truth-timeline-${timeline.entityType}-${timeline.entityId}.json`;
        break;

      case "csv":
        content = generateCSV(timeline);
        contentType = "text/csv";
        filename = `truth-timeline-${timeline.entityType}-${timeline.entityId}.csv`;
        break;

      case "pdf":
        // Would generate PDF (would need a PDF library)
        return NextResponse.json(
          { success: false, error: "PDF export not yet implemented" },
          { status: 501 },
        );

      default:
        return NextResponse.json(
          { success: false, error: "Unsupported format" },
          { status: 400 },
        );
    }

    return new NextResponse(content, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Error exporting timeline:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to export timeline" },
      { status: 500 },
    );
  }
}

function generateCSV(timeline: TruthTimeline): string {
  const headers = [
    "Event ID",
    "Event Type",
    "Happened At",
    "Actor",
    "Confidence",
    "Evidence Count",
    "Status",
  ];
  const rows = timeline.events.map((event) => [
    event.id,
    event.eventType,
    event.happenedAt,
    `${event.actor.name} (${event.actor.role})`,
    (event.confidenceScore * 100).toFixed(0) + "%",
    event.evidenceLinks.length.toString(),
    event.status,
  ]);

  return [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");
}
