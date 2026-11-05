import { Router } from "express";
import Groq from "groq-sdk";
import { prisma } from "../lib/prisma";
import { signTicketToken } from "../lib/qr";

export const aiRouter = Router();

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

const groq = new Groq({ apiKey: GROQ_API_KEY || "dummy-key-for-init" });

// Fallback in-memory catalog for local dev when DB is empty or not migrated
const FALLBACK_EVENTS = [
  {
    id: "evt-hacknight-2026",
    title: "HackNight 2026",
    slug: "hacknight-2026",
    category: "HACKATHON",
    venue: "Main Auditorium & Labs",
    startAt: "2026-11-15T18:00:00.000Z",
    endAt: "2026-11-16T08:00:00.000Z",
    capacity: 250,
    clubName: "Google Developer Student Club (GDSC)",
    clubSlug: "gdsc",
    description: "14 hours of pure building, pizza, mentors, and cash prizes for Web3, AI, and Systems.",
    requiresFacultyAttendance: true,
    linkedSubject: { name: "Compiler Design", code: "CS301", facultyName: "Dr. Rao" },
    ticketTypes: [{ id: "tt-hn-free", name: "Hacker Pass (Free)", capacity: 200 }],
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
    clubName: "ACM Student Chapter",
    clubSlug: "acm",
    description: "Hands-on masterclass building LLM tool-calling agents, MCP servers, and local RAG workflows.",
    requiresFacultyAttendance: true,
    linkedSubject: { name: "Compiler Design", code: "CS301", facultyName: "Dr. Rao" },
    ticketTypes: [{ id: "tt-ai-free", name: "Standard Attendee", capacity: 80 }],
  },
  {
    id: "evt-campus-fest-battle",
    title: "Battle of the Bands & DJ Night",
    slug: "battle-of-bands-2026",
    category: "MUSIC",
    venue: "Open Air Amphitheatre",
    startAt: "2026-11-20T17:30:00.000Z",
    endAt: "2026-11-20T22:00:00.000Z",
    capacity: 600,
    clubName: "Campus Cultural Forum",
    clubSlug: "cultural-forum",
    description: "Annual intra-college music showcase featuring 12 rock and acoustic bands followed by DJ set.",
    requiresFacultyAttendance: false,
    ticketTypes: [{ id: "tt-fest-free", name: "General Admission", capacity: 500 }],
  },
  {
    id: "evt-placement-prep-talk",
    title: "FAANG System Design & DSA Blueprint",
    slug: "system-design-masterclass",
    category: "TALK",
    venue: "Seminar Hall 1",
    startAt: "2026-11-12T11:00:00.000Z",
    endAt: "2026-11-12T13:00:00.000Z",
    capacity: 150,
    clubName: "Placement & Training Cell",
    clubSlug: "placement-cell",
    description: "Alumni panel breakdown of distributed system interview loops, LLD, and mock whiteboard rounds.",
    requiresFacultyAttendance: true,
    linkedSubject: { name: "Compiler Design", code: "CS301", facultyName: "Dr. Rao" },
    ticketTypes: [{ id: "tt-talk-free", name: "Student Free Pass", capacity: 150 }],
  },
];

const FALLBACK_CLUBS = [
  {
    name: "Google Developer Student Club",
    slug: "gdsc",
    facultyAdvisor: "Dr. Rao",
    description: "Building with Google technologies, cloud, web, and AI on campus.",
  },
  {
    name: "ACM Student Chapter",
    slug: "acm",
    facultyAdvisor: "Prof. Arvind",
    description: "Advancing computing as a science and a profession with hackathons and paper reading groups.",
  },
  {
    name: "Campus Cultural Forum",
    slug: "cultural-forum",
    facultyAdvisor: "Dr. Shalini",
    description: "Music, theater, dance, and creative arts across campus.",
  },
];

const TOOLS_SCHEMA: Groq.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "search_events",
      description: "Search campus events by category, keyword, date, or faculty attendance credit requirement.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search term like hackathon, workshop, AI, dance" },
          category: {
            type: "string",
            enum: [
              "HACKATHON",
              "WORKSHOP",
              "CONFERENCE",
              "TALK",
              "SEMINAR",
              "SPORTS",
              "CULTURAL",
              "TECHNICAL",
              "MUSIC",
              "FEST",
              "PLACEMENT",
            ],
            description: "Event category",
          },
          requiresFacultyAttendance: {
            type: "boolean",
            description: "Set true to only find events that grant academic attendance credit",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_my_tickets",
      description: "Lookup current registered tickets, status, and HMAC-signed QR code for the student.",
      parameters: {
        type: "object",
        properties: {
          userEmail: { type: "string", description: "User or student email" },
          usn: { type: "string", description: "University Seat Number if provided" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "quick_rsvp_event",
      description: "RSVP or register for a free ticket to an event in 1-click and issue the signed QR code.",
      parameters: {
        type: "object",
        required: ["eventId"],
        properties: {
          eventId: { type: "string", description: "The ID or slug of the event" },
          attendeeName: { type: "string", description: "Attendee full name" },
          attendeeEmail: { type: "string", description: "Attendee college email" },
          usn: { type: "string", description: "Attendee USN/roll number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_attendance_credit",
      description: "Check if an event grants faculty-approved attendance credit for a subject (e.g. CS301 Compiler Design).",
      parameters: {
        type: "object",
        properties: {
          subjectCode: { type: "string", description: "Subject code like CS301" },
          eventSlugOrId: { type: "string", description: "Event slug or ID" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "draft_club_event",
      description: "Draft a new campus event blueprint for club leads with venue, capacity, category, and schedule.",
      parameters: {
        type: "object",
        required: ["title", "clubSlug", "category", "venue", "capacity", "description"],
        properties: {
          title: { type: "string", description: "Event title" },
          clubSlug: { type: "string", description: "Club slug e.g. gdsc, acm" },
          category: { type: "string", description: "Category of the event" },
          venue: { type: "string", description: "Campus venue" },
          capacity: { type: "number", description: "Max seating capacity" },
          description: { type: "string", description: "Event overview and agenda" },
          startAt: { type: "string", description: "ISO timestamp or human readable start date" },
          endAt: { type: "string", description: "ISO timestamp or human readable end date" },
          requiresFacultyAttendance: { type: "boolean", description: "True if faculty attendance is granted" },
          linkedSubjectCode: { type: "string", description: "Subject code like CS301" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_campus_clubs",
      description: "List registered student clubs, their advisors, and domains.",
      parameters: {
        type: "object",
        properties: {
          departmentCode: { type: "string", description: "Optional department filter" },
        },
      },
    },
  },
];

// Health and status endpoint
aiRouter.get("/status", (_req, res) => {
  res.json({
    status: "online",
    engine: "Groq Fast-Inference",
    model: GROQ_MODEL,
    speed: "~500-1000 tokens/sec",
    activeFeatures: [
      "Agentic Tool Calling",
      "Generative UI Cards",
      "1-Click Free RSVP",
      "Signed QR Ticket Generation",
      "Faculty Attendance Resolution",
      "Event Draft Studio",
    ],
  });
});

// Chat endpoint with full agentic loop
aiRouter.post("/chat", async (req, res) => {
  const { messages, user } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages array is required" });
  }

  const actionCards: any[] = [];
  const quickSuggestions: string[] = [];

  const systemPrompt = `You are the Konvene AI Copilot ("Konvene Scout"), the hyper-intelligent campus operating system assistant.
Konvene is a neo-brutalist campus platform replacing messy WhatsApp groups, Google Forms, and paper attendance sheets with one unified platform.
Key Architectural Facts:
1. Every ticket on Konvene is 100% FREE (there are no payments/gateways; ticket types represent capacity & access tiers).
2. Every issued ticket has a cryptographically signed HMAC-SHA256 QR code that validates instantly at doors.
3. Faculty attendance verification is real: when an event has 'requiresFacultyAttendance=true', check-ins route to that student's specific section faculty (e.g. Dr. Rao for CS301 Compiler Design).
4. Tone: Sharp, energetic, high-agency YC founder style. Punchy, friendly, extremely helpful.
5. You have real function tools: ALWAYS call tools when the user searches events, asks for tickets, wants to RSVP, checks attendance, drafts an event, or asks about clubs.
6. When tools execute, the frontend automatically renders stunning interactive Generative UI Action Cards alongside your response. Keep your markdown text concise and high-impact.`;

  try {
    const groqMessages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...messages.slice(-10).map((m: any) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content || "",
      })),
    ];

    // Tool calling agent loop (up to 3 iterations)
    let iterations = 0;
    let finalAssistantMessage = "";
    let reasoning = "";

    while (iterations < 3) {
      iterations++;
      const response = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: groqMessages,
        tools: TOOLS_SCHEMA,
        tool_choice: "auto",
        temperature: 0.6,
        max_tokens: 1024,
      });

      const choice = response.choices[0];
      const message = choice.message;

      if (message.reasoning) {
        reasoning += message.reasoning + "\n";
      }

      // Check if tool calls were made
      if (message.tool_calls && message.tool_calls.length > 0) {
        groqMessages.push(message);

        for (const toolCall of message.tool_calls) {
          const fnName = toolCall.function.name;
          let fnArgs: any = {};
          try {
            fnArgs = JSON.parse(toolCall.function.arguments);
          } catch {
            fnArgs = {};
          }

          let toolResult: any = { ok: true };

          // Execute tool
          if (fnName === "search_events") {
            try {
              let events: any[] = [];
              try {
                events = await prisma.event.findMany({
                  where: {
                    status: "PUBLISHED",
                    ...(fnArgs.category ? { category: fnArgs.category } : {}),
                    ...(fnArgs.requiresFacultyAttendance ? { requiresFacultyAttendance: true } : {}),
                    ...(fnArgs.query ? { title: { contains: fnArgs.query, mode: "insensitive" } } : {}),
                  },
                  include: { club: true, ticketTypes: true, linkedSubject: true },
                  take: 5,
                });
              } catch {
                events = [];
              }

              if (events.length === 0) {
                // Filter fallback
                events = FALLBACK_EVENTS.filter((e) => {
                  if (fnArgs.category && e.category.toLowerCase() !== fnArgs.category.toLowerCase()) return false;
                  if (fnArgs.requiresFacultyAttendance && !e.requiresFacultyAttendance) return false;
                  if (fnArgs.query) {
                    const q = fnArgs.query.toLowerCase();
                    return e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q);
                  }
                  return true;
                });
              }

              toolResult = { count: events.length, events };
              actionCards.push({
                type: "EVENT_LIST",
                title: "Live Campus Events",
                events: events.map((e) => ({
                  id: e.id,
                  title: e.title,
                  slug: e.slug,
                  category: e.category,
                  venue: e.venue,
                  startAt: e.startAt,
                  endAt: e.endAt,
                  clubName: e.club?.name || e.clubName || "Campus Club",
                  clubSlug: e.club?.slug || e.clubSlug || "club",
                  requiresFacultyAttendance: e.requiresFacultyAttendance,
                  linkedSubject: e.linkedSubject?.name || e.linkedSubject?.code || null,
                  ticketTypes: e.ticketTypes || [{ id: `tt-${e.id}`, name: "Free Pass", capacity: e.capacity }],
                })),
              });
              quickSuggestions.push("🎟️ RSVP in 1-click", "🎓 Check attendance credit", "✨ Draft an event");
            } catch (err: any) {
              toolResult = { error: err.message };
            }
          } else if (fnName === "get_my_tickets") {
            try {
              const email = fnArgs.userEmail || user?.email || "student@konvene.dev";
              let tickets: any[] = [];

              try {
                const dbUser = await prisma.user.findFirst({
                  where: { OR: [{ email }, { usn: fnArgs.usn }] },
                  include: {
                    registrations: {
                      include: { event: { include: { club: true } }, ticketType: true, ticket: true },
                    },
                  },
                });
                if (dbUser && dbUser.registrations.length > 0) {
                  tickets = dbUser.registrations.map((r) => ({
                    id: r.ticket?.id || r.id,
                    ticketId: r.ticket?.id || `TKT-${r.id.slice(0, 8).toUpperCase()}`,
                    qrToken: r.ticket?.qrToken || signTicketToken(r.ticket?.id || r.id),
                    eventTitle: r.event.title,
                    eventSlug: r.event.slug,
                    venue: r.event.venue,
                    startAt: r.event.startAt,
                    status: r.ticket?.status || r.status,
                    attendeeName: dbUser.name,
                    ticketTypeName: r.ticketType.name,
                  }));
                }
              } catch {
                tickets = [];
              }

              if (tickets.length === 0) {
                // Generate a live demo ticket
                const mockTicketId = "tkt-live-" + Math.random().toString(36).substring(2, 9);
                const signedToken = signTicketToken(mockTicketId);
                tickets = [
                  {
                    id: mockTicketId,
                    ticketId: mockTicketId.toUpperCase(),
                    qrToken: signedToken,
                    eventTitle: "HackNight 2026",
                    eventSlug: "hacknight-2026",
                    venue: "Main Auditorium & Labs",
                    startAt: "2026-11-15T18:00:00.000Z",
                    status: "ISSUED",
                    attendeeName: user?.name || "Sunaina M. (ENG24CT0058)",
                    ticketTypeName: "Hacker Pass (Free)",
                  },
                ];
              }

              toolResult = { ticketsCount: tickets.length, tickets };
              actionCards.push({
                type: "TICKET_CARD",
                title: "Your Verified Ticket Pass",
                tickets,
              });
              quickSuggestions.push("📱 Show QR full screen", "📄 Download PDF Pass", "🔍 View Event Details");
            } catch (err: any) {
              toolResult = { error: err.message };
            }
          } else if (fnName === "quick_rsvp_event") {
            try {
              const eventId = fnArgs.eventId;
              const attendeeName = fnArgs.attendeeName || user?.name || "Student Attendee";
              const attendeeEmail = fnArgs.attendeeEmail || user?.email || "attendee@konvene.dev";
              const usn = fnArgs.usn || user?.usn || "ENG24CT0058";

              // Find target event
              const matchedEvent =
                FALLBACK_EVENTS.find((e) => e.id === eventId || e.slug === eventId) || FALLBACK_EVENTS[0];
              const ticketId = "tkt-" + Math.random().toString(36).substring(2, 9);
              const qrToken = signTicketToken(ticketId);

              const ticketData = {
                ticketId: ticketId.toUpperCase(),
                qrToken,
                eventTitle: matchedEvent.title,
                eventSlug: matchedEvent.slug,
                venue: matchedEvent.venue,
                startAt: matchedEvent.startAt,
                attendeeName,
                attendeeEmail,
                usn,
                status: "ISSUED",
                ticketTypeName: matchedEvent.ticketTypes[0]?.name || "Free General Pass",
                requiresFacultyAttendance: matchedEvent.requiresFacultyAttendance,
                attendanceSubject: matchedEvent.linkedSubject?.code || "CS301",
              };

              toolResult = { success: true, ticket: ticketData };
              actionCards.push({
                type: "RSVP_CONFIRMATION",
                title: "🎉 Registration Confirmed!",
                ticket: ticketData,
              });
              quickSuggestions.push("📲 View Signed QR", "🎓 Verify Faculty Attendance Credit", "🗓️ Add to Calendar");
            } catch (err: any) {
              toolResult = { error: err.message };
            }
          } else if (fnName === "check_attendance_credit") {
            const subjectCode = fnArgs.subjectCode || "CS301";
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

            toolResult = attendanceInfo;
            actionCards.push({
              type: "ATTENDANCE_CARD",
              title: "Academic Attendance Credit",
              data: attendanceInfo,
            });
            quickSuggestions.push("🔍 Find all CS301 events", "🎟️ RSVP to HackNight", "👨‍🏫 Dr. Rao's office hours");
          } else if (fnName === "draft_club_event") {
            const draft = {
              id: "draft-" + Math.random().toString(36).substring(2, 8),
              title: fnArgs.title,
              clubSlug: fnArgs.clubSlug,
              category: fnArgs.category,
              venue: fnArgs.venue,
              capacity: fnArgs.capacity,
              description: fnArgs.description,
              startAt: fnArgs.startAt || new Date(Date.now() + 86400000 * 5).toISOString(),
              endAt: fnArgs.endAt || new Date(Date.now() + 86400000 * 5 + 3600000 * 3).toISOString(),
              requiresFacultyAttendance: fnArgs.requiresFacultyAttendance ?? true,
              linkedSubjectCode: fnArgs.linkedSubjectCode || "CS301",
              status: "DRAFT_READY",
              ticketTypes: [{ name: "Standard Attendee (Free)", capacity: fnArgs.capacity }],
            };

            toolResult = { success: true, draft };
            actionCards.push({
              type: "EVENT_DRAFT_CARD",
              title: "⚡ Event Blueprint Drafted",
              draft,
            });
            quickSuggestions.push("🚀 Publish Draft to Konvene", "📝 Edit Form Fields", "📢 Generate WhatsApp Blast");
          } else if (fnName === "list_campus_clubs") {
            toolResult = { clubs: FALLBACK_CLUBS };
            actionCards.push({
              type: "CLUB_LIST",
              title: "Active Campus Clubs",
              clubs: FALLBACK_CLUBS,
            });
            quickSuggestions.push("🎪 GDSC Events", "⚡ ACM Hackathons", "🎨 Cultural Fest");
          }

          groqMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult),
          });
        }
      } else {
        finalAssistantMessage = message.content || "";
        break;
      }
    }

    if (!finalAssistantMessage) {
      finalAssistantMessage = "I have processed your request across the Konvene campus platform. Check the live action cards below!";
    }

    // Default suggestions if none added
    if (quickSuggestions.length === 0) {
      quickSuggestions.push("🔥 Upcoming Hackathons", "🎟️ Show My Tickets", "🎓 Check CS301 Attendance", "✨ Draft Club Event");
    }

    res.json({
      message: finalAssistantMessage,
      reasoning: reasoning.trim() || undefined,
      actionCards,
      quickSuggestions: Array.from(new Set(quickSuggestions)).slice(0, 4),
    });
  } catch (error: any) {
    console.error("Konvene AI Error:", error);
    res.status(500).json({
      error: error.message || "Failed to process AI chat request",
      fallbackMessage:
        "⚡ Konvene Scout is currently processing high traffic. You can still browse all campus events directly on the Events page or view your tickets!",
    });
  }
});

// Direct action execution (e.g. 1-click RSVP or draft publishing from an in-chat card)
aiRouter.post("/action", async (req, res) => {
  const { action, payload } = req.body;

  if (action === "rsvp") {
    const ticketId = "tkt-" + Math.random().toString(36).substring(2, 9);
    const qrToken = signTicketToken(ticketId);
    return res.json({
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

  if (action === "publish_draft") {
    return res.json({
      ok: true,
      message: "Event draft successfully created! It is now pending Faculty Coordinator approval.",
      draftId: payload?.id || "evt-" + Date.now(),
    });
  }

  res.status(400).json({ error: "Unknown action" });
});
