"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Search, Award, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function CertificateLookupPage() {
  const [certId, setCertId] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!certId.trim()) return;
    router.push(`/verify/${certId.trim().toUpperCase()}`);
  }

  return (
    <div className="mx-auto max-w-xl py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-[#26231C] border border-[#8C6D3B] px-3.5 py-1 rounded-full text-xs font-mono uppercase tracking-widest text-acid font-bold">
          <ShieldCheck className="h-4 w-4" /> Academic Accreditation Registry
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
          Verify Academic Certificate
        </h1>
        <p className="text-sm text-inkSoft max-w-md mx-auto">
          Enter the unique Certificate ID printed or encoded on any Konvene college certificate to verify authenticity, recipient identity, and accredited attendance hours.
        </p>
      </div>

      {/* Search Card */}
      <div className="card p-6 sm:p-8 bg-paper border-[2px] border-ink shadow-hard">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-mono text-xs uppercase font-bold text-ink mb-1.5">
              Certificate Verification Code / ID
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-inkSoft" />
              <input
                type="text"
                required
                value={certId}
                onChange={(e) => setCertId(e.target.value)}
                placeholder="e.g. CERT-9A1F3C, CERT-8D4E2A..."
                className="w-full border-[1.5px] border-ink bg-paper py-3 pl-10 pr-4 text-base font-mono uppercase tracking-wider outline-none focus:bg-paperAlt"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-signal w-full py-3 text-xs font-bold uppercase tracking-wider rounded-full flex items-center justify-center gap-2"
          >
            <ShieldCheck className="h-4 w-4" /> Authenticate Record
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-dashed border-ink/30">
          <p className="font-mono text-[11px] text-inkSoft uppercase font-bold mb-2">
            Sample Issued Demo Certificates to Test:
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "CERT-COPE3-DSU01", student: "Sunaina M. (DSU MUN COPE 3)" },
              { id: "CERT-9A1F3C", student: "Arjun Student" },
              { id: "CERT-8D4E2A", student: "Meera Student" },
              { id: "CERT-7E2C1F", student: "Rohan Verma" },
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => router.push(`/verify/${c.id}`)}
                className="btn-outline text-[11px] font-mono px-2.5 py-1 rounded bg-paperAlt hover:bg-paper"
              >
                {c.id} ({c.student.split(" ")[0]})
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
