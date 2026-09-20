"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

export function NavBar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Discover" },
    ...(user ? [{ href: "/tickets", label: "My Tickets" }, { href: "/faculty", label: "Faculty" }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-surface/70 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-fuchsia-500 shadow-lg shadow-brand/30 transition-transform group-hover:scale-105">
            <Sparkles className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">Konvene</span>
        </Link>

        <div className="hidden items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.02] p-1 sm:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                pathname === l.href ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <span className="hidden text-white/50 sm:inline">{user.name}</span>
              <button onClick={logout} className="btn-ghost rounded-full px-4 py-2 font-medium">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="px-2 text-white/70 hover:text-white">
                Log in
              </Link>
              <Link href="/signup" className="btn-primary rounded-full px-4 py-2 font-medium text-white">
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
