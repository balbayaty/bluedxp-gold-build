import { NextRequest, NextResponse } from "next/server";
import { apiAuthMiddleware } from "@/middleware/apiAuth";

export type ApiAuthOk = {
  tenantId: string;
  userId: string;
  roles: string[];
};

export async function requireAuth(
  request: NextRequest,
  options?: { anyRole?: string[] },
): Promise<
  { ok: true; auth: ApiAuthOk } | { ok: false; response: NextResponse }
> {
  const auth = await apiAuthMiddleware(request);
  if (!auth.authorized || !auth.context) {
    return {
      ok: false,
      response:
        auth.response ||
        NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 },
        ),
    };
  }

  const ctx = auth.context;
  const roles = ctx.roles || [];

  if (options?.anyRole?.length) {
    const allowed = options.anyRole.some((r) => roles.includes(r));
    if (!allowed) {
      return {
        ok: false,
        response: NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 },
        ),
      };
    }
  }

  return {
    ok: true,
    auth: { tenantId: ctx.tenantId, userId: ctx.userId, roles },
  };
}
