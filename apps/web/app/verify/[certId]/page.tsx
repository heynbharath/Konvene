"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, ShieldCheck, Printer, Download, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { CollegeCertificate, CertificateData } from "@/components/CollegeCertificate";
import { DsuMunCertificate, DsuMunCertData } from "@/components/DsuMunCertificate";

interface VerifyResult {
  valid: boolean;
  holderName?: string;
  eventTitle?: string;
  club?: string;
  issuedAt?: string;
  certId?: string;
  usn?: string;
  subjectCode?: string;
  subjectName?: string;
  facultyName?: string;
}

export default function VerifyPage() {
  const { certId } = useParams<{ certId: string }>();
  const [result, setResult] = useState<VerifyResult | null>(null);

  useEffect(() => {
    api<VerifyResult>(`/verify/${certId}`)
      .then(setResult)
      .catch(() => setResult({ valid: false }));
  }, [certId]);

  if (!result) {
    return (
      <div className="mx-auto max-w-md py-16 text-center space-y-4">
        <div className="h-48 animate-pulse border-[1.5px] border-ink bg-paperAlt" />
        <p className="font-mono text-xs text-inkSoft uppercase tracking-wider">
          Querying Official Accreditation Registry…
        </p>
      </div>
    );
  }

  const certData: CertificateData | null = result.valid
    ? {
        certId: result.certId || certId,
        studentName: result.holderName || "Verified Student",
        usn: result.usn || "ENG24CT0058",
        department: "Department of Computer Science & Engineering",
        section: "5th Semester · Section A",
        eventTitle: result.eventTitle || "HackNight 2026",
        clubName: result.club || "Google Developer Student Club (GDSC)",
        eventDate: result.issuedAt ? new Date(result.issuedAt).toLocaleDateString() : "November 2026",
        venue: "Main Auditorium & Turing Hall",
        subjectCode: result.subjectCode || "CS301",
        subjectName: result.subjectName || "Compiler Design",
        facultyName: result.facultyName || "Dr. Rao",
      }
    : null;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-inkSoft hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Campus Portal
        </Link>
        <span className="font-mono text-xs text-inkSoft">
          Public Verification Engine
        </span>
      </div>

      {result.valid && certData ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Verification Badge */}
          <div className="card p-6 bg-[#F0FDF4] border-[2px] border-moss flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-moss text-paper">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-moss">
                  OFFICIAL INSTITUTIONAL RECORD · AUTHENTICATED
                </span>
                <h1 className="font-display text-2xl font-bold text-ink">
                  Certificate Verified: {result.holderName}
                </h1>
                <p className="text-xs text-inkSoft font-mono mt-0.5">
                  USN: <strong>{result.usn || "ENG24CT0058"}</strong> · Event: <strong>{result.eventTitle}</strong> · Organized by {result.club}
                </p>
              </div>
            </div>

            <div className="text-right font-mono text-xs">
              <span className="bg-moss/20 text-moss px-2.5 py-1 rounded border border-moss font-bold">
                ✓ VALID & ACCREDITED
              </span>
              <p className="text-[10px] text-inkSoft mt-1">ID: {result.certId}</p>
            </div>
          </div>

          {/* Interactive Certificate View */}
          {result.eventTitle?.toLowerCase().includes("mun") || result.eventTitle?.toLowerCase().includes("cope") || certId?.includes("COPE3") ? (
            <DsuMunCertificate
              data={{
                certId: result.certId || certId,
                studentName: result.holderName || "Sunaina Mohapatra",
                usn: result.usn || "ENG24CT0058",
                committee: "UNCSW",
                role: "Delegate of Germany",
                portfolio: "Status of Women",
                issuedAt: result.issuedAt,
                verifyUrl: typeof window !== "undefined" ? window.location.href : undefined,
              }}
              allowCustomize={true}
            />
          ) : (
            <CollegeCertificate data={certData} />
          )}
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-md text-center">
          <div className="card bg-paper p-10 border-[2px] border-berry">
            <div className="mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-[1.5px] border-ink bg-berry text-paper">
                <XCircle className="h-7 w-7" />
              </div>
            </div>
            <h1 className="font-display text-2xl font-bold italic text-berry">Certificate Not Found</h1>
            <p className="mt-2 text-sm text-inkSoft">
              The certificate ID <strong>{certId}</strong> does not match any officially issued academic certificate in our registry.
            </p>
            <div className="mt-6">
              <Link href="/verify" className="btn-signal rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wide">
                Search Another Certificate
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
