"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [usn, setUsn] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signup(name, email, password, usn || undefined);
      router.push("/");
    } catch {
      setError("Could not sign up — email may already be registered.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative mx-auto flex min-h-[70vh] max-w-sm flex-col items-center justify-center">
      <div className="pointer-events-none absolute -top-20 h-72 w-72 animate-float rounded-full bg-fuchsia-500/20 blur-[90px]" />

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="relative w-full">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-fuchsia-500 shadow-lg shadow-brand/30">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-white/45">Join your campus community</p>
        </div>

        <form onSubmit={onSubmit} className="glass space-y-4 rounded-2xl p-6">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">Full name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-brand/50" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">College email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-brand/50" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">USN (optional)</label>
            <input value={usn} onChange={(e) => setUsn(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-brand/50" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">Password</label>
            <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-brand/50" />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            disabled={busy}
            className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Creating account…" : "Sign up"} {!busy && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/40">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-light hover:underline">
            Log in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
