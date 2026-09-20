import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthedRequest, requireAuth, loadRoles, requireRole } from "../lib/rbac";

export const clubsRouter = Router();

clubsRouter.get("/", async (_req, res) => {
  const clubs = await prisma.club.findMany({
    include: { department: true, _count: { select: { members: true, events: true } } },
  });
  res.json(clubs);
});

clubsRouter.get("/:slug", async (req, res) => {
  const club = await prisma.club.findUnique({
    where: { slug: req.params.slug },
    include: {
      department: true,
      members: { include: { user: true } },
      events: { where: { status: { in: ["PUBLISHED", "ONGOING", "COMPLETED"] } } },
    },
  });
  if (!club) return res.status(404).json({ error: "Club not found" });
  res.json(club);
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
