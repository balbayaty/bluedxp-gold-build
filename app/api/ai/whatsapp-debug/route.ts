import { NextRequest, NextResponse } from "next/server";
import { WhatsAppService } from "@/lib/services/whatsapp/whatsappService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message } = body;

    console.log(`💬 WHATSAPP AI: Analyzing message...`);

    const service = new WhatsAppService();
    const analysis = await service.analyzeIncidentReport(
      message,
      "+966500000000",
    );

    return NextResponse.json({
      model: "WhatsApp-Incident-Analyst-v1",
      result: analysis || { isIncident: false, confidence: 0.1 },
      status: "success",
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
