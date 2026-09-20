"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";

export function NavBar() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-white/10 bg-surfaceAlt/60 backdrop-blur sticky top-0 z-10">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight">
          <span className="text-brand">Konvene</span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/" className="hover:text-brand">Discover</Link>
          {user && <Link href="/tickets" className="hover:text-brand">My Tickets</Link>}
          {user && <Link href="/faculty" className="hover:text-brand">Faculty</Link>}
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-white/60">{user.name}</span>
              <button onClick={logout} className="rounded-md bg-white/10 px-3 py-1.5 hover:bg-white/20">
                Log out
              </button>
            </div>
          ) : (
            <>
              <Link href="/login" className="hover:text-brand">Log in</Link>
              <Link href="/signup" className="rounded-md bg-brand px-3 py-1.5 font-medium hover:bg-brand-dark">
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
