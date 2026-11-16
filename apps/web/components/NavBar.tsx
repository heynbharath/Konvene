"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LayoutDashboard, Building, GraduationCap, ShieldCheck, Ticket, Award } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function NavBar() {
  const { user, logout, hasRole } = useAuth();
  const pathname = usePathname();
  const [clubMenuOpen, setClubMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setClubMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const clubMemberships = user?.clubMemberships ?? [];

  const links = [
    { href: "/", label: "Discover Events" },
    { href: "/clubs", label: "Clubs & Societies" },
    ...(user ? [
      { href: "/faculty", label: "Faculty Desk" },
      { href: "/tickets", label: "My Passes" }
    ] : []),
    { href: "/verify", label: "Verify Certificate" },
    ...(hasRole("ADMIN") ? [{ href: "/admin", label: "Admin Console" }] : []),
  ];

  // User academic role label
  const roleLabel = hasRole("ADMIN")
    ? "🏛️ Dean / Admin"
    : hasRole("FACULTY")
    ? "🎓 Faculty (Dr. Rao · CS301)"
    : hasRole("CLUB_HEAD")
    ? "🎪 Club Head"
    : user
    ? `🎒 Student (${user.usn || "ENG24CT0058"})`
    : null;

  return (
    <header className="sticky top-0 z-50 border-b-[1.5px] border-ink bg-paper/95 backdrop-blur-sm">
      {/* College Institutional Top Header Bar */}
      <div className="bg-[#15130F] text-paper px-4 py-1.5 text-[11px] font-mono flex flex-wrap items-center justify-between border-b border-ink/40">
        <div className="flex items-center gap-2">
          <span className="font-bold text-acid flex items-center gap-1">
            <Building className="h-3 w-3" /> UNIVERSITY INSTITUTE OF TECHNOLOGY
          </span>
          <span className="text-paper/40 hidden sm:inline">|</span>
          <span className="text-paper/80 hidden sm:inline">
            Department of Computer Science & Engineering · NAAC 'A++'
          </span>
        </div>
        <div className="flex items-center gap-3 text-paper/70">
          <span className="hidden md:inline text-[10px]">
            Academic Year 2026–27 · CS301 Attendance Active
          </span>
          <Link href="/verify" className="text-acid hover:underline font-bold text-[10px]">
            Verify Certificate ↗
          </Link>
        </div>
      </div>

      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
        {/* Brand Logo & Name */}
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="flex h-9 w-9 rotate-[-6deg] items-center justify-center rounded-lg border-[1.5px] border-ink bg-signal font-display text-base font-bold text-paper transition-transform group-hover:rotate-0 shadow-sm">
            K
          </div>
          <div>
            <span className="font-display text-xl font-bold italic tracking-tight text-ink block leading-none">
              Konvene
            </span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#8C6D3B] font-bold">
              Campus OS
            </span>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden items-center gap-6 text-xs font-semibold uppercase tracking-wider sm:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "relative py-1 transition-colors",
                pathname === l.href ? "text-ink font-bold" : "text-inkSoft hover:text-ink"
              )}
            >
              {l.label}
              {pathname === l.href && (
                <span className="absolute -bottom-[15px] left-0 right-0 h-[3px] bg-signal" />
              )}
            </Link>
          ))}

          {clubMemberships.length > 0 && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setClubMenuOpen((v) => !v)}
                className="flex items-center gap-1 py-1 text-inkSoft transition-colors hover:text-ink"
              >
                <LayoutDashboard className="h-3.5 w-3.5" /> My Club <ChevronDown className="h-3 w-3" />
              </button>
              {clubMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-56 border-[1.5px] border-ink bg-paper shadow-hard-sm">
                  {clubMemberships.map((m) => (
                    <Link
                      key={m.club.slug}
                      href={`/club/${m.club.slug}/dashboard`}
                      onClick={() => setClubMenuOpen(false)}
                      className="block border-b border-dashed border-ink/20 px-4 py-2.5 text-xs last:border-0 hover:bg-paperAlt"
                    >
                      <div className="font-semibold">{m.club.name}</div>
                      <div className="font-mono text-[10px] uppercase tracking-wide text-inkSoft">
                        {m.role.replace("_", " ")}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Section: Scout AI + Auth Info */}
        <div className="flex items-center gap-3 text-sm">
          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
            className="hidden sm:flex items-center gap-1.5 rounded-full border border-ink bg-paperAlt px-2.5 py-1 text-xs font-bold text-ink hover:bg-paper active:scale-95 transition-all shadow-hard-sm"
            title="Open Konvene Scout AI (⌘K)"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-signal" />
            </span>
            <span>Scout AI</span>
            <span className="font-mono text-[10px] text-inkSoft">⌘K</span>
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              {roleLabel && (
                <span className="hidden lg:inline font-mono text-[11px] bg-paperAlt px-2.5 py-1 border border-ink/30 rounded font-semibold text-ink">
                  {roleLabel}
                </span>
              )}
              <button
                onClick={logout}
                className="btn-outline rounded-full px-3.5 py-1 text-xs font-semibold uppercase tracking-wide"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="font-medium text-xs font-mono uppercase text-inkSoft hover:text-ink">
                Log in
              </Link>
              <Link
                href="/signup"
                className="btn-signal rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
