"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
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

  if (!result) {
    return <div className="mx-auto h-48 max-w-md animate-pulse rounded-2xl bg-white/[0.03]" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-md text-center"
    >
      {result.valid ? (
        <div className="glass rounded-3xl border-emerald-500/20 p-10">
          <div className="mb-4 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/30">
              <CheckCircle2 className="h-7 w-7 text-emerald-400" />
            </div>
          </div>
          <h1 className="font-display text-xl font-bold text-emerald-300">Certificate Verified</h1>
          <p className="mt-5 font-display text-2xl font-bold">{result.holderName}</p>
          <p className="mt-1 text-white/60">participated in {result.eventTitle}</p>
          <p className="text-sm text-white/40">organized by {result.club}</p>
          <p className="mt-6 text-xs text-white/30">Certificate ID: {result.certId}</p>
        </div>
      ) : (
        <div className="glass rounded-3xl border-red-500/20 p-10">
          <div className="mb-4 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/30">
              <XCircle className="h-7 w-7 text-red-400" />
            </div>
          </div>
          <h1 className="font-display text-xl font-bold text-red-300">Certificate Not Found</h1>
          <p className="mt-2 text-white/60">This certificate ID does not match any issued certificate.</p>
        </div>
      )}
    </motion.div>
  );
}
