"use client";

import { Bell, FileText, ExternalLink, Calendar, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Notice {
  id: string;
  date: string;
  title: string;
  category: "ACADEMIC" | "CIRCULAR" | "EVENT";
  issuedBy: string;
  summary: string;
  linkText?: string;
  href?: string;
}

const NOTICES: Notice[] = [
  {
    id: "not-dsu-mun",
    date: "18 Nov 2026",
    category: "EVENT",
    title: "DSU COPE MUN III Flagship Conference & Delegate Pass Allotment",
    issuedBy: "DSU MUNSoc & Dean, School of Engineering",
    summary:
      "Dayananda Sagar University Model United Nations COPE 3 'A Pass at the Infinite' is officially published. Featuring AIPPM, UNCSW, UNODC, and IPC with ₹18,000+ prize pool and accredited institutional certificates.",
    linkText: "View DSU MUN Event",
    href: "/events/dsu-mun-cope-3",
  },
  {
    id: "not-1",
    date: "17 Nov 2026",
    category: "ACADEMIC",
    title: "Official Attendance Credit Sanction for HackNight 2026 (CS301)",
    issuedBy: "Dr. Rao (Assoc. Prof. & Coordinator, CSE)",
    summary:
      "All students attending HackNight 2026 who complete atomic gate check-in will receive 4 formal lecture attendance credits toward CS301 Compiler Design. Verification is routed directly to the faculty register.",
    linkText: "View CS301 Register",
    href: "/faculty",
  },
  {
    id: "not-2",
    date: "15 Nov 2026",
    category: "CIRCULAR",
    title: "Mandatory Digital QR Gate Passes for College Symposia",
    issuedBy: "Office of the Dean, Academic Affairs",
    summary:
      "Physical paper sign-in sheets are officially superseded by Konvene cryptographically signed HMAC passes. Volunteers must verify attendees via the live scanner.",
    linkText: "Check Your Pass",
    href: "/tickets",
  },
  {
    id: "not-3",
    date: "12 Nov 2026",
    category: "EVENT",
    title: "NAAC Accreditation Criterion V: Verifiable Certificate Repository",
    issuedBy: "Internal Quality Assurance Cell (IQAC)",
    summary:
      "All student participation certificates are anchored with unique cryptographic IDs and QR verification. Employers and accreditation inspectors can verify authenticity in real-time.",
    linkText: "Verify Certificate",
    href: "/verify",
  },
];

export function CollegeNoticeBoard() {
  return (
    <div className="mb-14 card p-6 bg-paper border-[1.5px] border-ink shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-[1.5px] border-ink pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-signal text-paper">
            <Bell className="h-3.5 w-3.5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold italic text-ink">
              Official Department Circulars & Academic Notices
            </h3>
            <p className="font-mono text-[10px] text-inkSoft uppercase">
              School of Computer Science & Engineering · Academic Year 2026-27
            </p>
          </div>
        </div>

        <Link
          href="/faculty"
          className="font-mono text-xs font-bold text-signal hover:underline flex items-center gap-1"
        >
          Faculty Portal <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {NOTICES.map((n) => (
          <div
            key={n.id}
            className="border-[1.5px] border-ink/40 bg-paperAlt p-4 flex flex-col justify-between hover:bg-paper transition-colors"
          >
            <div>
              <div className="flex items-center justify-between text-[10px] font-mono mb-2">
                <span className="font-bold text-acid bg-[#15130F] px-2 py-0.5 rounded">
                  {n.category}
                </span>
                <span className="text-inkSoft flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {n.date}
                </span>
              </div>
              <h4 className="font-display text-sm font-bold text-ink leading-snug">
                {n.title}
              </h4>
              <p className="mt-1.5 text-xs text-inkSoft leading-relaxed line-clamp-3">
                {n.summary}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-dashed border-ink/20 flex items-center justify-between text-[11px] font-mono">
              <span className="text-inkSoft text-[10px] truncate max-w-[130px]">
                {n.issuedBy}
              </span>
              {n.href && (
                <Link
                  href={n.href}
                  className="font-bold text-ink hover:text-signal underline decoration-signal"
                >
                  {n.linkText} →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
