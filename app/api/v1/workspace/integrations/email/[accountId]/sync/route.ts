/**
 * POST /api/v1/workspace/integrations/email/[accountId]/sync
 * Sync email account
 */

import { NextRequest, NextResponse } from "next/server";
import { emailService } from "@/lib/services/workspace/integrations/emailService";
import { getAuthUser } from "@/lib/services/workspace/utils/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { accountId: string } },
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await emailService.syncEmail(user.id, params.accountId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] Error syncing email:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
