import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthedRequest, requireAuth, loadRoles, requireRole, hasScopedRole } from "../lib/rbac";
import { verifyAccessToken } from "../lib/jwt";

export const clubsRouter = Router();

clubsRouter.get("/", async (_req, res) => {
  const clubs = await prisma.club.findMany({
    include: { department: true, _count: { select: { members: true, events: true } } },
  });
  res.json(clubs);
});

/**
 * Public visitors only see PUBLISHED/ONGOING/COMPLETED events. If the caller
 * is authenticated and holds CLUB_HEAD/FACULTY_COORDINATOR for this club,
 * DRAFT/PENDING_APPROVAL/REJECTED events are included too, since their
 * management dashboards need to see and act on those.
 */
clubsRouter.get("/:slug", async (req: AuthedRequest, res) => {
  const club = await prisma.club.findUnique({ where: { slug: req.params.slug } });
  if (!club) return res.status(404).json({ error: "Club not found" });

  let canSeeAll = false;
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      const { userId } = verifyAccessToken(header.slice("Bearer ".length));
      const roles = await prisma.userRoleAssignment.findMany({ where: { userId } });
      canSeeAll =
        hasScopedRole(roles, "CLUB_HEAD", "CLUB", club.id) ||
        hasScopedRole(roles, "FACULTY_COORDINATOR", "CLUB", club.id);
    } catch {
      // invalid/expired token on a public route just falls back to public visibility
    }
  }

  const full = await prisma.club.findUnique({
    where: { id: club.id },
    include: {
      department: true,
      members: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
      events: canSeeAll ? true : { where: { status: { in: ["PUBLISHED", "ONGOING", "COMPLETED"] } } },
    },
  });
  res.json(full);
});

const createClubSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  departmentId: z.string(),
  facultyAdvisorName: z.string().optional(),
  headUserId: z.string(),
});

clubsRouter.post("/", requireAuth, loadRoles, requireRole("ADMIN"), async (req, res) => {
  const parsed = createClubSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { headUserId, ...data } = parsed.data;

  const club = await prisma.club.create({
    data: {
      ...data,
      members: { create: { userId: headUserId, role: "CLUB_HEAD" } },
    },
  });

  await prisma.userRoleAssignment.create({
    data: { userId: headUserId, role: "CLUB_HEAD", scopeType: "CLUB", scopeId: club.id },
  });

  res.status(201).json(club);
});
