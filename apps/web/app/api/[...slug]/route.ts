import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const AUTH_SECRET = process.env.QR_SIGNING_SECRET || "konvene-demo-auth-secret-key-32chars";
const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY || "";
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

// --- Seed Users across all College Roles ---
const DEMO_USERS: Record<string, { id: string; name: string; email: string; usn?: string; roles: any[] }> = {
  "admin@konvene.dev": {
    id: "usr-admin-demo-id",
    name: "Dr. K. S. Arvind",
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
    name: "Priya Sharma (Club Head)",
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

// --- Seed Events Catalog ---
let EVENTS_CATALOG = [
  {
    id: "evt-dsu-mun-cope-3",
    title: "Dayananda Sagar University Model United Nations – COPE III",
    slug: "dsu-mun-cope-3",
    category: "CONFERENCE",
    venue: "Dayananda Sagar University (DSU Campus), Bengaluru, Karnataka",
    startAt: "2026-10-23T09:00:00.000Z",
    endAt: "2026-10-24T18:00:00.000Z",
    capacity: 350,
    status: "PUBLISHED",
    tagline: "A Pass at the Infinite",
    vision: "AI-First. Future-Ready. — The Future is Being Built at DSU",
    motto: "There is nothing stronger than those two: Patience & Time",
    club: { id: "club-mun", name: "DSU MUNSOC (Model United Nations Society)", slug: "mun-soc" },
    description: "Dayananda Sagar University Model United Nations – COPE Edition III ('A Pass at the Infinite'). The premier flagship collegiate diplomatic conference featuring 4 specialized committees (AIPPM, UNCSW, UNODC, and IPC) with ₹18,000+ total prize pool, mementos, and officially accredited certificates signed by Dean & Faculty Coordinators.",
    requiresFacultyAttendance: true,
    linkedSubject: { name: "Professional Communication & Governance", code: "HU301", facultyName: "Dr. Seema Tharannum / Dr. Sai Prasad" },
    prizePool: "₹ 18,000+",
    awards: ["Best Delegate", "High Commendation", "Special Mention", "Outstanding Press"],
    googleFormUrl: "https://docs.google.com/forms/d/e/1FAIpQLSeLck_D2M8_dn_pv1fMxjKPZ4hm-fCqzOpyMCIhU5qAticMpw/viewform",
    matrixSheetUrl: "https://docs.google.com/spreadsheets/d/1s6RuSa6RZkvZpHEFHXY0pAVZaMvS3TR23hRsWK1NEAY/edit?usp=drivesdk",
    officialEmail: "dsumunsoc@gmail.com",
    contacts: [
      { name: "Aditiya Bidappa", role: "Secretary-General", phone: "+91 86182 20160" },
      { name: "Lakshmi Shree", role: "Chief Advisor", phone: "+91 74063 32416" },
      { name: "K Suchith", role: "Head of Delegate Affairs", phone: "+91 73493 95902" },
      { name: "Pavan V Rao", role: "Director-General", phone: "+91 86182 20160" },
    ],
    committees: [
      {
        name: "AIPPM (All India Political Parties Meet)",
        badge: "Indian Special Committee",
        passType: "Single Delegate Pass",
        agenda: "One Nation, One Election: Ensuring Timely and Inclusive Elections, with Special Emphasis on Electoral-Roll Management, Local Self-Government and Administrative Reforms",
        portfolios: "30+ National Political Leaders (Narendra Modi, Amit Shah, Rahul Gandhi, Mallikarjun Kharge, Arvind Kejriwal, Mamata Banerjee, Yogi Adityanath, M.K. Stalin, etc.)",
      },
      {
        name: "UNCSW (United Nations Commission on the Status of Women)",
        badge: "UN Gender & Human Rights Organ",
        passType: "Single Delegate Pass",
        agenda: "Empowerment of Women through Improvements in Gender Equality and Economic Independence",
        portfolios: "37 Member States (India, USA, UK, Germany, France, Japan, South Africa, Brazil, Australia, etc.)",
      },
      {
        name: "UNODC (United Nations Office on Drugs and Crime)",
        badge: "Double Delegate Committee",
        passType: "Double Delegate Pass (Teams of 2)",
        agenda: "Preventing human and drug trafficking through cross border cooperation",
        portfolios: "30+ Global Member States allocated as paired delegate representations.",
      },
      {
        name: "IPC (International Press Corps)",
        badge: "Press & Media Corps",
        passType: "International Press Corps (IPC) Pass",
        agenda: "Report, conduct press conferences, and question delegates across all committee chambers.",
        portfolios: "International Publications (Reuters, BBC, CNN, Al Jazeera, The Hindu)",
      },
    ],
    ticketTypes: [
      { id: "tt-mun-del", name: "Single Delegate Pass (AIPPM / UNCSW)", capacity: 200 },
      { id: "tt-mun-dbl", name: "Double Delegate Pass (UNODC - Pair of 2)", capacity: 100 },
      { id: "tt-mun-ipc", name: "International Press Corps Pass (IPC)", capacity: 50 },
    ],
    _count: { registrations: 168 },
  },
  {
    id: "evt-hacknight-2026",
    title: "HackNight 2026: 24-Hour Hackathon",
    slug: "hacknight-2026",
    category: "HACKATHON",
    venue: "Main Auditorium & Turing Labs",
    startAt: "2026-11-25T18:00:00.000Z",
    endAt: "2026-11-26T18:00:00.000Z",
    capacity: 250,
    status: "PUBLISHED",
    club: { id: "club-gdsc", name: "Google Developer Student Club (GDSC)", slug: "gdsc" },
    description: "Intensive 24-hour building hackathon with AI, Systems, and Web3 tracks. Official academic credit awarded for CS301 Compiler Design by Dr. Rao.",
    requiresFacultyAttendance: true,
    linkedSubject: { name: "Compiler Design", code: "CS301", facultyName: "Dr. Rao" },
    ticketTypes: [{ id: "tt-hn-free", name: "Hacker Pass (Free)", capacity: 250 }],
    _count: { registrations: 48 },
  },
  {
    id: "evt-ai-agents-workshop",
    title: "Autonomous AI Agents Masterclass & Hack",
    slug: "autonomous-ai-agents",
    category: "WORKSHOP",
    venue: "Turing Lab, CS Block (3rd Floor)",
    startAt: "2026-11-28T14:00:00.000Z",
    endAt: "2026-11-28T17:30:00.000Z",
    capacity: 80,
    status: "PUBLISHED",
    club: { id: "club-acm", name: "ACM Student Chapter", slug: "acm" },
    description: "Hands-on masterclass building LLM tool-calling agents, MCP servers, and local RAG workflows with live certification.",
    requiresFacultyAttendance: true,
    linkedSubject: { name: "Compiler Design", code: "CS301", facultyName: "Dr. Rao" },
    ticketTypes: [{ id: "tt-ai-free", name: "Standard Attendee", capacity: 80 }],
    _count: { registrations: 35 },
  },
  {
    id: "evt-battle-of-bands",
    title: "Battle of the Bands & Annual Cultural Night",
    slug: "battle-of-bands-2026",
    category: "CULTURAL",
    venue: "Open Air Amphitheatre",
    startAt: "2026-11-30T17:30:00.000Z",
    endAt: "2026-11-30T22:00:00.000Z",
    capacity: 600,
    status: "PUBLISHED",
    club: { id: "club-cultural", name: "Campus Cultural Forum", slug: "cultural-forum" },
    description: "Annual intra-college music showcase featuring 12 rock and acoustic bands followed by DJ set.",
    requiresFacultyAttendance: false,
    ticketTypes: [{ id: "tt-fest-free", name: "General Admission", capacity: 600 }],
    _count: { registrations: 120 },
  },
  {
    id: "evt-system-design-talk",
    title: "FAANG System Design & DSA Blueprint",
    slug: "system-design-masterclass",
    category: "TALK",
    venue: "Seminar Hall 1",
    startAt: "2026-12-02T11:00:00.000Z",
    endAt: "2026-12-02T13:00:00.000Z",
    capacity: 150,
    status: "PUBLISHED",
    club: { id: "club-placement", name: "Placement & Training Cell", slug: "placement-cell" },
    description: "Alumni panel breakdown of distributed system interview loops, LLD, and mock whiteboard rounds.",
    requiresFacultyAttendance: true,
    linkedSubject: { name: "Compiler Design", code: "CS301", facultyName: "Dr. Rao" },
    ticketTypes: [{ id: "tt-talk-free", name: "Student Free Pass", capacity: 150 }],
    _count: { registrations: 89 },
  },
  {
    id: "evt-cyber-symposium",
    title: "National Cyber Defense & Ethical Hacking Symposium",
    slug: "cyber-defense-symposium",
    category: "CONFERENCE",
    venue: "Auditorium 2",
    startAt: "2026-12-05T09:30:00.000Z",
    endAt: "2026-12-05T16:00:00.000Z",
    capacity: 200,
    status: "DRAFT",
    club: { id: "club-cyber", name: "Cyber Security & Red Team Society", slug: "cybersec" },
    description: "CTF challenges, reverse engineering sessions, and network defense drills led by certified ethical hackers.",
    requiresFacultyAttendance: true,
    linkedSubject: { name: "Operating Systems", code: "CS302", facultyName: "Dr. Arvind" },
    ticketTypes: [{ id: "tt-cyber-free", name: "Delegate Pass", capacity: 200 }],
    _count: { registrations: 12 },
  },
];

// --- Seed Campus Clubs ---
const CLUBS_CATALOG = [
  {
    id: "club-mun",
    name: "DSU MUNSOC (Model United Nations Society)",
    slug: "mun-soc",
    department: "School of Engineering & Student Affairs, DSU",
    facultyAdvisor: "Dr. Seema Tharannum & Dr. Sai Prasad",
    headName: "Aditiya Bidappa (Secretary-General)",
    established: "2023",
    motto: "There is nothing stronger than those two: Patience & Time",
    officialEmail: "dsumunsoc@gmail.com",
    instagram: "@dsumunsoc",
    secretariatLeaders: "Aditiya Bidappa (SG), K Suchith (Deputy SG), Pavan V Rao (DG), Lakshmi Shree (Chief Advisor)",
    description: "Established in 2023 under Dayananda Sagar University, DSU MUNSOC is dedicated to fostering global diplomacy, multilateral problem-solving, international law, and parliamentary debate. Hosts the annual flagship COPE conference series.",
    memberCount: 165,
    eventsCount: 3,
  },
  {
    id: "club-gdsc",
    name: "Google Developer Student Club (GDSC)",
    slug: "gdsc",
    department: "Computer Science & Engineering",
    facultyAdvisor: "Dr. Rao",
    headName: "Priya Sharma",
    description: "Developer community focusing on web, mobile, cloud technologies, AI, and annual campus hackathons.",
    memberCount: 142,
    eventsCount: 4,
  },
  {
    id: "club-acm",
    name: "ACM Student Chapter",
    slug: "acm",
    department: "Information Science & Engineering",
    facultyAdvisor: "Prof. Arvind",
    headName: "Rohan V.",
    description: "Advancing computing as a science and profession through algorithm masterclasses, ICPC drills, and research talks.",
    memberCount: 98,
    eventsCount: 3,
  },
  {
    id: "club-cultural",
    name: "Campus Cultural Forum",
    slug: "cultural-forum",
    department: "Student Affairs",
    facultyAdvisor: "Dr. Shalini",
    headName: "Ananya M.",
    description: "Orchestrating university annual fests, drama productions, music nights, and inter-collegiate competitions.",
    memberCount: 210,
    eventsCount: 5,
  },
  {
    id: "club-placement",
    name: "Placement & Training Cell",
    slug: "placement-cell",
    department: "Deanery of Career Development",
    facultyAdvisor: "Prof. Suresh",
    headName: "Vikram K.",
    description: "Preparing students for tier-1 campus placements, mock interviews, system design seminars, and resume clinics.",
    memberCount: 85,
    eventsCount: 6,
  },
  {
    id: "club-cyber",
    name: "Cyber Security & Red Team Society",
    slug: "cybersec",
    department: "Computer Science & Engineering",
    facultyAdvisor: "Dr. K. S. Rao",
    headName: "Karthik R.",
    description: "Bug bounty hunters, CTF teams, and cryptography researchers running practical penetration testing labs.",
    memberCount: 64,
    eventsCount: 2,
  },
  {
    id: "club-robotics",
    name: "RoboTech & Mechatronics Guild",
    slug: "robotics-guild",
    department: "Mechanical & Electronics",
    facultyAdvisor: "Dr. P. Nair",
    headName: "Sunaina M.",
    description: "Autonomous robotics, drone dynamics, IoT automation, and combat bot building for national competitions.",
    memberCount: 78,
    eventsCount: 2,
  },
];

// --- Live Attendance Sheet State (The Live Google Sheet for Ma'am) ---
interface AttendanceRecord {
  id: string;
  usn: string;
  studentName: string;
  branch: string;
  section: string;
  semester: number;
  subjectCode: string;
  subjectName: string;
  facultyName: string;
  eventTitle: string;
  clubName: string;
  scannedAt: string;
  method: "QR" | "MANUAL";
  status: "APPROVED" | "PENDING" | "REJECTED";
  certificateId: string | null;
  rejectionReason?: string;
}

let ATTENDANCE_REGISTER: AttendanceRecord[] = [
  {
    id: "att-row-cope3-1",
    usn: "ENG24CT0058",
    studentName: "Sunaina Mohapatra",
    branch: "CSE",
    section: "A",
    semester: 3,
    subjectCode: "HU301",
    subjectName: "Professional Communication & Governance",
    facultyName: "Dr. Seema Tharannum / Dr. Sai Prasad",
    eventTitle: "Dayananda Sagar University Model United Nations COPE 3",
    clubName: "DSU MUNSoc (Model United Nations Society)",
    scannedAt: "2026-11-17T05:00:00.000Z",
    method: "QR" as const,
    status: "APPROVED" as const,
    certificateId: "CERT-COPE3-DSU01",
  },
  {
    id: "att-row-1",
    usn: "1CS21CS001",
    studentName: "Arjun Student",
    branch: "CSE",
    section: "A",
    semester: 5,
    subjectCode: "CS301",
    subjectName: "Compiler Design",
    facultyName: "Dr. Rao",
    eventTitle: "HackNight 2026: 24-Hour Hackathon",
    clubName: "Google Developer Student Club (GDSC)",
    scannedAt: "2026-11-17T04:15:20.000Z",
    method: "QR" as const,
    status: "APPROVED" as const,
    certificateId: "CERT-9A1F3C",
  },
  {
    id: "att-row-2",
    usn: "1CS21CS002",
    studentName: "Meera Student",
    branch: "CSE",
    section: "A",
    semester: 5,
    subjectCode: "CS301",
    subjectName: "Compiler Design",
    facultyName: "Dr. Rao",
    eventTitle: "HackNight 2026: 24-Hour Hackathon",
    clubName: "Google Developer Student Club (GDSC)",
    scannedAt: "2026-11-17T04:22:11.000Z",
    method: "QR" as const,
    status: "APPROVED" as const,
    certificateId: "CERT-8D4E2A",
  },
  {
    id: "att-row-3",
    usn: "ENG24CT0058",
    studentName: "Sunaina Mohapatra",
    branch: "CSE",
    section: "A",
    semester: 3,
    subjectCode: "CS301",
    subjectName: "Compiler Design",
    facultyName: "Dr. Rao",
    eventTitle: "Autonomous AI Agents Masterclass & Hack",
    clubName: "ACM Student Chapter",
    scannedAt: "2026-11-17T04:28:45.000Z",
    method: "QR" as const,
    status: "APPROVED" as const,
    certificateId: "CERT-3B7D9E",
  },
  {
    id: "att-row-4",
    usn: "1CS21CS045",
    studentName: "Rohan Verma",
    branch: "CSE",
    section: "B",
    semester: 5,
    subjectCode: "CS301",
    subjectName: "Compiler Design",
    facultyName: "Dr. Rao",
    eventTitle: "HackNight 2026: 24-Hour Hackathon",
    clubName: "Google Developer Student Club (GDSC)",
    scannedAt: "2026-11-17T04:35:10.000Z",
    method: "MANUAL" as const,
    status: "APPROVED" as const,
    certificateId: "CERT-7E2C1F",
  },
  {
    id: "att-row-5",
    usn: "1CS21CS089",
    studentName: "Pooja Sharma",
    branch: "CSE",
    section: "A",
    semester: 5,
    subjectCode: "CS301",
    subjectName: "Compiler Design",
    facultyName: "Dr. Rao",
    eventTitle: "HackNight 2026: 24-Hour Hackathon",
    clubName: "Google Developer Student Club (GDSC)",
    scannedAt: "2026-11-17T04:40:02.000Z",
    method: "QR" as const,
    status: "PENDING" as const,
    certificateId: null,
  },
  {
    id: "att-row-6",
    usn: "1CS21CS077",
    studentName: "Nikhil Bharath",
    branch: "CSE",
    section: "A",
    semester: 5,
    subjectCode: "CS301",
    subjectName: "Compiler Design",
    facultyName: "Dr. Rao",
    eventTitle: "HackNight 2026: 24-Hour Hackathon",
    clubName: "Google Developer Student Club (GDSC)",
    scannedAt: "2026-11-17T04:42:30.000Z",
    method: "QR" as const,
    status: "PENDING" as const,
    certificateId: null,
  },
];

// Certificates catalog
let CERTIFICATES_DB: Record<string, any> = {
  "CERT-COPE3-DSU01": {
    certId: "CERT-COPE3-DSU01",
    studentName: "Sunaina Mohapatra",
    usn: "ENG24CT0058",
    eventTitle: "Dayananda Sagar University Model United Nations COPE 3",
    club: "DSU MUNSoc",
    issuedAt: "2026-11-17T05:00:00.000Z",
    subjectCode: "HU301",
    subjectName: "Professional Communication & Governance",
    facultyName: "Dr. Seema Tharannum / Dr. Sai Prasad",
    pdfUrl: "/verify/CERT-COPE3-DSU01",
  },
  "CERT-9A1F3C": {
    certId: "CERT-9A1F3C",
    studentName: "Arjun Student",
    usn: "1CS21CS001",
    eventTitle: "HackNight 2026: 24-Hour Hackathon",
    club: "Google Developer Student Club (GDSC)",
    issuedAt: "2026-11-17T04:25:00.000Z",
    subjectCode: "CS301",
    subjectName: "Compiler Design",
    facultyName: "Dr. Rao",
    pdfUrl: "/verify/CERT-9A1F3C",
  },
  "CERT-8D4E2A": {
    certId: "CERT-8D4E2A",
    studentName: "Meera Student",
    usn: "1CS21CS002",
    eventTitle: "HackNight 2026: 24-Hour Hackathon",
    club: "Google Developer Student Club (GDSC)",
    issuedAt: "2026-11-17T04:25:00.000Z",
    subjectCode: "CS301",
    subjectName: "Compiler Design",
    facultyName: "Dr. Rao",
    pdfUrl: "/verify/CERT-8D4E2A",
  },
  "CERT-3B7D9E": {
    certId: "CERT-3B7D9E",
    studentName: "Sunaina Mohapatra",
    usn: "ENG24CT0058",
    eventTitle: "Autonomous AI Agents Masterclass & Hack",
    club: "ACM Student Chapter",
    issuedAt: "2026-11-17T04:30:00.000Z",
    subjectCode: "CS301",
    subjectName: "Compiler Design",
    facultyName: "Dr. Rao",
    pdfUrl: "/verify/CERT-3B7D9E",
  },
  "CERT-7E2C1F": {
    certId: "CERT-7E2C1F",
    studentName: "Rohan Verma",
    usn: "1CS21CS045",
    eventTitle: "HackNight 2026: 24-Hour Hackathon",
    club: "Google Developer Student Club (GDSC)",
    issuedAt: "2026-11-17T04:36:00.000Z",
    subjectCode: "CS301",
    subjectName: "Compiler Design",
    facultyName: "Dr. Rao",
    pdfUrl: "/verify/CERT-7E2C1F",
  },
};

// --- Cryptographic Token Helpers ---
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

// ========================================================
// GET Route Handler
// ========================================================
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const path = slug.join("/");
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const authUser = token ? verifyToken(token) : null;
  const url = new URL(req.url);

  // 1. Current User: /api/users/me
  if (path === "users/me") {
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({
      id: authUser.id,
      name: authUser.name || authUser.email?.split("@")[0] || "User",
      email: authUser.email,
      usn: authUser.usn || (authUser.email?.includes("faculty") ? null : "ENG24CT0058"),
      avatarUrl: null,
      roles: authUser.roles || [
        {
          role: authUser.email?.includes("admin") ? "ADMIN" : authUser.email?.includes("faculty") ? "FACULTY" : "STUDENT",
          scopeType: "GLOBAL",
          scopeId: null,
        },
      ],
      clubMemberships: authUser.email?.includes("clubhead")
        ? [{ club: { id: "club-gdsc", slug: "gdsc", name: "Google Developer Student Club (GDSC)" }, role: "CLUB_HEAD" }]
        : [],
    });
  }

  // 2. Student Tickets: /api/users/me/tickets
  if (path === "users/me/tickets") {
    const mockTicketId = "tkt-dsu-mun-" + (authUser?.id || "demo").slice(0, 6);
    return NextResponse.json([
      {
        id: mockTicketId,
        ticket: {
          id: mockTicketId,
          qrToken: signTicketToken(mockTicketId),
          status: "ISSUED",
        },
        event: EVENTS_CATALOG[0], // DSU MUN COPE 3
        ticketType: { name: "Single Delegate Pass (UNCSW)" },
      },
      {
        id: "tkt-hn-pass-2",
        ticket: {
          id: "tkt-hn-pass-2",
          qrToken: signTicketToken("tkt-hn-pass-2"),
          status: "CHECKED_IN",
        },
        event: EVENTS_CATALOG[1], // HackNight 2026
        ticketType: { name: "Hacker Pass (Free)" },
      },
    ]);
  }

  // 3. Student Certificates: /api/users/me/certificates
  if (path === "users/me/certificates") {
    const certsList = Object.values(CERTIFICATES_DB).map((c) => ({
      certId: c.certId,
      pdfUrl: `/verify/${c.certId}`,
      issuedAt: c.issuedAt,
      event: { title: c.eventTitle },
    }));
    return NextResponse.json(certsList);
  }

  // 4. Live Attendance Sheet: /api/faculty/attendance-sheet
  if (path === "faculty/attendance-sheet") {
    return NextResponse.json(ATTENDANCE_REGISTER);
  }

  // 5. Faculty Pending Attendance: /api/faculty/pending-attendance
  if (path === "faculty/pending-attendance") {
    const pendingRows = ATTENDANCE_REGISTER.filter((r) => r.status === "PENDING").map((r) => ({
      id: r.id,
      status: "PENDING",
      attendanceCandidate: {
        checkIn: {
          ticket: {
            registration: {
              user: {
                name: r.studentName,
                usn: r.usn,
                studentProfile: { section: { name: r.section, year: r.semester } },
              },
              event: { title: r.eventTitle },
            },
          },
        },
      },
    }));
    return NextResponse.json(pendingRows);
  }

  // 6. Faculty Coordinator Pending Events: /api/events/pending-approval/mine
  if (path === "events/pending-approval/mine") {
    const pendingEvents = EVENTS_CATALOG.filter((e) => e.status === "DRAFT" || (e as any).status === "PENDING_APPROVAL");
    return NextResponse.json(pendingEvents);
  }

  // 7. Events Catalog: /api/events
  if (path === "events") {
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

  // 8. Event Detail: /api/events/:slug
  if (path.startsWith("events/") && slug.length === 2) {
    const eventSlug = slug[1];
    const event = EVENTS_CATALOG.find((e) => e.slug === eventSlug || e.id === eventSlug) || EVENTS_CATALOG[0];
    return NextResponse.json({
      ...event,
      form: { schemaJson: "[]" },
    });
  }

  // 9. Event Check-in Stats: /api/events/:id/checkin-stats
  if (path.includes("/checkin-stats")) {
    const checkedInCount = ATTENDANCE_REGISTER.length;
    return NextResponse.json({
      capacity: 250,
      registered: 48,
      checkedIn: checkedInCount,
      noShow: Math.max(0, 48 - checkedInCount),
    });
  }

  // 10. Event Registrations: /api/events/:id/registrations
  if (path.includes("/registrations")) {
    const rows = ATTENDANCE_REGISTER.map((r) => ({
      id: r.id,
      status: "CONFIRMED",
      user: { name: r.studentName, usn: r.usn },
      ticketType: { name: "Hacker Pass (Free)" },
      ticket: { status: r.status === "APPROVED" ? "CHECKED_IN" : "ISSUED" },
    }));
    return NextResponse.json(rows);
  }

  // 11. Checkin Search: /api/checkin/search
  if (path === "checkin/search") {
    const q = url.searchParams.get("q")?.toLowerCase() || "";
    const matched = ATTENDANCE_REGISTER.filter(
      (r) => r.studentName.toLowerCase().includes(q) || r.usn.toLowerCase().includes(q)
    ).map((r) => ({
      id: r.id,
      user: { name: r.studentName, usn: r.usn },
      ticket: { status: r.status === "APPROVED" ? "CHECKED_IN" : "ISSUED" },
    }));
    return NextResponse.json(matched);
  }

  // 12. Campus Clubs Directory: /api/clubs
  if (path === "clubs") {
    return NextResponse.json(CLUBS_CATALOG);
  }

  if (path.startsWith("clubs/") && slug.length === 2) {
    const clubSlug = slug[1];
    const club = CLUBS_CATALOG.find((c) => c.slug === clubSlug) || CLUBS_CATALOG[0];
    return NextResponse.json({
      ...club,
      events: EVENTS_CATALOG.filter((e) => e.club.slug === club.slug || e.club.name.includes(club.name)),
    });
  }

  // 13. Public Certificate Verification: /api/verify/:certId
  if (path.startsWith("verify/") && slug.length === 2) {
    const certId = slug[1];
    const cert = CERTIFICATES_DB[certId];
    if (cert) {
      return NextResponse.json({
        valid: true,
        holderName: cert.studentName,
        eventTitle: cert.eventTitle,
        club: cert.club,
        issuedAt: cert.issuedAt,
        certId: cert.certId,
        usn: cert.usn,
        subjectCode: cert.subjectCode,
        subjectName: cert.subjectName,
        facultyName: cert.facultyName,
      });
    }

    // Try finding in attendance register
    const reg = ATTENDANCE_REGISTER.find((r) => r.certificateId === certId);
    if (reg) {
      return NextResponse.json({
        valid: true,
        holderName: reg.studentName,
        eventTitle: reg.eventTitle,
        club: reg.clubName,
        issuedAt: reg.scannedAt,
        certId,
        usn: reg.usn,
        subjectCode: reg.subjectCode,
        subjectName: reg.subjectName,
        facultyName: reg.facultyName,
      });
    }

    return NextResponse.json({ valid: false }, { status: 404 });
  }

  // 14. Global Platform Stats: /api/stats
  if (path === "stats") {
    return NextResponse.json({
      clubs: CLUBS_CATALOG.length,
      publishedEvents: EVENTS_CATALOG.length,
      registrations: 384,
      certificates: Object.keys(CERTIFICATES_DB).length,
    });
  }

  // 15. Admin Console Stats: /api/admin/stats
  if (path === "admin/stats") {
    return NextResponse.json({
      totalStudents: 1420,
      totalFaculty: 68,
      totalEvents: EVENTS_CATALOG.length,
      attendanceApprovedCount: ATTENDANCE_REGISTER.filter((r) => r.status === "APPROVED").length,
      clubsActive: CLUBS_CATALOG.length,
      departmentBreakdown: [
        { dept: "Computer Science & Engineering", students: 480, attendanceRate: "92%" },
        { dept: "Information Science & Engineering", students: 340, attendanceRate: "88%" },
        { dept: "Electronics & Communication", students: 310, attendanceRate: "84%" },
        { dept: "Mechanical & Robotics", students: 290, attendanceRate: "81%" },
      ],
    });
  }

  // 16. Admin Audit Log: /api/admin/audit-log
  if (path === "admin/audit-log") {
    return NextResponse.json([
      { id: "log-1", action: "ATTENDANCE_CREDITED", actor: "Dr. Rao", target: "CS301 Compiler Design", timestamp: new Date().toISOString() },
      { id: "log-2", action: "CERTIFICATE_ISSUED", actor: "System Daemon", target: "CERT-9A1F3C (Arjun Student)", timestamp: new Date(Date.now() - 3600000).toISOString() },
      { id: "log-3", action: "EVENT_APPROVED", actor: "Dr. Rao", target: "HackNight 2026", timestamp: new Date(Date.now() - 7200000).toISOString() },
      { id: "log-4", action: "GATE_SCAN", actor: "Volunteer Desk", target: "1CS21CS001", timestamp: new Date(Date.now() - 10800000).toISOString() },
    ]);
  }

  return NextResponse.json({ ok: true, path });
}

// ========================================================
// POST Route Handler
// ========================================================
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const path = slug.join("/");
  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  // 1. Auth: /api/auth/login
  if (path === "auth/login") {
    const { email } = body;
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });
    const normalized = String(email).toLowerCase().trim();

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
        user: { id: demo.id, name: demo.name, email: demo.email, usn: demo.usn },
      });
    }

    // Auto-provision
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
      usn: isFaculty || isAdm ? null : "ENG24CT0058",
    });

    return NextResponse.json({
      token,
      refreshToken: "ref_" + userId,
      user: { id: userId, name: derivedName, email: normalized, usn: isFaculty || isAdm ? null : "ENG24CT0058" },
    });
  }

  // 2. Auth: /api/auth/signup
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
      usn: usn || "ENG24CT0058",
      roles,
    });

    return NextResponse.json(
      {
        token,
        refreshToken: "ref_" + userId,
        user: { id: userId, name, email: normalized, usn: usn || "ENG24CT0058" },
      },
      { status: 201 }
    );
  }

  // 3. QR Check-in Verification: /api/checkin/verify
  if (path === "checkin/verify") {
    const { token: qrToken, eventId } = body;
    if (!qrToken) return NextResponse.json({ result: "INVALID", error: "QR token required" }, { status: 400 });

    // Pick or create student record
    const studentName = "Arjun Student";
    const usn = "1CS21CS001";
    const event = EVENTS_CATALOG.find((e) => e.id === eventId) || EVENTS_CATALOG[0];

    // Add to Live Register if not duplicate
    const existing = ATTENDANCE_REGISTER.find((r) => r.usn === usn && r.eventTitle === event.title);
    if (existing && existing.status === "APPROVED") {
      return NextResponse.json({
        result: "DUPLICATE",
        name: studentName,
        usn,
        scannedAt: existing.scannedAt,
      });
    }

    const newRow = {
      id: "att-row-" + Date.now(),
      usn,
      studentName,
      branch: "CSE",
      section: "A",
      semester: 5,
      subjectCode: "CS301",
      subjectName: "Compiler Design",
      facultyName: "Dr. Rao",
      eventTitle: event.title,
      clubName: event.club.name,
      scannedAt: new Date().toISOString(),
      method: "QR" as const,
      status: "APPROVED" as const,
      certificateId: "CERT-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
    };

    ATTENDANCE_REGISTER.unshift(newRow);

    return NextResponse.json({
      result: "SUCCESS",
      name: studentName,
      usn,
      ticketType: "Hacker Pass (Free)",
      routedToFaculty: "Dr. Rao (CS301 Compiler Design)",
      scannedAt: newRow.scannedAt,
    });
  }

  // 4. Manual USN Check-in: /api/checkin/manual
  if (path === "checkin/manual") {
    const query = String(body?.query || body?.registrationId || "").trim().toUpperCase();
    const event = EVENTS_CATALOG.find((e) => e.id === body?.eventId) || EVENTS_CATALOG[0];

    // Map query to student
    let studentName = "Registered Student";
    let usn = query || "1CS21CS001";

    if (query.includes("ARJUN") || query === "1CS21CS001") {
      studentName = "Arjun Student";
      usn = "1CS21CS001";
    } else if (query.includes("MEERA") || query === "1CS21CS002") {
      studentName = "Meera Student";
      usn = "1CS21CS002";
    } else if (query.includes("SUNAINA") || query === "ENG24CT0058") {
      studentName = "Sunaina Mohapatra";
      usn = "ENG24CT0058";
    } else if (query.includes("ROHAN") || query === "1CS21CS045") {
      studentName = "Rohan Verma";
      usn = "1CS21CS045";
    } else if (query.includes("POOJA") || query === "1CS21CS089") {
      studentName = "Pooja Sharma";
      usn = "1CS21CS089";
    }

    const newRow = {
      id: "att-row-" + Date.now(),
      usn,
      studentName,
      branch: "CSE",
      section: "A",
      semester: 5,
      subjectCode: "CS301",
      subjectName: "Compiler Design",
      facultyName: "Dr. Rao",
      eventTitle: event.title,
      clubName: event.club.name,
      scannedAt: new Date().toISOString(),
      method: "MANUAL" as const,
      status: "APPROVED" as const,
      certificateId: "CERT-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
    };

    // Prepend to sheet
    ATTENDANCE_REGISTER.unshift(newRow);

    return NextResponse.json({
      result: "SUCCESS",
      name: studentName,
      usn,
      ticketType: "Hacker Pass (Free)",
      routedToFaculty: "Dr. Rao (CS301 Compiler Design)",
      scannedAt: newRow.scannedAt,
    });
  }

  // 5. Faculty Attendance Approval: /api/faculty/pending-attendance/approve
  if (path === "faculty/pending-attendance/approve") {
    const ids = Array.isArray(body?.ids) ? body.ids : [];
    ATTENDANCE_REGISTER = ATTENDANCE_REGISTER.map((r) => {
      if (ids.includes(r.id) || ids.length === 0) {
        return {
          ...r,
          status: "APPROVED",
          certificateId: r.certificateId || "CERT-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
        };
      }
      return r;
    });

    return NextResponse.json({ approved: ids.length || ATTENDANCE_REGISTER.length });
  }

  // 6. Faculty Attendance Rejection: /api/faculty/pending-attendance/reject
  if (path === "faculty/pending-attendance/reject") {
    const { id, reason } = body;
    ATTENDANCE_REGISTER = ATTENDANCE_REGISTER.map((r) => {
      if (r.id === id) {
        return { ...r, status: "REJECTED", rejectionReason: reason || "Left session early" };
      }
      return r;
    });
    return NextResponse.json({ ok: true, rejected: id });
  }

  // 7. Event Approval: /api/events/:id/approve
  if (path.includes("/approve") && path.startsWith("events/")) {
    const eventId = path.split("/")[1];
    EVENTS_CATALOG = EVENTS_CATALOG.map((e) => (e.id === eventId ? { ...e, status: "PUBLISHED" } : e));
    return NextResponse.json({ ok: true, status: "PUBLISHED" });
  }

  // 8. Event Rejection: /api/events/:id/reject
  if (path.includes("/reject") && path.startsWith("events/")) {
    const eventId = path.split("/")[1];
    EVENTS_CATALOG = EVENTS_CATALOG.map((e) => (e.id === eventId ? { ...e, status: "REJECTED" } : e));
    return NextResponse.json({ ok: true, status: "REJECTED" });
  }

  // 9. Bulk Issue Certificates: /api/events/:id/issue-certificates
  if (path.includes("/issue-certificates")) {
    const eventId = path.split("/")[1];
    const event = EVENTS_CATALOG.find((e) => e.id === eventId) || EVENTS_CATALOG[0];

    const issued: any[] = [];
    ATTENDANCE_REGISTER.forEach((r) => {
      if (!r.certificateId) {
        const certId = "CERT-" + Math.random().toString(36).substring(2, 8).toUpperCase();
        r.certificateId = certId;
        r.status = "APPROVED";
        CERTIFICATES_DB[certId] = {
          certId,
          studentName: r.studentName,
          usn: r.usn,
          eventTitle: r.eventTitle,
          club: r.clubName,
          issuedAt: new Date().toISOString(),
          subjectCode: r.subjectCode,
          subjectName: r.subjectName,
          facultyName: r.facultyName,
        };
        issued.push(CERTIFICATES_DB[certId]);
      }
    });

    return NextResponse.json({ issuedCount: issued.length, certificates: issued });
  }

  // 10. Event Registration: /api/events/:id/register
  if (path.includes("/register")) {
    const ticketId = "tkt-" + Math.random().toString(36).substring(2, 9);
    const qrToken = signTicketToken(ticketId);
    return NextResponse.json({
      registration: { id: "reg-" + ticketId, status: "CONFIRMED" },
      ticket: { id: ticketId, qrToken, status: "ISSUED" },
    });
  }

  // 11. Club Member Addition: /api/clubs/:id/members
  if (path.includes("/members") && path.startsWith("clubs/")) {
    const { email, role } = body;
    return NextResponse.json({
      added: email || "newmember@college.edu",
      role: role || "VOLUNTEER",
    });
  }

  // 12. Scout AI Copilot
  if (path === "ai/chat") {
    const { messages, user } = body;
    const userPrompt = messages?.[messages.length - 1]?.content || "";
    const lower = userPrompt.toLowerCase();
    const actionCards: any[] = [];
    const quickSuggestions: string[] = [];
    let assistantMessage = "";

    if (lower.includes("sheet") || lower.includes("attendance") || lower.includes("live") || lower.includes("ma'am") || lower.includes("faculty")) {
      actionCards.push({
        type: "ATTENDANCE_CARD",
        title: "Official Academic Attendance Register",
        data: {
          subjectCode: "CS301",
          subjectName: "Compiler Design",
          facultyName: "Dr. Rao",
          department: "Department of Computer Science & Engineering",
          section: "5th Semester · Section A & B",
          policy: "Official gate scans automatically sync with the Live Google Sheet attendance register for Dr. Rao's one-click approval.",
          status: "LIVE_SYNC_ACTIVE",
          totalEnrolled: 48,
          creditedCount: ATTENDANCE_REGISTER.filter((r) => r.status === "APPROVED").length,
          eligibleEvents: ["HackNight 2026", "Autonomous AI Agents Workshop"],
        },
      });
      assistantMessage = `⚡ **Live Attendance Sheet is active!** Currently **${ATTENDANCE_REGISTER.filter((r) => r.status === "APPROVED").length} students** have their attendance verified and credited for **CS301: Compiler Design**. You can view or export the official register in the **Faculty Attendance Desk**!`;
      quickSuggestions.push("📋 Open Faculty Desk", "🎓 Generate Certificates", "📷 QR Scanner");
    } else if (lower.includes("cert") || lower.includes("certificate")) {
      assistantMessage = `🎓 **Academic Certificates ready!** All students with credited attendance in CS301 are eligible for an official cryptographic certificate. You can issue or download certificates in high resolution from the **Live Attendance Sheet** or the **Tickets & Passes** page.`;
      quickSuggestions.push("🎓 View Certificates", "🎟️ My Passes", "📊 Export Attendance Sheet");
    } else {
      assistantMessage = `⚡ **Konvene Scout is online!** I can monitor live gate check-ins, verify HMAC passes, update the **Live Attendance Sheet for Dr. Rao**, or issue verified certificates with official college seals. What would you like to do?`;
      quickSuggestions.push("📊 Live Attendance Sheet", "📷 Open QR Scanner", "🎟️ Show My Passes", "🎓 Verify Certificate");
    }

    return NextResponse.json({
      message: assistantMessage,
      actionCards,
      quickSuggestions,
    });
  }

  return NextResponse.json({ ok: true, path });
}
