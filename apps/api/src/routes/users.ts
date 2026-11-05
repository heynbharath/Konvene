import { Router } from "express";
import { prisma } from "../lib/prisma";
import { AuthedRequest, requireAuth, loadRoles } from "../lib/rbac";
import { DEMO_USERS } from "../lib/supabaseAdmin";

export const usersRouter = Router();

const profileInclude = {
  studentProfile: { include: { section: { include: { branch: true } } } },
  clubMemberships: { include: { club: true } },
} as const;

usersRouter.get("/me", requireAuth, loadRoles, async (req: AuthedRequest, res) => {
  let user: any = null;
  try {
    user = await prisma.user.findUnique({ where: { id: req.userId }, include: profileInclude });
  } catch {}

  if (!user) {
    const demo = Object.values(DEMO_USERS).find(
      (u) => u.id === req.userId || u.email === req.authUser?.email
    );
    if (demo) {
      return res.json({
        id: demo.id,
        name: demo.name,
        email: demo.email,
        usn: demo.usn || null,
        avatarUrl: null,
        roles: req.roles && req.roles.length > 0 ? req.roles : demo.roles,
        clubMemberships:
          demo.email === "clubhead@konvene.dev"
            ? [
                {
                  club: {
                    id: "club-gdsc",
                    slug: "gdsc",
                    name: "Google Developer Student Club",
                  },
                  role: "CLUB_HEAD",
                },
              ]
            : [],
      });
    }

    // Any custom logged-in user
    return res.json({
      id: req.userId,
      name: req.authUser?.name || req.authUser?.email?.split("@")[0] || "User",
      email: req.authUser?.email,
      usn: null,
      avatarUrl: req.authUser?.avatarUrl || null,
      roles: req.roles,
      clubMemberships: [],
    });
  }

  res.json({
    ...user,
    roles: req.roles,
  });
});

usersRouter.get("/me/tickets", requireAuth, async (req: AuthedRequest, res) => {
  const registrations = await prisma.registration.findMany({
    where: { userId: req.userId },
    include: { event: true, ticketType: true, ticket: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(registrations);
});

usersRouter.get("/me/certificates", requireAuth, async (req: AuthedRequest, res) => {
  const certs = await prisma.certificate.findMany({
    where: { userId: req.userId },
    include: { event: true },
    orderBy: { issuedAt: "desc" },
  });
  res.json(certs);
});
