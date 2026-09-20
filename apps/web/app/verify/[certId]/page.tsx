"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";

interface VerifyResult {
  valid: boolean;
  holderName?: string;
  eventTitle?: string;
  club?: string;
  issuedAt?: string;
  certId?: string;
}

export default function VerifyPage() {
  const { certId } = useParams<{ certId: string }>();
  const [result, setResult] = useState<VerifyResult | null>(null);

  useEffect(() => {
    api<VerifyResult>(`/verify/${certId}`).then(setResult).catch(() => setResult({ valid: false }));
  }, [certId]);

  if (!result) return <p className="text-white/50">Verifying…</p>;

  return (
    <div className="mx-auto max-w-md text-center">
      {result.valid ? (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-8">
          <div className="mb-2 text-3xl">✅</div>
          <h1 className="text-xl font-bold text-emerald-400">Certificate Verified</h1>
          <p className="mt-4 text-lg font-semibold">{result.holderName}</p>
          <p className="text-white/70">participated in {result.eventTitle}</p>
          <p className="text-sm text-white/50">organized by {result.club}</p>
          <p className="mt-4 text-xs text-white/40">Certificate ID: {result.certId}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-8">
          <div className="mb-2 text-3xl">❌</div>
          <h1 className="text-xl font-bold text-red-400">Certificate Not Found</h1>
          <p className="mt-2 text-white/70">This certificate ID does not match any issued certificate.</p>
        </div>
      )}
    </div>
  );
}
