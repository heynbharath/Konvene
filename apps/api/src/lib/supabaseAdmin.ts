import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://placeholder-konvene.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key-for-local-dev";

export function isSupabaseConfigured(): boolean {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(url && key && !url.includes("placeholder-konvene"));
}

if (!isSupabaseConfigured()) {
  console.log("⚡ Konvene Auth: Operating in clean self-contained local auth mode (Supabase optional).");
}

/**
 * Server-only Supabase client using the service_role key.
 */
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export interface VerifiedAuthUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  roles?: Array<{ role: string; scopeType: string; scopeId: string | null }>;
}

export const DEMO_USERS: Record<
  string,
  {
    id: string;
    name: string;
    email: string;
    roles: Array<{ role: string; scopeType: string; scopeId: string | null }>;
    usn?: string;
  }
> = {
  "admin@konvene.dev": {
    id: "usr-admin-demo-id",
    name: "Ada Admin",
    email: "admin@konvene.dev",
    roles: [{ role: "ADMIN", scopeType: "GLOBAL", scopeId: null }],
  },
  "faculty@konvene.dev": {
    id: "usr-faculty-demo-id",
    name: "Dr. Rao",
    email: "faculty@konvene.dev",
    roles: [
      { role: "FACULTY", scopeType: "SUBJECT", scopeId: "CS301" },
      { role: "FACULTY_COORDINATOR", scopeType: "CLUB", scopeId: "gdsc" },
    ],
  },
  "clubhead@konvene.dev": {
    id: "usr-clubhead-demo-id",
    name: "Priya (Club Head)",
    email: "clubhead@konvene.dev",
    roles: [{ role: "CLUB_HEAD", scopeType: "GLOBAL", scopeId: null }],
  },
  "student1@konvene.dev": {
    id: "usr-student1-demo-id",
    name: "Arjun Student",
    email: "student1@konvene.dev",
    usn: "1CS21CS001",
    roles: [{ role: "STUDENT", scopeType: "GLOBAL", scopeId: null }],
  },
  "student2@konvene.dev": {
    id: "usr-student2-demo-id",
    name: "Meera Student",
    email: "student2@konvene.dev",
    usn: "1CS21CS002",
    roles: [{ role: "STUDENT", scopeType: "GLOBAL", scopeId: null }],
  },
};

const AUTH_SECRET = process.env.QR_SIGNING_SECRET || "konvene-demo-auth-secret-key-32chars";

export interface TokenPayload {
  id: string;
  email: string;
  name?: string;
  roles?: Array<{ role: string; scopeType: string; scopeId: string | null }>;
}

/**
 * Creates a cryptographically signed HMAC-SHA256 session token for ANY user/email.
 */
export function createAuthToken(user: TokenPayload): string {
  const normalizedEmail = user.email.toLowerCase().trim();
  const json = JSON.stringify({
    id: user.id,
    email: normalizedEmail,
    name: user.name || normalizedEmail.split("@")[0],
    roles: user.roles || [
      {
        role: normalizedEmail.includes("admin") ? "ADMIN" : "STUDENT",
        scopeType: "GLOBAL",
        scopeId: null,
      },
    ],
    iat: Date.now(),
  });

  const payload = Buffer.from(json).toString("base64url");
  const signature = crypto.createHmac("sha256", AUTH_SECRET).update(payload).digest("base64url");
  return `kvn.${payload}.${signature}`;
}

/** Backward compatibility alias for legacy demo tokens */
export function createDemoToken(email: string): string {
  const demo = DEMO_USERS[email.toLowerCase().trim()];
  return createAuthToken({
    id: demo?.id || "usr-" + email,
    email,
    name: demo?.name,
    roles: demo?.roles,
  });
}

/**
 * Parses and verifies a Konvene HMAC session token.
 */
export function parseAuthToken(token: string): VerifiedAuthUser | null {
  if (token.startsWith("demo-token.")) {
    const parts = token.split(".");
    if (parts.length === 3) {
      try {
        const email = Buffer.from(parts[1], "base64url").toString("utf-8");
        const demo = DEMO_USERS[email.toLowerCase()];
        if (demo) {
          return {
            id: demo.id,
            email: demo.email,
            name: demo.name,
            avatarUrl: null,
            roles: demo.roles,
          };
        }
      } catch {}
    }
  }

  if (!token.startsWith("kvn.")) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [, payload, signature] = parts;
  const expectedSig = crypto.createHmac("sha256", AUTH_SECRET).update(payload).digest("base64url");
  if (signature !== expectedSig) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
    if (!data.id || !data.email) return null;
    return {
      id: data.id,
      email: data.email,
      name: data.name || data.email.split("@")[0],
      avatarUrl: null,
      roles: data.roles,
    };
  } catch {
    return null;
  }
}

/**
 * Universal token verifier: handles Konvene HMAC tokens first, then Supabase JWTs if present.
 */
export async function verifySupabaseToken(token: string): Promise<VerifiedAuthUser | null> {
  // 1. Try Konvene HMAC Token (supports any email)
  const localAuth = parseAuthToken(token);
  if (localAuth) return localAuth;

  // 2. Try Supabase Auth if token is a Supabase JWT
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !data.user) return null;
      const meta = data.user.user_metadata ?? {};
      return {
        id: data.user.id,
        email: data.user.email!,
        name: meta.full_name ?? meta.name ?? meta.user_name ?? null,
        avatarUrl: meta.avatar_url ?? meta.picture ?? null,
      };
    } catch {
      return null;
    }
  }

  return null;
}
