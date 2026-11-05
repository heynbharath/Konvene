import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const AUTH_SECRET = process.env.QR_SIGNING_SECRET || "konvene-demo-auth-secret-key-32chars";
const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY || "";
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

// Core Seed Data for Serverless Vercel Deployment
const DEMO_USERS: Record<string, { id: string; name: string; email: string; roles: any[]; usn?: string }> = {
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

const EVENTS_CATALOG = [
  {
    id: "evt-hacknight-2026",
    title: "HackNight 2026",
    slug: "hacknight-2026",
    category: "HACKATHON",
    venue: "Main Auditorium & Labs",
    startAt: "2026-11-15T18:00:00.000Z",
    endAt: "2026-11-16T08:00:00.000Z",
    capacity: 250,
    club: { name: "Google Developer Student Club (GDSC)", slug: "gdsc" },
    description: "14 hours of pure building, pizza, mentors, and cash prizes for Web3, AI, and Systems.",
    requiresFacultyAttendance: true,
    linkedSubject: { name: "Compiler Design", code: "CS301", facultyName: "Dr. Rao" },
    ticketTypes: [{ id: "tt-hn-free", name: "Hacker Pass (Free)", capacity: 200 }],
    _count: { registrations: 48 },
  },
  {
    id: "evt-ai-agents-workshop",
    title: "Autonomous AI Agents Workshop",
    slug: "autonomous-ai-agents",
    category: "WORKSHOP",
    venue: "Turing Lab, CS Block (3rd Floor)",
    startAt: "2026-11-10T14:00:00.000Z",
    endAt: "2026-11-10T17:30:00.000Z",
    capacity: 80,
    club: { name: "ACM Student Chapter", slug: "acm" },
    description: "Hands-on masterclass building LLM tool-calling agents, MCP servers, and local RAG workflows.",
    requiresFacultyAttendance: true,
    linkedSubject: { name: "Compiler Design", code: "CS301", facultyName: "Dr. Rao" },
    ticketTypes: [{ id: "tt-ai-free", name: "Standard Attendee", capacity: 80 }],
    _count: { registrations: 32 },
  },
  {
    id: "evt-battle-of-bands",
    title: "Battle of the Bands & DJ Night",
    slug: "battle-of-bands-2026",
    category: "MUSIC",
    venue: "Open Air Amphitheatre",
    startAt: "2026-11-20T17:30:00.000Z",
    endAt: "2026-11-20T22:00:00.000Z",
    capacity: 600,
    club: { name: "Campus Cultural Forum", slug: "cultural-forum" },
    description: "Annual intra-college music showcase featuring 12 rock and acoustic bands followed by DJ set.",
    requiresFacultyAttendance: false,
    ticketTypes: [{ id: "tt-fest-free", name: "General Admission", capacity: 500 }],
    _count: { registrations: 120 },
  },
  {
    id: "evt-system-design-talk",
    title: "FAANG System Design & DSA Blueprint",
    slug: "system-design-masterclass",
    category: "TALK",
    venue: "Seminar Hall 1",
    startAt: "2026-11-12T11:00:00.000Z",
    endAt: "2026-11-12T13:00:00.000Z",
    capacity: 150,
    club: { name: "Placement & Training Cell", slug: "placement-cell" },
    description: "Alumni panel breakdown of distributed system interview loops, LLD, and mock whiteboard rounds.",
    requiresFacultyAttendance: true,
    linkedSubject: { name: "Compiler Design", code: "CS301", facultyName: "Dr. Rao" },
    ticketTypes: [{ id: "tt-talk-free", name: "Student Free Pass", capacity: 150 }],
    _count: { registrations: 89 },
  },
];

// Token Helpers
function signToken(payload: object): string {
  const json = JSON.stringify(payload);
  const data = Buffer.from(json).toString("base64url");
  const sig = crypto.createHmac("sha256", AUTH_SECRET).update(data).digest("base64url");
  return `kvn.${data}.${sig}`;
}

function verifyToken(token: string): any | null {
  if (token.startsWith("demo-token.")) {
    const parts = token.split(".");
    if (parts.length === 3) {
      try {
        const email = Buffer.from(parts[1], "base64url").toString("utf-8");
        const demo = DEMO_USERS[email.toLowerCase()];
        if (demo) return demo;
      } catch {}
    }
  }

  if (!token.startsWith("kvn.")) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [, data, sig] = parts;
  const expected = crypto.createHmac("sha256", AUTH_SECRET).update(data).digest("base64url");
  if (sig !== expected) return null;

  try {
    return JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));
  } catch {
    return null;
  }
}

function signTicketToken(ticketId: string): string {
  const sig = crypto.createHmac("sha256", AUTH_SECRET).update(ticketId).digest("base64url");
  return `${ticketId}.${sig}`;
}

// Next.js Route Dispatcher
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const path = slug.join("/");
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const authUser = token ? verifyToken(token) : null;

  // 1. /api/users/me
  if (path === "users/me") {
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({
      id: authUser.id,
      name: authUser.name || authUser.email?.split("@")[0] || "User",
      email: authUser.email,
      usn: authUser.usn || null,
      avatarUrl: null,
      roles: authUser.roles || [
        {
          role: authUser.email?.includes("admin") ? "ADMIN" : "STUDENT",
          scopeType: "GLOBAL",
          scopeId: null,
        },
      ],
      clubMemberships: authUser.email === "clubhead@konvene.dev"
        ? [{ club: { id: "club-gdsc", slug: "gdsc", name: "Google Developer Student Club" }, role: "CLUB_HEAD" }]
        : [],
    });
  }

  // 2. /api/users/me/tickets
  if (path === "users/me/tickets") {
    const mockTicketId = "tkt-" + (authUser?.id || "demo").slice(0, 8);
    return NextResponse.json([
      {
        id: mockTicketId,
        ticket: {
          id: mockTicketId,
          qrToken: signTicketToken(mockTicketId),
          status: "ISSUED",
        },
        event: EVENTS_CATALOG[0],
        ticketType: { name: "General Free Pass" },
      },
    ]);
  }

  // 3. /api/events
  if (path === "events") {
    const url = new URL(req.url);
    const category = url.searchParams.get("category");
    const query = url.searchParams.get("q");

    let filtered = EVENTS_CATALOG;
    if (category) {
      filtered = filtered.filter((e) => e.category.toLowerCase() === category.toLowerCase());
    }
    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter((e) => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q));
    }
    return NextResponse.json(filtered);
  }

  // 4. /api/events/:slug
  if (path.startsWith("events/") && slug.length === 2) {
    const eventSlug = slug[1];
    const event = EVENTS_CATALOG.find((e) => e.slug === eventSlug || e.id === eventSlug) || EVENTS_CATALOG[0];
    return NextResponse.json({
      ...event,
      form: { schemaJson: "[]" },
    });
  }

  // 5. /api/clubs
  if (path === "clubs") {
    return NextResponse.json([
      { id: "club-gdsc", name: "Google Developer Student Club", slug: "gdsc", facultyAdvisor: "Dr. Rao" },
      { id: "club-acm", name: "ACM Student Chapter", slug: "acm", facultyAdvisor: "Prof. Arvind" },
      { id: "club-cultural", name: "Campus Cultural Forum", slug: "cultural-forum", facultyAdvisor: "Dr. Shalini" },
      { id: "club-placement", name: "Placement & Training Cell", slug: "placement-cell", facultyAdvisor: "Prof. Suresh" },
    ]);
  }

  if (path.startsWith("clubs/") && slug.length === 2) {
    const clubSlug = slug[1];
    return NextResponse.json({
      id: "club-" + clubSlug,
      name: clubSlug.toUpperCase() + " Club",
      slug: clubSlug,
      facultyAdvisor: "Dr. Rao",
      events: EVENTS_CATALOG,
    });
  }

  // 6. /api/stats
  if (path === "stats") {
    return NextResponse.json({
      clubs: 12,
      publishedEvents: 8,
      registrations: 248,
      certificates: 185,
    });
  }

  // 7. /api/departments & /api/subjects
  if (path === "departments") {
    return NextResponse.json([
      { id: "dept-eng", name: "School of Engineering", code: "ENG" },
      { id: "dept-mgmt", name: "School of Management", code: "MGMT" },
    ]);
  }

  if (path === "subjects") {
    return NextResponse.json([
      { id: "subj-cs301", name: "Compiler Design", code: "CS301", semester: 5 },
      { id: "subj-cs302", name: "Operating Systems", code: "CS302", semester: 5 },
    ]);
  }

  // 8. /api/ai/status
  if (path === "ai/status") {
    return NextResponse.json({
      status: "online",
      engine: "Groq Fast-Inference",
      model: GROQ_MODEL,
      speed: "~800-1000 tokens/sec",
    });
  }

  return NextResponse.json({ ok: true, path });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const path = slug.join("/");
  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  // 1. /api/auth/login
  if (path === "auth/login") {
    const { email, password } = body;
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });
    const normalized = String(email).toLowerCase().trim();

    // Check demo accounts
    const demo = DEMO_USERS[normalized];
    if (demo) {
      const token = signToken({
        id: demo.id,
        email: demo.email,
        name: demo.name,
        roles: demo.roles,
        usn: demo.usn,
      });
      return NextResponse.json({
        token,
        refreshToken: "ref_" + demo.id,
        user: { id: demo.id, name: demo.name, email: demo.email },
      });
    }

    // Auto-provision any custom email
    const isAdm = normalized.includes("admin");
    const isFaculty = normalized.includes("faculty");
    const isClub = normalized.includes("club");
    const role = isAdm ? "ADMIN" : isFaculty ? "FACULTY" : isClub ? "CLUB_HEAD" : "STUDENT";

    const derivedName = normalized
      .split("@")[0]
      .split(/[._-]/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    const userId = "usr_" + Math.random().toString(36).substring(2, 10);
    const roles = [{ role, scopeType: "GLOBAL", scopeId: null }];

    const token = signToken({
      id: userId,
      email: normalized,
      name: derivedName,
      roles,
    });

    return NextResponse.json({
      token,
      refreshToken: "ref_" + userId,
      user: { id: userId, name: derivedName, email: normalized },
    });
  }

  // 2. /api/auth/signup
  if (path === "auth/signup") {
    const { name, email, usn } = body;
    if (!email || !name) return NextResponse.json({ error: "Name and email are required" }, { status: 400 });

    const normalized = String(email).toLowerCase().trim();
    const isAdm = normalized.includes("admin");
    const role = isAdm ? "ADMIN" : "STUDENT";
    const userId = "usr_" + Math.random().toString(36).substring(2, 10);
    const roles = [{ role, scopeType: "GLOBAL", scopeId: null }];

    const token = signToken({
      id: userId,
      email: normalized,
      name,
      usn,
      roles,
    });

    return NextResponse.json(
      {
        token,
        refreshToken: "ref_" + userId,
        user: { id: userId, name, email: normalized },
      },
      { status: 201 }
    );
  }

  // 3. /api/events/:id/register
  if (path.includes("/register")) {
    const ticketId = "tkt-" + Math.random().toString(36).substring(2, 9);
    const qrToken = signTicketToken(ticketId);
    return NextResponse.json({
      registration: { id: "reg-" + ticketId, status: "CONFIRMED" },
      ticket: { id: ticketId, qrToken, status: "ISSUED" },
    });
  }

  // 4. /api/ai/action
  if (path === "ai/action") {
    const { action, payload } = body;
    if (action === "rsvp") {
      const ticketId = "tkt-" + Math.random().toString(36).substring(2, 9);
      const qrToken = signTicketToken(ticketId);
      return NextResponse.json({
        ok: true,
        ticket: {
          id: ticketId,
          ticketId: ticketId.toUpperCase(),
          qrToken,
          eventTitle: payload?.eventTitle || "HackNight 2026",
          status: "ISSUED",
          attendeeName: payload?.attendeeName || "Student Attendee",
          venue: payload?.venue || "Main Auditorium",
          startAt: payload?.startAt || new Date().toISOString(),
        },
      });
    }
    return NextResponse.json({ ok: true, message: "Action executed" });
  }

  // 5. /api/ai/chat
  if (path === "ai/chat") {
    const { messages, user } = body;
    const userPrompt = messages?.[messages.length - 1]?.content || "";

    const lower = userPrompt.toLowerCase();
    const actionCards: any[] = [];
    const quickSuggestions: string[] = [];
    let assistantMessage = "";

    // Intelligent campus assistant responder (fallback-safe for Vercel)
    if (lower.includes("hackathon") || lower.includes("workshop") || lower.includes("event")) {
      actionCards.push({
        type: "EVENT_LIST",
        title: "Live Campus Events",
        events: EVENTS_CATALOG.slice(0, 3).map((e) => ({
          ...e,
          clubName: e.club.name,
          clubSlug: e.club.slug,
          linkedSubject: e.linkedSubject?.name,
        })),
      });
      assistantMessage = `Here are the top campus events happening this week! **HackNight 2026** and **Autonomous AI Agents Workshop** both grant attendance credit for CS301 Compiler Design. Click **⚡ 1-Click Free RSVP** below to issue your pass immediately!`;
      quickSuggestions.push("🎟️ Show My Tickets", "🎓 Check CS301 Attendance", "✨ Draft New Event");
    } else if (lower.includes("ticket") || lower.includes("pass") || lower.includes("qr")) {
      const ticketId = "TKT-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const qrToken = signTicketToken(ticketId.toLowerCase());
      actionCards.push({
        type: "TICKET_CARD",
        title: "Your Verified Ticket Pass",
        tickets: [
          {
            id: ticketId.toLowerCase(),
            ticketId,
            qrToken,
            eventTitle: "HackNight 2026",
            venue: "Main Auditorium & Labs",
            startAt: "2026-11-15T18:00:00.000Z",
            status: "ISSUED",
            attendeeName: user?.name || "Student Attendee (ENG24CT0058)",
          },
        ],
      });
      assistantMessage = `Here is your verified HMAC-SHA256 pass for **HackNight 2026**! Present this dynamic QR code at the entrance for instant atomic check-in.`;
      quickSuggestions.push("🔥 Upcoming Events", "🎓 Attendance Credit", "✨ Draft an Event");
    } else if (lower.includes("attendance") || lower.includes("cs301") || lower.includes("credit") || lower.includes("rao")) {
      const attendanceInfo = {
        subjectCode: "CS301",
        subjectName: "Compiler Design",
        facultyName: "Dr. Rao",
        department: "School of Engineering (Computer Science)",
        section: "Section A, 5th Semester",
        policy:
          "Checked-in attendance at accredited technical events (e.g., HackNight 2026, AI Agents Workshop) automatically routes to Dr. Rao's faculty dashboard for 1-click lecture credit approval.",
        status: "ELIGIBLE_FOR_CREDIT",
        eligibleEvents: ["HackNight 2026", "Autonomous AI Agents Workshop", "FAANG System Design & DSA Blueprint"],
      };
      actionCards.push({
        type: "ATTENDANCE_CARD",
        title: "Academic Attendance Credit",
        data: attendanceInfo,
      });
      assistantMessage = `Yes! Attending **HackNight 2026** or the **Autonomous AI Agents Workshop** is accredited for **CS301 Compiler Design**. Upon gate scan, your credit flows directly to **Dr. Rao** for one-click verification.`;
      quickSuggestions.push("🎟️ RSVP to HackNight", "🔥 More Events", "✨ Draft Workshop");
    } else if (lower.includes("draft") || lower.includes("create")) {
      const draft = {
        id: "draft-" + Math.random().toString(36).substring(2, 8),
        title: "Web3 & Zero-Knowledge Proofs Masterclass",
        clubSlug: "gdsc",
        category: "WORKSHOP",
        venue: "Seminar Hall 2",
        capacity: 120,
        description: "Hands-on workshop introducing cryptographic circuits, zk-SNARKs, and smart contract verification.",
        startAt: new Date(Date.now() + 86400000 * 5).toISOString(),
        endAt: new Date(Date.now() + 86400000 * 5 + 3600000 * 3).toISOString(),
        requiresFacultyAttendance: true,
        linkedSubjectCode: "CS301",
        status: "DRAFT_READY",
      };
      actionCards.push({
        type: "EVENT_DRAFT_CARD",
        title: "⚡ Event Blueprint Drafted",
        draft,
      });
      assistantMessage = `I've drafted the blueprint for your upcoming club event with 120 seats and CS301 faculty attendance enabled. Review the card below and tap **🚀 Submit Draft to Konvene** to send it for coordinator approval!`;
      quickSuggestions.push("🚀 Submit Draft", "🔥 Upcoming Events", "🎟️ My Tickets");
    } else {
      assistantMessage = `⚡ **Konvene Scout is online!** I can search upcoming hackathons, issue signed HMAC-SHA256 passes with live QR codes, resolve CS301 attendance credit with Dr. Rao, or draft club events. How can I assist you right now?`;
      quickSuggestions.push("🔥 Upcoming Hackathons", "🎟️ Show My Tickets", "🎓 Check CS301 Attendance", "✨ Draft Event for GDSC");
    }

    return NextResponse.json({
      message: assistantMessage,
      actionCards,
      quickSuggestions,
    });
  }

  return NextResponse.json({ ok: true, path });
}
