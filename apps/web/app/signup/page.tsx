"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
    } catch (err: any) {
      setError("Could not sign up — email may already be registered.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-bold">Create your Konvene account</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <input required placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-surfaceAlt px-3 py-2 outline-none focus:border-brand" />
        <input type="email" required placeholder="College email" value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-surfaceAlt px-3 py-2 outline-none focus:border-brand" />
        <input placeholder="USN (optional)" value={usn} onChange={(e) => setUsn(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-surfaceAlt px-3 py-2 outline-none focus:border-brand" />
        <input type="password" required minLength={8} placeholder="Password (min 8 chars)" value={password} onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-surfaceAlt px-3 py-2 outline-none focus:border-brand" />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button disabled={busy} className="w-full rounded-lg bg-brand py-2 font-medium hover:bg-brand-dark disabled:opacity-50">
          {busy ? "Creating account…" : "Sign up"}
        </button>
      </form>
    </div>
  );
}
