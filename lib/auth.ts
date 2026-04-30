/**
 * Authentication Helper
 *
 * Provides:
 *   - authenticate(req)   -> simple header-based auth used by API routes
 *   - authOptions         -> NextAuth config consumed by getServerSession()
 *                            in 50+ routes that were partially migrated.
 *
 * NOTE on authOptions:
 *   The codebase was mid-migration when this snapshot was taken: many
 *   routes still call `getServerSession(authOptions)` from next-auth, but
 *   the original NextAuth provider chain was deleted. Returning a minimal
 *   credentials-based config keeps the build green AND keeps those routes
 *   functional in their existing fallback pattern:
 *
 *     const session = await getServerSession(authOptions);
 *     const userId  = session?.user?.id || "demo-user";   // graceful fallback
 *
 *   When a real auth integration is wired up (LinkedIn, Google, MFA, etc.)
 *   add providers / callbacks here. This shim is intentionally permissive
 *   so the build can proceed and routes can be tested.
 */

import { NextRequest } from "next/server";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  roles: string[];
}

export async function authenticate(req: NextRequest): Promise<AuthUser> {
  const userId = req.headers.get("x-user-id") || "default-user";
  const tenantId =
    req.headers.get("x-tenant-id") ||
    process.env.BOOTSTRAP_TENANT_ID ||
    "default-tenant";
  const userEmail = req.headers.get("x-user-email") || "user@example.com";
  const userName = req.headers.get("x-user-name") || "Default User";
  const userRoles = req.headers.get("x-user-roles")?.split(",") || [
    "SYSTEM_ADMIN",
  ];

  return {
    id: userId,
    email: userEmail,
    name: userName,
    tenantId,
    roles: userRoles,
  };
}

/**
 * Minimal NextAuth options.
 *
 * What it does today:
 *   - Provides a Credentials provider with a no-op authorize() so the
 *     build resolves and routes that call getServerSession() don't crash.
 *   - Exposes session.user.{id,email,name,tenantId,roles} via callbacks
 *     so the existing fallback pattern works.
 *
 * What to add later:
 *   - Real providers (LinkedIn, Google, etc.)
 *   - Real authorize() that checks DB
 *   - Adapter (Prisma) for persistent sessions
 */
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize() {
        // Intentionally not implemented yet -- return null to defer to
        // existing per-route fallback logic (`session?.user?.id || "demo-user"`).
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id?: string }).id;
        token.tenantId =
          (user as { tenantId?: string }).tenantId ||
          process.env.BOOTSTRAP_TENANT_ID ||
          "default-tenant";
        token.roles = (user as { roles?: string[] }).roles || [];
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { tenantId?: string }).tenantId =
          token.tenantId as string;
        (session.user as { roles?: string[] }).roles = token.roles as string[];
      }
      return session;
    },
  },
};
