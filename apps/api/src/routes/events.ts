import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthedRequest, requireAuth, loadRoles, hasScopedRole } from "../lib/rbac";

export const eventsRouter = Router();

eventsRouter.get("/", async (req, res) => {
  const { category, clubSlug, from, to, q } = req.query as Record<string, string | undefined>;

  const events = await prisma.event.findMany({
    where: {
      status: "PUBLISHED",
      ...(category ? { category: category as any } : {}),
      ...(clubSlug ? { club: { slug: clubSlug } } : {}),
      ...(from || to
        ? { startAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
        : {}),
      ...(q ? { title: { contains: q } } : {}),
    },
    include: { club: true, ticketTypes: true, _count: { select: { registrations: true } } },
    orderBy: { startAt: "asc" },
  });
  res.json(events);
});

eventsRouter.get("/:slug", async (req, res) => {
  const event = await prisma.event.findUnique({
    where: { slug: req.params.slug },
    include: {
      club: true,
      ticketTypes: true,
      form: true,
      linkedSubject: true,
      _count: { select: { registrations: true } },
    },
  });
  if (!event) return res.status(404).json({ error: "Event not found" });
  res.json(event);
});

const createEventSchema = z.object({
  clubId: z.string(),
  title: z.string().min(3),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
  description: z.string().min(10),
  category: z.enum([
    "WORKSHOP", "HACKATHON", "CONFERENCE", "TALK", "SEMINAR", "SPORTS", "CULTURAL",
    "TECHNICAL", "MUSIC", "DANCE", "FEST", "BOOTCAMP", "PLACEMENT", "COMPETITION",
  ]),
  venue: z.string().min(2),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  capacity: z.number().int().positive(),
  bannerUrl: z.string().url().optional(),
  requiresFacultyAttendance: z.boolean().optional(),
  linkedSubjectId: z.string().optional(),
  ticketTypes: z
    .array(z.object({ name: z.string(), price: z.number().int().min(0), capacity: z.number().int().positive() }))
    .min(1),
  formFields: z
    .array(
      z.object({
        key: z.string(),
        label: z.string(),
        type: z.enum(["text", "textarea", "select", "checkbox", "file"]),
        options: z.array(z.string()).optional(),
        required: z.boolean().optional(),
      })
    )
    .default([]),
});

eventsRouter.post("/", requireAuth, loadRoles, async (req: AuthedRequest, res) => {
  const parsed = createEventSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { clubId, ticketTypes, formFields, ...data } = parsed.data;

  if (!hasScopedRole(req.roles, "CLUB_HEAD", "CLUB", clubId)) {
    return res.status(403).json({ error: "Only the club's head/admin can create events for this club" });
  }

  const event = await prisma.event.create({
    data: {
      ...data,
      clubId,
      startAt: new Date(data.startAt),
      endAt: new Date(data.endAt),
      status: "DRAFT",
      ticketTypes: { create: ticketTypes },
      form: { create: { schemaJson: JSON.stringify(formFields) } },
    },
    include: { ticketTypes: true, form: true },
  });

  res.status(201).json(event);
});

eventsRouter.post("/:id/publish", requireAuth, loadRoles, async (req: AuthedRequest, res) => {
  const event = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!event) return res.status(404).json({ error: "Event not found" });
  if (!hasScopedRole(req.roles, "CLUB_HEAD", "CLUB", event.clubId)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const updated = await prisma.event.update({ where: { id: event.id }, data: { status: "PUBLISHED" } });
  res.json(updated);
});

eventsRouter.get("/:id/registrations", requireAuth, loadRoles, async (req: AuthedRequest, res) => {
  const event = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!event) return res.status(404).json({ error: "Event not found" });
  if (!hasScopedRole(req.roles, "CLUB_HEAD", "CLUB", event.clubId)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const registrations = await prisma.registration.findMany({
    where: { eventId: event.id },
    include: { user: true, ticketType: true, ticket: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(registrations);
});

eventsRouter.get("/:id/checkin-stats", requireAuth, loadRoles, async (req: AuthedRequest, res) => {
  const event = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!event) return res.status(404).json({ error: "Event not found" });
  if (!hasScopedRole(req.roles, "CLUB_HEAD", "CLUB", event.clubId)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const [registered, checkedIn] = await Promise.all([
    prisma.registration.count({ where: { eventId: event.id, status: "CONFIRMED" } }),
    prisma.ticket.count({
      where: { registration: { eventId: event.id }, status: "CHECKED_IN" },
    }),
  ]);
  res.json({ capacity: event.capacity, registered, checkedIn, noShow: registered - checkedIn });
});
