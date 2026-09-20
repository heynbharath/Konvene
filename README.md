# Konvene

**One platform for every event happening across your campus.**

Konvene is the operating system for campus communities — clubs, departments, and student chapters run every event (hackathons, workshops, fests, conferences) through one connected platform instead of WhatsApp + Google Forms + Excel + Razorpay links + a QR generator + Gmail + a paper attendance sheet.

Full product spec: [`CampusHub_PRD.md`](./CampusHub_PRD.md) (the PRD predates the "Konvene" name — treat every "CampusHub" reference in it as this project).

## What's real in this repo right now (Phase 0 MVP)

Nothing here is mocked. Specifically:

- **Signed QR tickets** — each ticket's QR encodes an HMAC-SHA256-signed token (`apps/api/src/lib/qr.ts`). Forged tokens are rejected before the DB is even queried.
- **Atomic check-in** — the check-in state transition (`apps/api/src/routes/checkin.ts`) uses a conditional `UPDATE ... WHERE status = 'ISSUED'`, so two volunteers scanning the same ticket at the same instant cannot both succeed. Verified under a real concurrent-duplicate test (see below).
- **Faculty-verified attendance tied to real academic structure** — `SubjectFacultyAssignment` links a subject + section to the actual faculty teaching it. When a student checks in to an event tagged with a subject, the system resolves *that specific faculty member* (not a generic organizer) and routes the attendance credit to them for approval (`apps/api/src/routes/faculty.ts`).
- **Real PDF certificates** — generated server-side with PDFKit, each with a unique certificate ID and an embedded QR that resolves to a public, no-login verification page.
- **Working registration → waitlist → auto-promotion** flow.

This is genuinely runnable end-to-end locally — see Quickstart.

## Architecture

```
apps/
  api/    Express + TypeScript + Prisma (SQLite locally, swap to Postgres for prod)
  web/    Next.js 15 (App Router) + React 19 + Tailwind
```

Why SQLite for dev: zero external setup — clone, install, migrate, seed, run. The schema uses `String` fields (with documented valid values) instead of native Prisma enums, specifically because SQLite doesn't support them; promoting to native Postgres enums is a one-line datasource change plus enum blocks, see the comment at the top of `apps/api/prisma/schema.prisma`.

## Quickstart

```bash
# 1. install everything
npm install

# 2. set up the API
cd apps/api
cp .env.example .env
npx prisma migrate dev --name init   # creates dev.db and seeds demo data
npm run dev                           # http://localhost:4000

# 3. in a second terminal, set up the web app
cd apps/web
cp .env.example .env.local 2>/dev/null || echo "NEXT_PUBLIC_API_URL=http://localhost:4000" > .env.local
npm run dev                           # http://localhost:3000
```

Demo accounts (seeded, password `password123` for all):

| Email | Role |
|---|---|
| `admin@konvene.dev` | Admin |
| `faculty@konvene.dev` | Faculty (CS301 — Compiler Design) |
| `clubhead@konvene.dev` | Club Head (GDSC) |
| `student1@konvene.dev` / `student2@konvene.dev` | Students |

A seeded event, **Compiler Hackfest 2026**, is already published and linked to CS301 so you can walk the full loop immediately:

1. Log in as a student → open the event → register → get a QR ticket.
2. Log in as the club head → `/club/gdsc/dashboard` → start the scanner (or use the manual check-in fallback) → scan the student's QR.
3. Log in as faculty → `/faculty` → the checked-in student appears in *Pending Attendance* → approve.
4. As club head, call `POST /events/:id/issue-certificates` (a dashboard button for this is Phase 1) → the student's certificate appears under **My Tickets → Certificates**, and its QR resolves to a public `/verify/:certId` page.

## Roadmap

See PRD §16 for the full phased plan. Snapshot:

- **Phase 0 (done)** — auth, clubs, events, dynamic registration forms, free ticketing, waitlist, signed QR check-in, faculty-verified attendance, PDF certificates, club-head and faculty dashboards.
- **Phase 1** — Razorpay payments, event approval workflow (Faculty Coordinator gate), email notifications (Resend), coupons, admin dashboard.
- **Phase 2** — community/Q&A threads, .ics calendar export, rule-based duplicate/fraud check-in detection, AI feedback summarization, audit log UI.
- **Phase 3** — full AI suite (poster/email/schedule generation, AI event assistant), real-time chat, ERP sync, wallet passes, native mobile, multi-university tenancy.

## Security notes

- QR signing secret and JWT secret are separate (`.env` — never commit real values; `.env.example` has placeholders).
- Payment webhooks (Phase 1) must verify the provider's signature server-side before marking a ticket `PAID` — never trust a client-side "success" callback.
- File uploads (Phase 1+) must be validated by content, not just extension.
