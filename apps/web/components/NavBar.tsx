"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function NavBar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Discover" },
    ...(user ? [{ href: "/tickets", label: "Tickets" }, { href: "/faculty", label: "Faculty" }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b-[1.5px] border-ink bg-paper/95 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2">
          <span className="flex h-8 w-8 rotate-[-6deg] items-center justify-center rounded-full border-[1.5px] border-ink bg-signal font-display text-sm font-semibold text-paper transition-transform group-hover:rotate-0">
            K
          </span>
          <span className="font-display text-xl font-semibold italic tracking-tight">Konvene</span>
        </Link>

        <div className="hidden items-center gap-6 text-sm font-medium sm:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "relative py-1 transition-colors",
                pathname === l.href ? "text-ink" : "text-inkSoft hover:text-ink"
              )}
            >
              {l.label}
              {pathname === l.href && <span className="absolute -bottom-[17px] left-0 right-0 h-[3px] bg-signal" />}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <span className="hidden font-medium text-inkSoft sm:inline">{user.name}</span>
              <button onClick={logout} className="btn-outline rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="font-medium text-inkSoft hover:text-ink">
                Log in
              </Link>
              <Link href="/signup" className="btn-signal rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide">
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
