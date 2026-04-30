/**
 * Saudi Government API Routes
 * Unified endpoint for all government agency integrations
 */

import { NextRequest, NextResponse } from "next/server";
import {
  TGAService,
  MOTService,
  AbsherService,
  NAFATHService,
  SABERService,
  SFDAService,
  ZATCAService,
  SAMAService,
  NCSCService,
  SDAIAService,
  SASOService,
  MODONService,
  MOCService,
  MOIService,
  MOMRAService,
  MISAService,
  CITCService,
} from "@/lib/services/saudi-government";

// Agency service map
const services: Record<string, any> = {
  tga: TGAService,
  mot: MOTService,
  absher: AbsherService,
  nafath: NAFATHService,
  saber: SABERService,
  sfda: SFDAService,
  zatca: ZATCAService,
  sama: SAMAService,
  ncsc: NCSCService,
  sdaia: SDAIAService,
  saso: SASOService,
  modon: MODONService,
  moc: MOCService,
  moi: MOIService,
  momra: MOMRAService,
  misa: MISAService,
  citc: CITCService,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agency, action, ...params } = body;

    if (!agency || !action) {
      return NextResponse.json(
        {
          success: false,
          errors: [
            {
              code: "VALIDATION_ERROR",
              message: "Agency and action are required",
            },
          ],
        },
        { status: 400 },
      );
    }

    const ServiceClass = services[agency.toLowerCase()];
    if (!ServiceClass) {
      return NextResponse.json(
        {
          success: false,
          errors: [
            { code: "INVALID_AGENCY", message: `Unknown agency: ${agency}` },
          ],
        },
        { status: 400 },
      );
    }

    const service = new ServiceClass();
    const result = await (service as any)[action](...Object.values(params));

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        agency,
        action,
      },
    });
  } catch (error: any) {
    console.error("Saudi Government API Error:", error);
    return NextResponse.json(
      {
        success: false,
        errors: [{ code: "API_ERROR", message: error.message }],
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const agency = searchParams.get("agency");
  const action = searchParams.get("action");

  if (!agency || !action) {
    return NextResponse.json(
      {
        success: false,
        errors: [
          {
            code: "VALIDATION_ERROR",
            message: "Agency and action query parameters are required",
          },
        ],
      },
      { status: 400 },
    );
  }

  const ServiceClass = services[agency.toLowerCase()];
  if (!ServiceClass) {
    return NextResponse.json(
      {
        success: false,
        errors: [
          { code: "INVALID_AGENCY", message: `Unknown agency: ${agency}` },
        ],
      },
      { status: 400 },
    );
  }

  try {
    const service = new ServiceClass();
    const params: any = {};
    searchParams.forEach((value, key) => {
      if (key !== "agency" && key !== "action") {
        params[key] = value;
      }
    });

    const result = await (service as any)[action](...Object.values(params));

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        agency,
        action,
      },
    });
  } catch (error: any) {
    console.error("Saudi Government API Error:", error);
    return NextResponse.json(
      {
        success: false,
        errors: [{ code: "API_ERROR", message: error.message }],
      },
      { status: 500 },
    );
  }
}
