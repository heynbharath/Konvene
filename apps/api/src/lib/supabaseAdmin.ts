import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required — auth and storage both depend on them.");
}

/**
 * Server-only Supabase client using the service_role key. This is what
 * actually owns authentication: password hashing/verification, session
 * issuance, and token validation all happen inside Supabase Auth, not in
 * our own code. Never expose this client or its key to the frontend.
 */
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** Verifies a Supabase-issued access token and returns the auth user id, or null if invalid/expired. */
export async function verifySupabaseToken(token: string): Promise<{ id: string; email: string } | null> {
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email! };
}
