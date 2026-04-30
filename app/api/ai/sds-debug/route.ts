import { NextRequest, NextResponse } from "next/server";
import { sdsParserService } from "@/lib/services/ml/sds-parser";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json(
        { error: "Text content is required" },
        { status: 400 },
      );
    }

    console.log(`📄 SDS PARSER: Analyzing ${text.length} chars...`);

    // Call the existing service
    const parsedData = await sdsParserService.parseSDS(text);

    return NextResponse.json({
      model: "SDS-Parser-Hybrid (Regex + AI)",
      result: parsedData,
      status: "success",
    });
  } catch (error) {
    console.error("SDS Parse Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
