"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";

export function Footer() {
  const { user } = useAuth();

  return (
    <footer className="mt-24 border-t-[1.5px] border-ink">
      <div className="overflow-hidden border-b-[1.5px] border-ink bg-ink py-2.5">
        <div className="marquee-track flex w-max gap-8 whitespace-nowrap">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className="flex items-center gap-8 font-mono text-xs uppercase tracking-[0.2em] text-paper">
              Konvene <span className="text-acid">✦</span> Campus Events OS <span className="text-signal">✦</span>
            </span>
          ))}
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 rotate-[-6deg] items-center justify-center rounded-full border-[1.5px] border-ink bg-signal font-display text-xs font-semibold text-paper">
                K
              </span>
              <span className="font-display text-lg font-semibold italic">Konvene</span>
            </div>
            <p className="max-w-xs text-sm text-inkSoft">
              The operating system for campus communities. Built to replace WhatsApp, Google Forms, and a
              clipboard sign-in sheet with something that actually holds up.
            </p>
          </div>
          <div>
            <p className="mb-3 font-mono text-xs font-bold uppercase tracking-wide text-inkSoft">Campus Portal</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-signal">Discover events</Link></li>
              <li><Link href="/clubs" className="hover:text-signal">Clubs & Societies</Link></li>
              <li><Link href="/faculty" className="hover:text-signal">Faculty Attendance Desk</Link></li>
              <li><Link href="/tickets" className="hover:text-signal">My Passes & Tickets</Link></li>
              <li><Link href="/verify" className="hover:text-signal">Verify Certificate</Link></li>
              <li><Link href="/admin" className="hover:text-signal">Deanery Admin</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 font-mono text-xs font-bold uppercase tracking-wide text-inkSoft">Institutional Standards</p>
            <ul className="space-y-2 text-sm text-inkSoft">
              <li>NAAC 'A++' Criterion V Compliance</li>
              <li>Subject Faculty Verified (CS301)</li>
              <li>Cryptographic HMAC-SHA256 Passes</li>
              <li>Public QR Certificate Registry</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t-[1.5px] border-dashed border-ink/30 pt-6 text-xs text-inkSoft sm:flex-row">
          <span>© 2026 Konvene · Department of Computer Science & Engineering · Campus Events & Attendance OS</span>
          <span className="font-mono uppercase tracking-widest">Autonomous Institution · Verified Gate Attendance</span>
        </div>
      </div>
    </footer>
  );
}
