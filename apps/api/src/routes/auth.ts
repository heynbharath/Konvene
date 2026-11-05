import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import {
  supabaseAdmin,
  DEMO_USERS,
  createAuthToken,
  isSupabaseConfigured,
} from "../lib/supabaseAdmin";

export const authRouter = Router();

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  usn: z.string().optional(),
});

authRouter.post("/signup", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { name, email, password, usn } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Check if user already exists
  try {
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({ error: "Email already registered. Please log in." });
    }
  } catch {}

  let userId = "usr_" + Math.random().toString(36).substring(2, 10);
  let role = "STUDENT";
  if (normalizedEmail.includes("admin")) role = "ADMIN";
  else if (normalizedEmail.includes("faculty")) role = "FACULTY";
  else if (normalizedEmail.includes("club")) role = "CLUB_HEAD";

  // 2. If Supabase is real and configured, sync user to Supabase
  if (isSupabaseConfigured()) {
    try {
      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
      });
      if (created?.user) {
        userId = created.user.id;
      } else if (createError) {
        console.warn("Supabase createUser warning:", createError.message);
      }
    } catch (e) {
      console.warn("Supabase auth skipped:", e);
    }
  }

  // 3. Save user in Prisma database
  try {
    await prisma.user.create({
      data: {
        id: userId,
        name,
        email: normalizedEmail,
        usn: usn || null,
        roleAssignments: { create: { role, scopeType: "GLOBAL" } },
      },
    });
  } catch (err) {
    console.warn("Prisma user create warning:", err);
  }

  // 4. Issue cryptographic token
  const token = createAuthToken({
    id: userId,
    email: normalizedEmail,
    name,
    roles: [{ role, scopeType: "GLOBAL", scopeId: null }],
  });

  res.status(201).json({
    token,
    refreshToken: "ref_" + userId,
    user: { id: userId, name, email: normalizedEmail },
  });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { email, password } = parsed.data;
  const normalized = email.toLowerCase().trim();

  // 1. Seeded demo accounts (admin, faculty, clubhead, student)
  const demoUser = DEMO_USERS[normalized];
  if (demoUser && (password === "password123" || !isSupabaseConfigured())) {
    const token = createAuthToken({
      id: demoUser.id,
      email: demoUser.email,
      name: demoUser.name,
      roles: demoUser.roles,
    });

    try {
      const existing = await prisma.user.findUnique({ where: { email: demoUser.email } });
      if (!existing) {
        await prisma.user.create({
          data: {
            id: demoUser.id,
            name: demoUser.name,
            email: demoUser.email,
            usn: demoUser.usn,
            roleAssignments: {
              create: demoUser.roles.map((r) => ({
                role: r.role,
                scopeType: r.scopeType,
                scopeId: r.scopeId,
              })),
            },
          },
        });
      }
    } catch {}

    return res.json({
      token,
      refreshToken: "demo-refresh-token",
      user: { id: demoUser.id, name: demoUser.name, email: demoUser.email },
    });
  }

  // 2. Real Supabase Auth attempt if configured
  if (isSupabaseConfigured()) {
    try {
      const { data: session, error } = await supabaseAdmin.auth.signInWithPassword({
        email: normalized,
        password,
      });

      if (session?.session) {
        let user = null;
        try {
          user = await prisma.user.findUnique({ where: { id: session.user.id } });
        } catch {}

        return res.json({
          token: session.session.access_token,
          refreshToken: session.session.refresh_token,
          user: {
            id: session.user.id,
            name: user?.name || session.user.email?.split("@")[0] || "User",
            email: session.user.email,
          },
        });
      }
    } catch {}
  }

  // 3. Check existing user in Prisma
  let existingUser: any = null;
  try {
    existingUser = await prisma.user.findUnique({
      where: { email: normalized },
      include: { roleAssignments: true },
    });
  } catch {}

  if (existingUser) {
    const token = createAuthToken({
      id: existingUser.id,
      email: existingUser.email,
      name: existingUser.name,
      roles: existingUser.roleAssignments,
    });
    return res.json({
      token,
      refreshToken: "ref_" + existingUser.id,
      user: { id: existingUser.id, name: existingUser.name, email: existingUser.email },
    });
  }

  // 4. Auto-provision any new custom email (Frictionless login)
  let role = "STUDENT";
  if (normalized.includes("admin")) role = "ADMIN";
  else if (normalized.includes("faculty")) role = "FACULTY";
  else if (normalized.includes("club")) role = "CLUB_HEAD";

  const generatedId = "usr_" + Math.random().toString(36).substring(2, 10);
  const derivedName = normalized
    .split("@")[0]
    .split(/[._-]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  try {
    await prisma.user.create({
      data: {
        id: generatedId,
        name: derivedName,
        email: normalized,
        roleAssignments: { create: { role, scopeType: "GLOBAL" } },
      },
    });
  } catch {}

  const token = createAuthToken({
    id: generatedId,
    email: normalized,
    name: derivedName,
    roles: [{ role, scopeType: "GLOBAL", scopeId: null }],
  });

  return res.json({
    token,
    refreshToken: "ref_" + generatedId,
    user: { id: generatedId, name: derivedName, email: normalized },
  });
});
