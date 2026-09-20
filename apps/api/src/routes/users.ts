import { Router } from "express";
import { prisma } from "../lib/prisma";
import { AuthedRequest, requireAuth, loadRoles } from "../lib/rbac";

export const usersRouter = Router();

usersRouter.get("/me", requireAuth, loadRoles, async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    include: {
      studentProfile: { include: { section: { include: { branch: true } } } },
      clubMemberships: { include: { club: true } },
    },
  });
  if (!user) return res.status(404).json({ error: "Not found" });
  const { passwordHash, ...safe } = user;
  res.json({ ...safe, roles: req.roles });
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
